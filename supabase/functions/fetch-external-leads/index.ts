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
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !externalKey) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    const url = new URL(req.url);
    let body: Record<string, unknown> = {};

    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const limit = parseInt(String(body.limit ?? url.searchParams.get("limit") ?? "100"));
    const offset = parseInt(String(body.offset ?? url.searchParams.get("offset") ?? "0"));
    const status = String(body.status ?? url.searchParams.get("status") ?? "").trim();
    const ids = Array.isArray(body.ids)
      ? body.ids.map((value) => String(value)).filter(Boolean)
      : (url.searchParams.get("ids") || "").split(",").map((value) => value.trim()).filter(Boolean);

    let query = externalSupabase
      .from("leads_geral_campanha")
      .select("*", { count: "exact" });

    if (ids.length > 0) {
      query = query.in("ID Lead", ids);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data, count, limit, offset }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
