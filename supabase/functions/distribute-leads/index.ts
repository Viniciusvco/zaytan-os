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
    // Internal Supabase (Lovable Cloud)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // External Supabase
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !externalKey) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    // 1. Get all active contracts with weekly_investment > 0
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

    // Aggregate investment per client (a client may have multiple contracts)
    const clientInvestments: Record<string, { name: string; investment: number }> = {};
    for (const c of contracts) {
      const cid = c.client_id;
      const name = (c.clients as any)?.name || "Unknown";
      if (!clientInvestments[cid]) {
        clientInvestments[cid] = { name, investment: 0 };
      }
      clientInvestments[cid].investment += Number(c.weekly_investment);
    }

    const totalInvestment = Object.values(clientInvestments).reduce((s, c) => s + c.investment, 0);
    if (totalInvestment <= 0) {
      return new Response(JSON.stringify({ error: "Total investment is zero" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch external leads that haven't been synced yet
    // Get already synced lead IDs (stored in notes field as external ID)
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("notes")
      .eq("source", "leads_laportec_star5");

    const syncedIds = new Set(
      (existingLeads || [])
        .map((l) => l.notes)
        .filter(Boolean)
        .map((n) => {
          const match = n!.match(/ext_id:(\d+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    );

    // Fetch all external leads
    const { data: externalLeads, error: extError } = await externalSupabase
      .from("leads_laportec_star5")
      .select("*");

    if (extError) {
      return new Response(JSON.stringify({ error: `External query failed: ${extError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out already synced
    const newLeads = (externalLeads || []).filter(
      (l) => !syncedIds.has(String(l["ID Lead"]))
    );

    if (newLeads.length === 0) {
      // Return current distribution preview even if no new leads
      const clientIds = Object.keys(clientInvestments);
      const distribution = clientIds.map((cid) => ({
        client_id: cid,
        client_name: clientInvestments[cid].name,
        investment: clientInvestments[cid].investment,
        percentage: Math.round((clientInvestments[cid].investment / totalInvestment) * 10000) / 100,
        leads_assigned: 0,
      }));

      return new Response(
        JSON.stringify({ message: "No new leads to distribute", distribution, total_new_leads: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Distribute leads proportionally
    const totalLeads = newLeads.length;
    const clientIds = Object.keys(clientInvestments);

    // Calculate raw shares
    const shares: { clientId: string; raw: number; rounded: number }[] = clientIds.map((cid) => {
      const pct = clientInvestments[cid].investment / totalInvestment;
      return { clientId: cid, raw: pct * totalLeads, rounded: Math.floor(pct * totalLeads) };
    });

    // Distribute remainder to client(s) with largest fractional parts
    let distributed = shares.reduce((s, sh) => s + sh.rounded, 0);
    let remainder = totalLeads - distributed;

    // Sort by fractional part descending
    const byFraction = [...shares].sort((a, b) => (b.raw - b.rounded) - (a.raw - a.rounded));
    for (let i = 0; i < remainder; i++) {
      byFraction[i % byFraction.length].rounded++;
    }

    // Build assignment map
    const assignmentMap: Record<string, number> = {};
    for (const sh of shares) {
      assignmentMap[sh.clientId] = sh.rounded;
    }

    // 4. Assign leads round-robin per client allocation
    const leadsToInsert: any[] = [];
    const clientQueues: Record<string, number> = { ...assignmentMap };

    for (const lead of newLeads) {
      // Find client with most remaining allocation
      let bestClient = clientIds[0];
      let bestRemaining = 0;
      for (const cid of clientIds) {
        if ((clientQueues[cid] || 0) > bestRemaining) {
          bestRemaining = clientQueues[cid];
          bestClient = cid;
        }
      }

      clientQueues[bestClient]--;

      leadsToInsert.push({
        client_id: bestClient,
        name: lead["Nome"] || "Lead sem nome",
        email: lead["Email"] || null,
        phone: lead["Telefone"] || null,
        source: "leads_laportec_star5",
        status: "novo",
        notes: `ext_id:${lead["ID Lead"]}`,
      });
    }

    // 5. Insert leads in batches
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
      const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase.from("leads").insert(batch);
      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Insert failed at batch ${i}: ${insertError.message}`, inserted_so_far: insertedCount }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      insertedCount += batch.length;
    }

    // 6. Build distribution summary
    const distribution = clientIds.map((cid) => ({
      client_id: cid,
      client_name: clientInvestments[cid].name,
      investment: clientInvestments[cid].investment,
      percentage: Math.round((clientInvestments[cid].investment / totalInvestment) * 10000) / 100,
      leads_assigned: assignmentMap[cid],
    }));

    return new Response(
      JSON.stringify({
        success: true,
        total_new_leads: totalLeads,
        total_inserted: insertedCount,
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
