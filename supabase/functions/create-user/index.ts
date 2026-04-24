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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, full_name, role, colaborador_type, client_role, supervisor_id } = body;

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, full_name, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");
    const isAdmin = adminRoles && adminRoles.length > 0;

    // If not admin, check if caller is a client manager/supervisor creating a team member
    let callerClientId: string | null = null;
    let callerClientRole: string | null = null;

    if (!isAdmin) {
      // Get caller's profile id
      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", caller.id)
        .maybeSingle();

      if (!callerProfile) {
        return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Client owner should be treated as gerente even without a client_user_roles row
      const { data: ownedClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("user_id", caller.id)
        .maybeSingle();

      if (ownedClient?.id) {
        callerClientId = ownedClient.id;
        callerClientRole = "gerente";
      } else {
        // Get caller's client role when they are a team member
        const { data: callerClientRoleRow } = await supabaseAdmin
          .from("client_user_roles")
          .select("client_id, client_role")
          .eq("user_id", callerProfile.id)
          .maybeSingle();

        if (!callerClientRoleRow) {
          return new Response(JSON.stringify({ error: "Você não tem permissão para criar usuários" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        callerClientId = callerClientRoleRow.client_id;
        callerClientRole = callerClientRoleRow.client_role;
      }

      // Only gerente or supervisor can create team members
      if (callerClientRole !== "gerente" && callerClientRole !== "supervisor") {
        return new Response(JSON.stringify({ error: "Apenas gerente ou supervisor pode criar membros da equipe" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Supervisor can only create vendedor
      if (callerClientRole === "supervisor" && client_role && client_role !== "vendedor") {
        return new Response(JSON.stringify({ error: "Supervisor só pode criar vendedores" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Force role to 'cliente' for team members created by clients
      if (role !== "cliente") {
        return new Response(JSON.stringify({ error: "Membros da equipe devem ter role cliente" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, colaborador_type },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile id (auto-created by trigger)
    let profileId: string | null = null;
    if (newUser.user) {
      // small wait then fetch
      for (let i = 0; i < 5; i++) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", newUser.user.id)
          .maybeSingle();
        if (prof) {
          profileId = prof.id;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Update colaborador_type if provided (admin path)
    if (isAdmin && colaborador_type && newUser.user) {
      await supabaseAdmin
        .from("profiles")
        .update({ colaborador_type })
        .eq("user_id", newUser.user.id);
    }

    // If caller is a client manager/supervisor, assign client_user_role server-side
    if (!isAdmin && callerClientId && profileId) {
      const finalClientRole = client_role || "vendedor";
      const finalSupervisorId = finalClientRole === "vendedor" ? (supervisor_id || null) : null;

      const { error: roleError } = await supabaseAdmin
        .from("client_user_roles")
        .insert({
          client_id: callerClientId,
          user_id: profileId,
          client_role: finalClientRole,
          supervisor_id: finalSupervisorId,
        });

      if (roleError) {
        return new Response(JSON.stringify({ error: `Usuário criado, mas falhou ao atribuir função: ${roleError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ user: newUser.user, profile_id: profileId, user_id: newUser.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
