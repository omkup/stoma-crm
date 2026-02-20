import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recovery_key, action, email, password, full_name, user_id } =
      await req.json();

    const expectedKey = Deno.env.get("ADMIN_RECOVERY_KEY");
    if (!expectedKey || recovery_key !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Noto'g'ri recovery kalit" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "promote") {
      // Promote existing user to admin
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id talab qilinadi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [profileRes, roleRes] = await Promise.all([
        supabaseAdmin.from("profiles").update({ role: "admin", is_active: true }).eq("id", user_id),
        supabaseAdmin.from("user_roles").update({ role: "admin" }).eq("user_id", user_id),
      ]);

      if (profileRes.error || roleRes.error) {
        return new Response(
          JSON.stringify({ error: "Rolni yangilashda xatolik", details: profileRes.error?.message || roleRes.error?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Foydalanuvchi admin qilindi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      // Create new admin user
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email va parol talab qilinadi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: newUser, error: signUpError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || email, role: "admin" },
        });

      if (signUpError) {
        return new Response(
          JSON.stringify({ error: signUpError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Yangi admin yaratildi", user_id: newUser.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Noto'g'ri action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
