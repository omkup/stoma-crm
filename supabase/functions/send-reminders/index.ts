import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Fetch pending reminders that are due
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        patients(full_name, phone)
      `)
      .eq('status', 'pending')
      .lte('remind_at', now)
      .limit(50);

    if (error) throw error;

    const results: any[] = [];

    for (const reminder of reminders || []) {
      try {
        // Placeholder: log the reminder (replace with actual SMS/Telegram integration)
        console.log(`[${reminder.channel.toUpperCase()}] To: ${reminder.patients?.phone} | Message: ${reminder.message}`);

        if (reminder.channel === 'sms') {
          // TODO: Integrate with SMS provider (Eskiz, PlayMobile, etc.)
          console.log(`SMS placeholder: Would send to ${reminder.patients?.phone}`);
        } else if (reminder.channel === 'telegram') {
          // TODO: Integrate with Telegram Bot API
          console.log(`Telegram placeholder: Would send to patient`);
        }

        // Mark as sent
        await supabase
          .from('reminders')
          .update({ status: 'sent', sent_at: now })
          .eq('id', reminder.id);

        results.push({ id: reminder.id, status: 'sent' });
      } catch (sendError) {
        // Mark as failed
        await supabase
          .from('reminders')
          .update({ status: 'failed' })
          .eq('id', reminder.id);

        results.push({ id: reminder.id, status: 'failed', error: String(sendError) });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
