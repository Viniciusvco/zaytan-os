import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_CAMPAIGN_NAME = "__crm_distribution__";
const DEFAULT_COST_PER_SALE = 20;

type ClientInvestmentMap = Record<string, { name: string; investment: number }>;

type DistributionConfigRow = {
  id: string;
  client_id: string;
  investment_amount: number;
  weight_percent: number;
  weight_override: boolean;
  daily_limit: number | null;
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

    let percentOverrides: Record<string, number> | undefined;
    let importMode: "new_only" | "all" = "new_only";
    let targetClientIds: string[] | undefined;

    try {
      const body = await req.json();
      percentOverrides = body?.percent_overrides;
      importMode = body?.import_mode === "all" ? "all" : "new_only";
      targetClientIds = body?.target_client_ids;
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

    const distributionConfig = await ensureDistributionConfig(supabase, clientIds, clientInvestments);
    const todayRange = getTodayRange();
    const { data: todayLeads, error: todayLeadsError } = await supabase
      .from("leads")
      .select("client_id")
      .in("client_id", clientIds)
      .eq("source", "leads_geral_campanha")
      .gte("created_at", todayRange.from)
      .lte("created_at", todayRange.to);

    if (todayLeadsError) {
      return new Response(JSON.stringify({ error: todayLeadsError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todaysCountByClient = Object.fromEntries(clientIds.map((cid) => [cid, 0]));
    for (const lead of todayLeads || []) {
      todaysCountByClient[lead.client_id] = (todaysCountByClient[lead.client_id] || 0) + 1;
    }

    // Get existing leads per target client (by ext_id)
    const existingLeadsByClient: Record<string, Map<string, { id: string; status: string }>> = {};
    for (const cid of clientIds) {
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id, notes, status")
        .eq("client_id", cid)
        .eq("source", "leads_geral_campanha");

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
      .from("leads_geral_campanha")
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

    // Collect ALL ext_ids already synced across ALL target clients
    const allSyncedExtIds = new Set<string>();
    for (const cid of clientIds) {
      for (const extId of existingLeadsByClient[cid].keys()) {
        allSyncedExtIds.add(extId);
      }
    }

    // Separate new leads from existing ones
    const newExternalLeads = allExternalLeads.filter(lead => {
      const extId = String(lead["ID Lead"]);
      return !allSyncedExtIds.has(extId);
    });

    const existingExternalLeads = allExternalLeads.filter(lead => {
      const extId = String(lead["ID Lead"]);
      return allSyncedExtIds.has(extId);
    });

    const leadsToDistribute = newExternalLeads;
    const totalNewLeads = leadsToDistribute.length;

    const distributionPlan = buildDistributionPlan({
      clientIds,
      clientInvestments,
      distributionConfig,
      totalNewLeads,
      todaysCountByClient,
      percentOverrides,
    });

    // Distribute NEW leads based on stored rules
    const leadsToInsert: any[] = [];
    const insertedCount: Record<string, number> = {};

    if (totalNewLeads > 0 && distributionPlan.totalPlanned > 0) {
      const clientQueues = { ...distributionPlan.allocations };
      for (const lead of leadsToDistribute.slice(0, distributionPlan.totalPlanned)) {
        let bestClient: string | null = null;
        let bestRemaining = -1;
        for (const cid of clientIds) {
          if ((clientQueues[cid] || 0) > bestRemaining) {
            bestRemaining = clientQueues[cid] || 0;
            bestClient = cid;
          }
        }

        if (!bestClient || bestRemaining <= 0) break;
        clientQueues[bestClient]--;

        const extId = String(lead["ID Lead"]);
        leadsToInsert.push({
          client_id: bestClient,
          name: lead["Nome"] || "Lead sem nome",
          email: lead["Email"] || null,
          phone: lead["Telefone"] || null,
          source: "leads_geral_campanha",
          status: "novo",
          notes: `ext_id:${extId}`,
          financing_type: lead["Qual tipo de financiamento"] || null,
          installment_value: lead["Valor das parcelas"] || null,
          lead_entry_date: lead["Data da Entrada do Lead"] ? new Date(lead["Data da Entrada do Lead"]).toISOString() : null,
        });
        insertedCount[bestClient] = (insertedCount[bestClient] || 0) + 1;
      }
    }

    // Handle existing leads update (only in "all" mode, never change status)
    const leadsToUpdate: any[] = [];
    const skippedCount: Record<string, number> = {};

    if (importMode === "all") {
      for (const lead of existingExternalLeads) {
        const extId = String(lead["ID Lead"]);
        for (const cid of clientIds) {
          const existing = existingLeadsByClient[cid].get(extId);
          if (existing) {
            leadsToUpdate.push({
              id: existing.id,
              name: lead["Nome"] || "Lead sem nome",
              email: lead["Email"] || null,
              phone: lead["Telefone"] || null,
              financing_type: lead["Qual tipo de financiamento"] || null,
              installment_value: lead["Valor das parcelas"] || null,
              lead_entry_date: lead["Data da Entrada do Lead"] ? new Date(lead["Data da Entrada do Lead"]).toISOString() : null,
            });
            skippedCount[cid] = (skippedCount[cid] || 0) + 1;
          }
        }
      }
    } else {
      for (const cid of clientIds) {
        skippedCount[cid] = existingLeadsByClient[cid].size;
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

    // Batch update existing leads
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
      percentage: Math.round((distributionPlan.percentages[cid] || 0) * 100) / 100,
      leads_assigned: insertedCount[cid] || 0,
      leads_existing: skippedCount[cid] || 0,
      leads_updated: importMode === "all" ? (skippedCount[cid] || 0) : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        total_external_leads: allExternalLeads.length,
        total_new_leads: totalNewLeads,
        total_inserted: totalInserted,
        total_updated: totalUpdated,
      total_unassigned: distributionPlan.unassigned,
      distribution_mode: distributionPlan.mode,
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

async function ensureDistributionConfig(
  supabase: ReturnType<typeof createClient>,
  clientIds: string[],
  clientInvestments: ClientInvestmentMap,
) {
  if (clientIds.length === 0) return [] as DistributionConfigRow[];

  let { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("name", SYSTEM_CAMPAIGN_NAME)
    .maybeSingle();

  if (campaignError) throw campaignError;

  if (!campaign) {
    const { data: insertedCampaign, error: insertCampaignError } = await supabase
      .from("campaigns")
      .insert({
        name: SYSTEM_CAMPAIGN_NAME,
        total_investment: clientIds.reduce((sum, cid) => sum + clientInvestments[cid].investment, 0),
        stock_expiry_days: 7,
        active: false,
      })
      .select("id")
      .single();

    if (insertCampaignError) throw insertCampaignError;
    campaign = insertedCampaign;
  }

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("campaign_clients")
    .select("id, client_id, investment_amount, weight_percent, weight_override, daily_limit")
    .eq("campaign_id", campaign.id);

  if (existingRowsError) throw existingRowsError;

  const existingByClient = new Map((existingRows || []).map((row) => [row.client_id, row]));
  const totalInvestment = clientIds.reduce((sum, cid) => sum + clientInvestments[cid].investment, 0);
  const operations: Promise<unknown>[] = [];

  for (const cid of clientIds) {
    const investment = clientInvestments[cid].investment;
    const autoPercent = totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;
    const existingRow = existingByClient.get(cid);

    if (!existingRow) {
      operations.push(
        supabase.from("campaign_clients").insert({
          campaign_id: campaign.id,
          client_id: cid,
          investment_amount: investment,
          weight_percent: autoPercent,
          weight_override: false,
          daily_limit: null,
        }),
      );
      continue;
    }

    const patch: Record<string, number> = {};
    if (Number(existingRow.investment_amount) !== investment) {
      patch.investment_amount = investment;
    }
    if (!existingRow.weight_override && Math.abs(Number(existingRow.weight_percent) - autoPercent) > 0.01) {
      patch.weight_percent = autoPercent;
    }

    if (Object.keys(patch).length > 0) {
      operations.push(supabase.from("campaign_clients").update(patch).eq("id", existingRow.id));
    }
  }

  const staleRowIds = (existingRows || [])
    .filter((row) => !clientIds.includes(row.client_id))
    .map((row) => row.id);

  if (staleRowIds.length > 0) {
    operations.push(supabase.from("campaign_clients").delete().in("id", staleRowIds));
  }

  if (operations.length > 0) {
    await Promise.all(operations);
  }

  const { data: syncedRows, error: syncedRowsError } = await supabase
    .from("campaign_clients")
    .select("id, client_id, investment_amount, weight_percent, weight_override, daily_limit")
    .eq("campaign_id", campaign.id)
    .in("client_id", clientIds);

  if (syncedRowsError) throw syncedRowsError;

  return (syncedRows || []) as DistributionConfigRow[];
}

function buildDistributionPlan({
  clientIds,
  clientInvestments,
  distributionConfig,
  totalNewLeads,
  todaysCountByClient,
  percentOverrides,
}: {
  clientIds: string[];
  clientInvestments: ClientInvestmentMap;
  distributionConfig: DistributionConfigRow[];
  totalNewLeads: number;
  todaysCountByClient: Record<string, number>;
  percentOverrides?: Record<string, number>;
}) {
  const configByClient = new Map(distributionConfig.map((row) => [row.client_id, row]));
  const hasManualDailyLimit = distributionConfig.some((row) => row.daily_limit !== null);

  if (hasManualDailyLimit) {
    const capacities = clientIds.map((clientId) => {
      const row = configByClient.get(clientId);
      const effectiveLimit = row?.daily_limit ?? calculateAutoDailyLimit(clientInvestments[clientId].investment);
      const remaining = Math.max(effectiveLimit - (todaysCountByClient[clientId] || 0), 0);
      return { clientId, weight: remaining, max: remaining };
    });

    const totalCapacity = capacities.reduce((sum, item) => sum + item.max, 0);
    const totalPlanned = Math.min(totalNewLeads, totalCapacity);
    const allocations = allocateByWeights(capacities, totalPlanned);

    return {
      allocations,
      mode: "daily_limit" as const,
      totalPlanned,
      unassigned: Math.max(totalNewLeads - totalPlanned, 0),
      percentages: buildPercentageMap(clientIds, configByClient, clientInvestments, percentOverrides),
    };
  }

  const percentageWeights = clientIds.map((clientId) => {
    const row = configByClient.get(clientId);
    const overrideValue = percentOverrides?.[clientId];
    const baseWeight = overrideValue ?? row?.weight_percent ?? 0;
    return { clientId, weight: Math.max(baseWeight, 0), max: Number.POSITIVE_INFINITY };
  });

  const allocations = allocateByWeights(percentageWeights, totalNewLeads);
  return {
    allocations,
    mode: "percentage" as const,
    totalPlanned: totalNewLeads,
    unassigned: 0,
    percentages: normalizeWeights(percentageWeights),
  };
}

function buildPercentageMap(
  clientIds: string[],
  configByClient: Map<string, DistributionConfigRow>,
  clientInvestments: ClientInvestmentMap,
  percentOverrides?: Record<string, number>,
) {
  const weights = clientIds.map((clientId) => ({
    clientId,
    weight: Math.max(
      percentOverrides?.[clientId] ??
        configByClient.get(clientId)?.weight_percent ??
        calculateAutoPercent(clientId, clientIds, clientInvestments),
      0,
    ),
    max: Number.POSITIVE_INFINITY,
  }));
  return normalizeWeights(weights);
}

function calculateAutoPercent(clientId: string, clientIds: string[], clientInvestments: ClientInvestmentMap) {
  const total = clientIds.reduce((sum, cid) => sum + clientInvestments[cid].investment, 0);
  if (total <= 0) return 0;
  return (clientInvestments[clientId].investment / total) * 100;
}

function calculateAutoDailyLimit(investment: number) {
  return DEFAULT_COST_PER_SALE > 0 ? Math.max(1, Math.round(investment / DEFAULT_COST_PER_SALE / 7)) : 1;
}

function normalizeWeights(items: Array<{ clientId: string; weight: number }>) {
  const positiveItems = items.filter((item) => item.weight > 0);
  if (positiveItems.length === 0) {
    const equalWeight = items.length > 0 ? 100 / items.length : 0;
    return Object.fromEntries(items.map((item) => [item.clientId, equalWeight]));
  }

  const totalWeight = positiveItems.reduce((sum, item) => sum + item.weight, 0);
  return Object.fromEntries(items.map((item) => [item.clientId, totalWeight > 0 ? (item.weight / totalWeight) * 100 : 0]));
}

function allocateByWeights(
  items: Array<{ clientId: string; weight: number; max: number }>,
  total: number,
) {
  const allocations = Object.fromEntries(items.map((item) => [item.clientId, 0]));
  if (total <= 0 || items.length === 0) return allocations;

  let remaining = total;

  while (remaining > 0) {
    const available = items.filter((item) => allocations[item.clientId] < item.max && item.max > 0);
    if (available.length === 0) break;

    const normalized = normalizeWeights(available);
    const shares = available.map((item) => {
      const raw = (normalized[item.clientId] / 100) * remaining;
      return {
        ...item,
        raw,
        floor: Math.floor(raw),
        fraction: raw - Math.floor(raw),
      };
    });

    let allocatedThisRound = 0;
    for (const share of shares) {
      const capacity = share.max - allocations[share.clientId];
      const assign = Math.min(capacity, share.floor);
      allocations[share.clientId] += assign;
      allocatedThisRound += assign;
    }

    remaining -= allocatedThisRound;
    if (remaining <= 0) break;

    const byFraction = shares
      .filter((share) => allocations[share.clientId] < share.max)
      .sort((a, b) => b.fraction - a.fraction);

    let gaveExtra = false;
    for (const share of byFraction) {
      if (remaining <= 0) break;
      if (allocations[share.clientId] >= share.max) continue;
      allocations[share.clientId] += 1;
      remaining -= 1;
      gaveExtra = true;
    }

    if (!gaveExtra && allocatedThisRound === 0) break;
  }

  return allocations;
}

function getTodayRange() {
  const today = new Date().toISOString().split("T")[0];
  return {
    from: `${today}T00:00:00.000Z`,
    to: `${today}T23:59:59.999Z`,
  };
}
