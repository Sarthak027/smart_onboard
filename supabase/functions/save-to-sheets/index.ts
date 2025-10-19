import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fullName, email, phone, department, designation, startDate, employeeId, companyEmail } = await req.json()

    // Google Sheets webhook URL - HR needs to set this up in Google Sheets
    const webhookUrl = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL')
    
    if (!webhookUrl) {
      console.log('Google Sheets webhook not configured')
      return new Response(
        JSON.stringify({ message: 'Google Sheets integration not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Send data to Google Sheets via webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        department,
        designation,
        startDate,
        employeeId,
        companyEmail,
        timestamp: new Date().toISOString()
      })
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
