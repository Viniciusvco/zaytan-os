import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !externalKey) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    let percentOverrides: Record<string, number> | undefined;
    let importMode: "new_only" | "all" = "new_only";
    let targetClientIds: string[] | undefined;
    try {
      const body = await req.json();
      percentOverrides = body?.percent_overrides;
      importMode = body?.import_mode === "all" ? "all" : "new_only";
      targetClientIds = body?.target_client_ids; // specific clients to import for
    } catch {
      // no body is fine
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    // Get contracts
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select("client_id, weekly_investment, clients(id, name)")
      .eq("status", "ativo")
      .gt("weekly_investment", 0);

    if (contractsError) {
      return new Response(JSON.stringify({ error: contractsError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contracts || contracts.length === 0) {
      return new Response(JSON.stringify({ error: "No active contracts with investment found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientInvestments: Record<string, { name: string; investment: number }> = {};
    for (const c of contracts) {
      const cid = c.client_id;
      const name = (c.clients as any)?.name || "Unknown";
      if (!clientInvestments[cid]) {
        clientInvestments[cid] = { name, investment: 0 };
      }
      clientInvestments[cid].investment += Number(c.weekly_investment);
    }

    // If target clients specified, filter to only those
    let clientIds = Object.keys(clientInvestments);
    if (targetClientIds && targetClientIds.length > 0) {
      clientIds = clientIds.filter(cid => targetClientIds!.includes(cid));
      if (clientIds.length === 0) {
        return new Response(JSON.stringify({ error: "Selected clients have no active contracts with investment" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const totalInvestment = clientIds.reduce((s, cid) => s + clientInvestments[cid].investment, 0);
    if (totalInvestment <= 0) {
      return new Response(JSON.stringify({ error: "Total investment is zero" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate percentages
    const clientPercentages: Record<string, number> = {};
    if (percentOverrides && Object.keys(percentOverrides).length > 0) {
      let overriddenTotal = 0;
      let remainingInvestment = totalInvestment;
      for (const cid of clientIds) {
        if (percentOverrides[cid] !== undefined) {
          clientPercentages[cid] = percentOverrides[cid];
          overriddenTotal += percentOverrides[cid];
          remainingInvestment -= clientInvestments[cid].investment;
        }
      }
      const remainingPercent = 100 - overriddenTotal;
      for (const cid of clientIds) {
        if (percentOverrides[cid] === undefined) {
          clientPercentages[cid] = remainingInvestment > 0
            ? (clientInvestments[cid].investment / remainingInvestment) * remainingPercent
            : remainingPercent / clientIds.filter(id => percentOverrides![id] === undefined).length;
        }
      }
    } else {
      for (const cid of clientIds) {
        clientPercentages[cid] = (clientInvestments[cid].investment / totalInvestment) * 100;
      }
    }

    // Get existing leads per target client to check for duplicates (by ext_id)
    const existingLeadsByClient: Record<string, Map<string, { id: string; status: string }>> = {};
    for (const cid of clientIds) {
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id, notes, status")
        .eq("client_id", cid)
        .eq("source", "leads_laportec_star5");

      const map = new Map<string, { id: string; status: string }>();
      for (const l of existingLeads || []) {
        if (l.notes) {
          const match = l.notes.match(/ext_id:(\d+)/);
          if (match) {
            map.set(match[1], { id: l.id, status: l.status });
          }
        }
      }
      existingLeadsByClient[cid] = map;
    }

    // Fetch external leads
    const { data: externalLeads, error: extError } = await externalSupabase
      .from("leads_laportec_star5")
      .select("*");

    if (extError) {
      return new Response(JSON.stringify({ error: `External query failed: ${extError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allExternalLeads = externalLeads || [];
    if (allExternalLeads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No external leads found", total_new_leads: 0, total_inserted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect ALL unique ext_ids already synced across ALL target clients
    const allSyncedExtIds = new Set<string>();
    for (const cid of clientIds) {
      for (const extId of existingLeadsByClient[cid].keys()) {
        allSyncedExtIds.add(`${cid}:${extId}`);
      }
    }

    const totalLeads = allExternalLeads.length;

    // Distribute leads based on percentages
    const shares: { clientId: string; raw: number; rounded: number }[] = clientIds.map((cid) => {
      const pct = clientPercentages[cid] / 100;
      return { clientId: cid, raw: pct * totalLeads, rounded: Math.floor(pct * totalLeads) };
    });

    let distributed = shares.reduce((s, sh) => s + sh.rounded, 0);
    let remainder = totalLeads - distributed;
    const byFraction = [...shares].sort((a, b) => (b.raw - b.rounded) - (a.raw - a.rounded));
    for (let i = 0; i < remainder; i++) {
      byFraction[i % byFraction.length].rounded++;
    }

    const assignmentMap: Record<string, number> = {};
    for (const sh of shares) {
      assignmentMap[sh.clientId] = sh.rounded;
    }

    // Assign leads to clients
    const clientQueues: Record<string, number> = { ...assignmentMap };
    const leadAssignments: Array<{ lead: any; clientId: string }> = [];

    for (const lead of allExternalLeads) {
      let bestClient = clientIds[0];
      let bestRemaining = 0;
      for (const cid of clientIds) {
        if ((clientQueues[cid] || 0) > bestRemaining) {
          bestRemaining = clientQueues[cid];
          bestClient = cid;
        }
      }
      clientQueues[bestClient]--;
      leadAssignments.push({ lead, clientId: bestClient });
    }

    // Now process: insert new, skip/update existing (NEVER change status of existing leads)
    const leadsToInsert: any[] = [];
    const leadsToUpdate: any[] = [];
    const skippedCount: Record<string, number> = {};
    const insertedCount: Record<string, number> = {};

    for (const { lead, clientId } of leadAssignments) {
      const extId = String(lead["ID Lead"]);
      const existingMap = existingLeadsByClient[clientId];
      const existing = existingMap.get(extId);

      if (existing) {
        if (importMode === "all") {
          // Update non-status fields only (preserve kanban position)
          leadsToUpdate.push({
            id: existing.id,
            name: lead["Nome"] || "Lead sem nome",
            email: lead["Email"] || null,
            phone: lead["Telefone"] || null,
            financing_type: lead["Qual tipo de financiamento"] || null,
            installment_value: lead["Valor das parcelas"] || null,
            lead_entry_date: lead["Data da Entrada do Lead"] ? new Date(lead["Data da Entrada do Lead"]).toISOString() : null,
            // DO NOT update status - preserve kanban position
          });
        }
        skippedCount[clientId] = (skippedCount[clientId] || 0) + 1;
      } else {
        // New lead for this client
        leadsToInsert.push({
          client_id: clientId,
          name: lead["Nome"] || "Lead sem nome",
          email: lead["Email"] || null,
          phone: lead["Telefone"] || null,
          source: "leads_laportec_star5",
          status: "novo",
          notes: `ext_id:${extId}`,
          financing_type: lead["Qual tipo de financiamento"] || null,
          installment_value: lead["Valor das parcelas"] || null,
          lead_entry_date: lead["Data da Entrada do Lead"] ? new Date(lead["Data da Entrada do Lead"]).toISOString() : null,
        });
        insertedCount[clientId] = (insertedCount[clientId] || 0) + 1;
      }
    }

    // Batch insert new leads
    const BATCH_SIZE = 50;
    let totalInserted = 0;
    for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
      const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase.from("leads").insert(batch);
      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Insert failed at batch ${i}: ${insertError.message}`, inserted_so_far: totalInserted }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      totalInserted += batch.length;
    }

    // Batch update existing leads (data only, no status change)
    let totalUpdated = 0;
    for (const upd of leadsToUpdate) {
      const { id, ...fields } = upd;
      const { error: updError } = await supabase.from("leads").update(fields).eq("id", id);
      if (!updError) totalUpdated++;
    }

    const distribution = clientIds.map((cid) => ({
      client_id: cid,
      client_name: clientInvestments[cid].name,
      investment: clientInvestments[cid].investment,
      percentage: Math.round(clientPercentages[cid] * 100) / 100,
      leads_assigned: insertedCount[cid] || 0,
      leads_existing: skippedCount[cid] || 0,
      leads_updated: importMode === "all" ? (skippedCount[cid] || 0) : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        total_external_leads: totalLeads,
        total_inserted: totalInserted,
        total_updated: totalUpdated,
        distribution,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
