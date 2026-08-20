// Crea una suscripción personalizada en Mercado Pago para el usuario que
// llama (usando el preapproval_plan_id que corresponde al plan elegido) y
// devuelve la URL de checkout para redirigirlo.
//
// Requiere el secret MP_ACCESS_TOKEN (Access Token de producción de Mercado
// Pago) configurado en Project Settings → Edge Functions → Secrets.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// IDs de los planes de suscripción creados a mano en el panel de Mercado
// Pago (no son secretos, son identificadores públicos del plan).
const PREAPPROVAL_PLAN_ID: Record<'starter' | 'growth' | 'unlimited', string> = {
  starter: 'f537ed3dd7f941659494a7eec8852383',
  growth: '3ec680fb8fcc4d489ba93f8326ea1f7c',
  unlimited: '603cc5c5570c4ddca0b83aecc1deff98',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan, back_url } = await req.json();
    const preapprovalPlanId = PREAPPROVAL_PLAN_ID[plan as keyof typeof PREAPPROVAL_PLAN_ID];
    if (!preapprovalPlanId || typeof back_url !== 'string' || !back_url) {
      return new Response(JSON.stringify({ error: 'Plan inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-${plan}-${Date.now()}`,
      },
      body: JSON.stringify({
        preapproval_plan_id: preapprovalPlanId,
        payer_email: user.email,
        external_reference: user.id,
        back_url,
      }),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error('Mercado Pago error', mpData);
      return new Response(
        JSON.stringify({ error: mpData?.message ?? 'No pudimos crear la suscripción' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ url: mpData.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
