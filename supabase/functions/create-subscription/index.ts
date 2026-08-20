// Devuelve la URL del checkout hospedado por Mercado Pago para el plan
// elegido. No llamamos a POST /preapproval: ese endpoint, cuando se usa con
// preapproval_plan_id, exige un card_token_id (una tarjeta ya tokenizada
// desde un formulario propio con el SDK de Mercado Pago). Redirigir
// directo a esta URL deja que el usuario ingrese su tarjeta en la página
// de Mercado Pago, que es exactamente lo que hacen los links mpago.la
// creados a mano en el panel — este endpoint solo arma esa misma URL.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// El dominio depende del país de la cuenta vendedora (Chile).
const CHECKOUT_URL: Record<'starter' | 'growth' | 'unlimited', string> = {
  starter:
    'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f537ed3dd7f941659494a7eec8852383',
  growth:
    'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=3ec680fb8fcc4d489ba93f8326ea1f7c',
  unlimited:
    'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=603cc5c5570c4ddca0b83aecc1deff98',
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
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan, back_url } = await req.json();
    const checkoutUrl = CHECKOUT_URL[plan as keyof typeof CHECKOUT_URL];
    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: 'Plan inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url =
      typeof back_url === 'string' && back_url
        ? `${checkoutUrl}&back_url=${encodeURIComponent(back_url)}`
        : checkoutUrl;

    return new Response(JSON.stringify({ url }), {
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
