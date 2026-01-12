import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { record } = await req.json();

        if (!record) {
            throw new Error("No record found in the request body");
        }

        const { name, email } = record;

        // 1. Get all Super Admins
        const { data: superAdmins, error: adminError } = await supabase
            .from("staff")
            .select(`
        email,
        staff_roles!inner (
          roles!inner (
            name
          )
        )
      `)
            .eq("staff_roles.roles.name", "Super Admin")
            .eq("is_approved", true);

        if (adminError) throw adminError;

        const adminEmails = superAdmins?.map((admin: any) => admin.email).filter(Boolean) || [];

        if (adminEmails.length === 0) {
            console.log("No Super Admins found to notify.");
            return new Response(JSON.stringify({ message: "No admins to notify" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Send emails via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "APRT2026 Notification <noreply@pemilurt12.ashvinlabs.com>",
                to: adminEmails,
                subject: "🔔 Pendaftaran Petugas Baru Perlu Persetujuan",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b;">Pendaftaran Petugas Baru</h2>
            <p style="color: #475569; font-size: 16px;">Halo Super Admin,</p>
            <p style="color: #475569; font-size: 16px;">Ada pendaftaran petugas baru yang memerlukan persetujuan dan penugasan Role:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Nama:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            </div>
            <p style="color: #475569; font-size: 16px;">Silakan login ke Dashboard Panitia untuk melakukan persetujuan.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://pemilurt12.ashvinlabs.com/panitia/users" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ke Dashboard Manager</a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Ini adalah email otomatis dari Sistem APRT2026. Mohon tidak membalas email ini.</p>
          </div>
        `,
            }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(resData));

        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error in notify-admin-registration:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
