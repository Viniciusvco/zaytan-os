import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const { action, campaign_id, leads, lead_queue_ids, target_client_id, performed_by } = body;

    // Action: ingest — add leads to queue with dedup check
    if (action === "ingest") {
      if (!campaign_id || !leads?.length) {
        return jsonRes({ error: "campaign_id and leads[] required" }, 400);
      }

      const campaign = await getCampaign(supabase, campaign_id);
      if (!campaign) return jsonRes({ error: "Campaign not found" }, 404);

      const results = { inserted: 0, duplicated: 0, details: [] as any[] };

      for (const lead of leads) {
        // Dedup check by phone or email
        const isDuplicate = await checkDuplicate(supabase, campaign_id, lead.phone, lead.email);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + campaign.stock_expiry_days);

        const status = isDuplicate ? "duplicado" : "pendente";

        const { data: inserted, error } = await supabase.from("lead_queue").insert({
          campaign_id,
          name: lead.name || "Lead sem nome",
          phone: lead.phone || null,
          email: lead.email || null,
          source: lead.source || null,
          status,
          expires_at: expiresAt.toISOString(),
          raw_data: lead.raw_data || null,
        }).select("id").single();

        if (error) {
          results.details.push({ name: lead.name, error: error.message });
        } else {
          if (isDuplicate) {
            results.duplicated++;
            results.details.push({ id: inserted.id, name: lead.name, status: "duplicado" });
          } else {
            results.inserted++;
            results.details.push({ id: inserted.id, name: lead.name, status: "pendente" });
          }
        }
      }

      return jsonRes({ success: true, ...results });
    }

    // Action: distribute — distribute pending leads in a campaign
    if (action === "distribute") {
      if (!campaign_id) return jsonRes({ error: "campaign_id required" }, 400);

      const campaign = await getCampaign(supabase, campaign_id);
      if (!campaign) return jsonRes({ error: "Campaign not found" }, 404);

      // Get active, non-paused campaign clients
      const { data: campaignClients, error: ccErr } = await supabase
        .from("campaign_clients")
        .select("*, clients(name)")
        .eq("campaign_id", campaign_id)
        .eq("paused", false);

      if (ccErr || !campaignClients?.length) {
        return jsonRes({ error: "No active clients in campaign" }, 400);
      }

      const today = new Date().toISOString().split("T")[0];

      // Reset daily counters if needed
      for (const cc of campaignClients) {
        if (cc.last_reset_date !== today) {
          await supabase.from("campaign_clients").update({
            leads_received_today: 0,
            last_reset_date: today,
          }).eq("id", cc.id);
          cc.leads_received_today = 0;
          cc.last_reset_date = today;
        }
      }

      // Get pending leads
      const { data: pendingLeads } = await supabase
        .from("lead_queue")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("status", "pendente")
        .order("created_at", { ascending: true });

      if (!pendingLeads?.length) {
        return jsonRes({ success: true, message: "No pending leads", distributed: 0 });
      }

      let distributed = 0;
      let stocked = 0;

      for (const lead of pendingLeads) {
        // Mark as processing
        await supabase.from("lead_queue").update({ status: "em_processamento" }).eq("id", lead.id);

        // Find eligible clients (not at daily limit)
        const eligible = campaignClients.filter(cc => {
          if (cc.daily_limit !== null && cc.leads_received_today >= cc.daily_limit) return false;
          return true;
        });

        if (eligible.length === 0) {
          // All clients at limit — send to stock (general)
          await supabase.from("lead_queue").update({
            status: "estoque",
            stock_client_id: null,
          }).eq("id", lead.id);

          stocked++;
          continue;
        }

        // Find client with highest accumulated balance (Largest Remainder method)
        eligible.sort((a, b) => Number(b.accumulated_balance) - Number(a.accumulated_balance));
        const winner = eligible[0];

        // Distribute lead
        await supabase.from("lead_queue").update({
          status: "distribuido",
          assigned_client_id: winner.client_id,
          distribution_rule: "proporcional",
          distributed_at: new Date().toISOString(),
        }).eq("id", lead.id);

        // Update client counters
        const newBalance = Number(winner.accumulated_balance) - 1 + (Number(winner.weight_percent) / 100);
        winner.leads_received_today++;
        winner.accumulated_balance = newBalance;

        await supabase.from("campaign_clients").update({
          leads_received_today: winner.leads_received_today,
          accumulated_balance: newBalance,
        }).eq("id", winner.id);

        // Update other clients' accumulated balances (they didn't receive, so balance grows)
        for (const cc of campaignClients) {
          if (cc.id !== winner.id && !cc.paused) {
            const updatedBalance = Number(cc.accumulated_balance) + (Number(cc.weight_percent) / 100);
            cc.accumulated_balance = updatedBalance;
            await supabase.from("campaign_clients").update({
              accumulated_balance: updatedBalance,
            }).eq("id", cc.id);
          }
        }

        // Audit log
        await supabase.from("distribution_logs").insert({
          lead_queue_id: lead.id,
          client_id: winner.client_id,
          campaign_id,
          rule_applied: "proporcional",
          weight_at_distribution: winner.weight_percent,
          accumulated_balance_at: newBalance,
          status_before: "pendente",
          status_after: "distribuido",
          performed_by: performed_by || null,
        });

        // Also insert into leads table for CRM
        await supabase.from("leads").insert({
          client_id: winner.client_id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source || "motor_revisional",
          status: "novo",
          notes: `lead_queue_id:${lead.id}`,
          lead_entry_date: new Date().toISOString(),
        });

        distributed++;
      }

      return jsonRes({
        success: true,
        distributed,
        stocked,
        total_pending: pendingLeads.length,
      });
    }

    // Action: send_stock — manually send stock leads to a client
    if (action === "send_stock") {
      if (!lead_queue_ids?.length || !target_client_id) {
        return jsonRes({ error: "lead_queue_ids[] and target_client_id required" }, 400);
      }

      let sent = 0;
      for (const lqId of lead_queue_ids) {
        const { data: lead } = await supabase.from("lead_queue").select("*").eq("id", lqId).single();
        if (!lead || lead.status !== "estoque") continue;

        // Check daily limit
        const { data: cc } = await supabase
          .from("campaign_clients")
          .select("*")
          .eq("campaign_id", lead.campaign_id)
          .eq("client_id", target_client_id)
          .single();

        if (cc?.daily_limit !== null && cc && cc.leads_received_today >= cc.daily_limit) {
          continue; // Skip - at daily limit
        }

        await supabase.from("lead_queue").update({
          status: "distribuido",
          assigned_client_id: target_client_id,
          distribution_rule: "manual",
          distributed_at: new Date().toISOString(),
        }).eq("id", lqId);

        if (cc) {
          await supabase.from("campaign_clients").update({
            leads_received_today: cc.leads_received_today + 1,
          }).eq("id", cc.id);
        }

        // Audit log
        await supabase.from("distribution_logs").insert({
          lead_queue_id: lqId,
          client_id: target_client_id,
          campaign_id: lead.campaign_id,
          rule_applied: "manual",
          weight_at_distribution: cc?.weight_percent || 0,
          accumulated_balance_at: cc?.accumulated_balance || 0,
          status_before: "estoque",
          status_after: "distribuido",
          performed_by: performed_by || null,
        });

        // Insert into CRM leads
        await supabase.from("leads").insert({
          client_id: target_client_id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source || "motor_revisional",
          status: "novo",
          notes: `lead_queue_id:${lead.id} (estoque)`,
          lead_entry_date: new Date().toISOString(),
        });

        sent++;
      }

      return jsonRes({ success: true, sent });
    }

    // Action: expire_stock — mark expired stock leads
    if (action === "expire_stock") {
      const now = new Date().toISOString();
      const { data: expired, error } = await supabase
        .from("lead_queue")
        .update({ status: "expirado" })
        .eq("status", "estoque")
        .lt("expires_at", now)
        .select("id");

      return jsonRes({ success: true, expired_count: expired?.length || 0 });
    }

    // Action: metrics — get monitoring metrics for a campaign
    if (action === "metrics") {
      if (!campaign_id) return jsonRes({ error: "campaign_id required" }, 400);

      const today = new Date().toISOString().split("T")[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;

      const [
        { count: totalToday },
        { count: distributedToday },
        { data: stockByClient },
        { count: expiredCount },
        { count: duplicateCount },
        { count: processingCount },
        { data: lastDist },
        { data: clientMetrics },
      ] = await Promise.all([
        supabase.from("lead_queue").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign_id).gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("lead_queue").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign_id).eq("status", "distribuido")
          .gte("distributed_at", todayStart).lte("distributed_at", todayEnd),
        supabase.from("lead_queue").select("stock_client_id, assigned_client_id")
          .eq("campaign_id", campaign_id).eq("status", "estoque"),
        supabase.from("lead_queue").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign_id).eq("status", "expirado"),
        supabase.from("lead_queue").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign_id).eq("status", "duplicado"),
        supabase.from("lead_queue").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign_id).eq("status", "em_processamento"),
        supabase.from("distribution_logs").select("created_at")
          .eq("campaign_id", campaign_id).order("created_at", { ascending: false }).limit(1),
        supabase.from("campaign_clients").select("*, clients(name)")
          .eq("campaign_id", campaign_id),
      ]);

      return jsonRes({
        total_leads_today: totalToday || 0,
        distributed_today: distributedToday || 0,
        stock_count: stockByClient?.length || 0,
        expired_count: expiredCount || 0,
        duplicate_pending: duplicateCount || 0,
        processing_stuck: processingCount || 0,
        last_distribution: lastDist?.[0]?.created_at || null,
        clients: (clientMetrics || []).map((cc: any) => ({
          client_id: cc.client_id,
          client_name: cc.clients?.name || "—",
          weight_percent: cc.weight_percent,
          weight_override: cc.weight_override,
          daily_limit: cc.daily_limit,
          leads_received_today: cc.leads_received_today,
          accumulated_balance: cc.accumulated_balance,
          paused: cc.paused,
          investment: cc.investment_amount,
        })),
      });
    }

    return jsonRes({ error: "Unknown action. Use: ingest, distribute, send_stock, expire_stock, metrics" }, 400);

  } catch (error) {
    return jsonRes({ error: (error as Error).message }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCampaign(supabase: any, id: string) {
  const { data } = await supabase.from("campaigns").select("*").eq("id", id).single();
  return data;
}

async function checkDuplicate(supabase: any, campaignId: string, phone?: string, email?: string): Promise<boolean> {
  if (!phone && !email) return false;

  let query = supabase.from("lead_queue")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["distribuido", "pendente", "em_processamento", "estoque"]);

  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else if (phone) {
    query = query.eq("phone", phone);
  } else {
    query = query.eq("email", email);
  }

  const { count } = await query;
  return (count || 0) > 0;
}
