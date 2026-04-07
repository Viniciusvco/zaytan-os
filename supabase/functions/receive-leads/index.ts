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
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();

    // Support Meta Ads webhook format or direct format
    const leadData = body.entry?.[0]?.changes?.[0]?.value?.leadgen_data?.[0] || body;

    const leadName = leadData.name || leadData.full_name || "Lead sem nome";
    const leadEmail = leadData.email || null;
    const leadPhone = leadData.phone_number || leadData.phone || null;
    const leadSource = leadData.source || "meta_ads";

    // Get all active lead distribution configs with investment amounts
    const { data: configs, error: configError } = await supabaseAdmin
      .from("lead_distribution_config")
      .select("client_id, investment_amount")
      .eq("active", true);

    if (configError || !configs || configs.length === 0) {
      return new Response(JSON.stringify({ error: "No active lead distribution configs found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalInvestment = configs.reduce((s, c) => s + Number(c.investment_amount), 0);
    if (totalInvestment <= 0) {
      return new Response(JSON.stringify({ error: "Total investment is zero" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count current leads per client this week (Monday-Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const { data: weekLeads } = await supabaseAdmin
      .from("leads")
      .select("client_id")
      .gte("created_at", monday.toISOString());

    const leadsPerClient: Record<string, number> = {};
    (weekLeads || []).forEach((l) => {
      leadsPerClient[l.client_id] = (leadsPerClient[l.client_id] || 0) + 1;
    });

    // Find client with biggest deficit (expected share - actual received)
    // Expected share = (client_investment / total_investment)
    // The client who is most "behind" their fair share gets the lead
    let bestClient = configs[0].client_id;
    let biggestDeficit = -Infinity;

    for (const config of configs) {
      const expectedShare = Number(config.investment_amount) / totalInvestment;
      const actual = leadsPerClient[config.client_id] || 0;
      const totalWeekLeads = Object.values(leadsPerClient).reduce((a, b) => a + b, 0);
      const expectedLeads = expectedShare * (totalWeekLeads + 1);
      const deficit = expectedLeads - actual;

      if (deficit > biggestDeficit) {
        biggestDeficit = deficit;
        bestClient = config.client_id;
      }
    }

    // Insert lead assigned to the best client
    const { data: newLead, error: insertError } = await supabaseAdmin
      .from("leads")
      .insert({
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        source: leadSource,
        client_id: bestClient,
        status: "novo",
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, lead: newLead, assigned_to_client: bestClient }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
