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

    let userId: string;
    let clientId: string;

    if (existingDemo) {
      userId = existingDemo.id;

      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!client) throw new Error("Client not found for demo user");
      clientId = client.id;

      // Reset: delete existing leads, payments, juridico cards for this client
      await supabaseAdmin.from("payment_tracking").delete().eq("client_id", clientId);
      await supabaseAdmin.from("juridico_cards").delete().eq("client_id", clientId);
      await supabaseAdmin.from("leads").delete().eq("client_id", clientId);
    } else {
      // Create demo auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: DEMO_CLIENT_NAME, role: "cliente" },
      });

      if (authError) throw authError;
      userId = authData.user.id;

      // Wait for trigger to create profile + client
      await new Promise((r) => setTimeout(r, 1500));

      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!client) throw new Error("Client not created");
      clientId = client.id;

      // Update client with demo info
      await supabaseAdmin.from("clients").update({
        name: DEMO_CLIENT_NAME,
        company: "Advocacia Modelo Ltda",
        phone: "(11) 99999-0000",
        email: DEMO_EMAIL,
        primary_color: "#FF6E27",
        onboarding_complete: true,
      }).eq("id", clientId);
    }

    // Seed fake leads
    const sampleLaudo1 = {
      numero_proposta: "2026-001",
      data_emissao: new Date().toISOString().split("T")[0],
      nome_cliente: "João Silva",
      cpf: "123.456.789-00",
      valor_credito: 45000,
      tipo_financiamento: "Financiamento",
      parcelas: "36x R$ 1.200",
      observacoes: "Cliente pré-aprovado",
    };

    const sampleLaudo2 = {
      numero_proposta: "2026-002",
      data_emissao: new Date().toISOString().split("T")[0],
      nome_cliente: "Pedro Santos",
      cpf: "456.789.123-00",
      valor_credito: 85000,
      tipo_financiamento: "Financiamento",
      parcelas: "48x R$ 1.800",
      observacoes: "Documentação completa",
    };

    const sampleLaudo3 = {
      numero_proposta: "2026-003",
      data_emissao: new Date().toISOString().split("T")[0],
      nome_cliente: "Lucas Ferreira",
      cpf: "321.654.987-00",
      valor_credito: 67000,
      tipo_financiamento: "Financiamento",
      parcelas: "36x R$ 1.500",
      observacoes: "Venda concluída",
    };

    const fakeLeads = [
      { name: "João Silva", phone: "(11) 98765-4321", email: "joao@email.com", value: null, status: "novo", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.200", source: "leads_geral_campanha", laudo_data: sampleLaudo1 },
      { name: "Maria Oliveira", phone: "(11) 91234-5678", email: "maria@email.com", value: null, status: "contatado", seller_tag: "Carlos Vendas", financing_type: "Consórcio", installment_value: "R$ 2.500", source: "leads_geral_campanha" },
      { name: "Pedro Santos", phone: "(21) 99876-5432", email: "pedro@email.com", value: null, status: "qualificado", seller_tag: "Ana Comercial", financing_type: "Financiamento", installment_value: "R$ 1.800", source: "leads_geral_campanha", laudo_data: sampleLaudo2 },
      { name: "Ana Costa", phone: "(21) 98765-1234", email: "ana.costa@email.com", value: null, status: "qualificado", seller_tag: "Ana Comercial", financing_type: "À vista", installment_value: null, source: "leads_geral_campanha" },
      { name: "Lucas Ferreira", phone: "(31) 99999-8888", email: "lucas@email.com", value: 2500, status: "fechado", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.500", source: "leads_geral_campanha", laudo_data: sampleLaudo3 },
      { name: "Fernanda Lima", phone: "(31) 91111-2222", email: "fernanda@email.com", value: null, status: "perdido", seller_tag: "Ana Comercial", loss_reason: "concorrente", financing_type: "Consórcio", installment_value: "R$ 900", source: "leads_geral_campanha" },
      { name: "Roberto Almeida", phone: "(11) 93333-4444", email: "roberto@email.com", value: null, status: "novo", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.100", source: "import_Fornecedor X" },
      { name: "Juliana Ramos", phone: "(21) 95555-6666", email: "juliana@email.com", value: null, status: "contatado", seller_tag: "Ana Comercial", financing_type: "Consórcio", installment_value: "R$ 3.200", source: "import_Fornecedor Y" },
      { name: "Thiago Mendes", phone: "(11) 97777-8888", email: "thiago@email.com", value: null, status: "perdido", seller_tag: "Carlos Vendas", loss_reason: "sem_interesse", financing_type: "Financiamento", installment_value: "R$ 800", source: "leads_geral_campanha" },
      { name: "Camila Barbosa", phone: "(31) 96666-5555", email: "camila@email.com", value: null, status: "proposta", seller_tag: "Ana Comercial", financing_type: "À vista", installment_value: null, source: "leads_geral_campanha" },
      { name: "Diego Nascimento", phone: "(11) 94444-3333", email: "diego@email.com", value: null, status: "proposta", seller_tag: "Carlos Vendas", financing_type: "Financiamento", installment_value: "R$ 1.600", source: "leads_geral_campanha" },
      { name: "Patrícia Souza", phone: "(21) 92222-1111", email: "patricia@email.com", value: null, status: "perdido", seller_tag: "Ana Comercial", loss_reason: "nao_atende", financing_type: "Consórcio", installment_value: "R$ 1.000", source: "leads_geral_campanha" },
    ];

    const leadsToInsert = fakeLeads.map((lead) => ({
      client_id: clientId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      value: lead.value || null,
      status: lead.status,
      seller_tag: lead.seller_tag,
      financing_type: lead.financing_type,
      installment_value: lead.installment_value,
      source: lead.source,
      loss_reason: (lead as any).loss_reason || null,
      laudo_data: (lead as any).laudo_data || null,
      lead_entry_date: new Date().toISOString(),
    }));

    const { data: insertedLeads } = await supabaseAdmin.from("leads").insert(leadsToInsert).select("id, status, value, seller_tag");

    // Auto-create payment_tracking for the closed lead (appears in Contratos)
    if (insertedLeads) {
      const closedLeads = insertedLeads.filter((l: any) => l.status === "fechado");
      if (closedLeads.length > 0) {
        const payments = closedLeads.map((l: any) => ({
          lead_id: l.id,
          client_id: clientId,
          seller_name: l.seller_tag || null,
          valor_parcela: l.value || 0,
        }));
        await supabaseAdmin.from("payment_tracking").insert(payments);
      }
    }

    // Enable all views
    await supabaseAdmin.from("client_visibility_config").upsert({
      client_id: clientId,
      hidden_views: [],
    }, { onConflict: "client_id" });

    return new Response(
      JSON.stringify({ success: true, message: "Demo criado/resetado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
