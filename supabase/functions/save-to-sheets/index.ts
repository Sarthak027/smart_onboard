// supabase/functions/save-to-sheets/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fullName, email, phone, department, designation, startDate, employeeId, companyEmail } = body;

    if (!fullName || !email || !department) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Retrieve Google Sheets webhook from environment variable
    const webhookUrl = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    if (!webhookUrl) {
      console.warn("⚠️ Google Sheets webhook not configured in environment.");
      return new Response(
        JSON.stringify({ success: false, message: "Google Sheets integration not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Send candidate data to Google Sheets webhook
    const sheetResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        department,
        designation,
        startDate,
        employeeId,
        companyEmail,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!sheetResponse.ok) {
      console.error("❌ Failed to send data to Google Sheets:", await sheetResponse.text());
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send data to Google Sheets" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Data successfully saved to Google Sheets" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("💥 Error in save-to-sheets function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
