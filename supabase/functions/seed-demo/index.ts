import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "modelo@zaytan.com";
const DEMO_PASSWORD = "modelo2026";
const DEMO_CLIENT_NAME = "Escritório Modelo";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingDemo = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    if (existingDemo) {
      // Demo already seeded, just return success
      return new Response(
        JSON.stringify({ success: true, message: "Demo já existe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create demo auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_CLIENT_NAME, role: "cliente" },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // Wait for trigger to create profile + client
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Get the profile id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) throw new Error("Profile not created");

    // 3. Get the client record
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!client) throw new Error("Client not created");

    // Update client with demo info
    await supabaseAdmin.from("clients").update({
      name: DEMO_CLIENT_NAME,
      company: "Advocacia Modelo Ltda",
      phone: "(11) 99999-0000",
      email: DEMO_EMAIL,
      primary_color: "#FF6E27",
      onboarding_complete: true,
    }).eq("id", client.id);

    // 4. Seed fake leads
    const fakeLeads = [
      { name: "João Silva", phone: "(11) 98765-4321", email: "joao@email.com", value: 45000, status: "novo", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.200", source: "meta_ads" },
      { name: "Maria Oliveira", phone: "(11) 91234-5678", email: "maria@email.com", value: 120000, status: "contatado", seller_tag: "Carlos Vendas", financing_type: "Consórcio", installment_value: "R$ 2.500", source: "google_ads" },
      { name: "Pedro Santos", phone: "(21) 99876-5432", email: "pedro@email.com", value: 85000, status: "qualificado", seller_tag: "Ana Comercial", financing_type: "Financiamento", installment_value: "R$ 1.800", source: "meta_ads" },
      { name: "Ana Costa", phone: "(21) 98765-1234", email: "ana.costa@email.com", value: 200000, status: "proposta", seller_tag: "Ana Comercial", financing_type: "À vista", installment_value: null, source: "indicacao" },
      { name: "Lucas Ferreira", phone: "(31) 99999-8888", email: "lucas@email.com", value: 67000, status: "fechado", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.500", source: "meta_ads" },
      { name: "Fernanda Lima", phone: "(31) 91111-2222", email: "fernanda@email.com", value: 0, status: "perdido", seller_tag: "Ana Comercial", loss_reason: "concorrente", financing_type: "Consórcio", installment_value: "R$ 900", source: "google_ads" },
      { name: "Roberto Almeida", phone: "(11) 93333-4444", email: "roberto@email.com", value: 55000, status: "novo", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.100", source: "meta_ads" },
      { name: "Juliana Ramos", phone: "(21) 95555-6666", email: "juliana@email.com", value: 150000, status: "contatado", seller_tag: "Ana Comercial", financing_type: "Consórcio", installment_value: "R$ 3.200", source: "indicacao" },
      { name: "Thiago Mendes", phone: "(11) 97777-8888", email: "thiago@email.com", value: 0, status: "perdido", seller_tag: "Carlos Vendas", loss_reason: "sem_interesse", financing_type: "Financiamento", installment_value: "R$ 800", source: "meta_ads" },
      { name: "Camila Barbosa", phone: "(31) 96666-5555", email: "camila@email.com", value: 95000, status: "qualificado", seller_tag: "Ana Comercial", financing_type: "À vista", installment_value: null, source: "google_ads" },
      { name: "Diego Nascimento", phone: "(11) 94444-3333", email: "diego@email.com", value: 78000, status: "proposta", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.600", source: "meta_ads" },
      { name: "Patrícia Souza", phone: "(21) 92222-1111", email: "patricia@email.com", value: 0, status: "perdido", seller_tag: "Ana Comercial", loss_reason: "nao_atende", financing_type: "Consórcio", installment_value: "R$ 1.000", source: "google_ads" },
    ];

    const leadsToInsert = fakeLeads.map((lead) => ({
      client_id: client.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      value: lead.value,
      status: lead.status,
      seller_tag: lead.seller_tag,
      financing_type: lead.financing_type,
      installment_value: lead.installment_value,
      source: lead.source,
      loss_reason: lead.loss_reason || null,
      lead_entry_date: new Date().toISOString(),
    }));

    await supabaseAdmin.from("leads").insert(leadsToInsert);

    // 5. Enable all views for this demo client (no hidden views)
    await supabaseAdmin.from("client_visibility_config").upsert({
      client_id: client.id,
      hidden_views: [],
    }, { onConflict: "client_id" });

    return new Response(
      JSON.stringify({ success: true, message: "Demo criado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
