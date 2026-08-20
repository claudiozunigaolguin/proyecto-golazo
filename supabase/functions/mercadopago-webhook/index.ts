// Recibe las notificaciones de Mercado Pago cuando una suscripción se
// autoriza, se pausa o se cancela, y actualiza el plan del usuario
// correspondiente.
//
// El checkout hospedado (ver create-subscription) no permite mandar
// external_reference, así que la primera vez que se autoriza una
// suscripción identificamos al usuario por su email (preapproval.payer_email
// contra profiles.email); de ahí en adelante ya queda enlazado por
// mp_preapproval_id, que es estable.
//
// Configurar esta URL como webhook en el panel de Mercado Pago
// (Tu negocio → Configuración → Webhooks), suscrita a eventos de tipo
// "Suscripciones" (subscription_preapproval / preapproval).
//
// Requiere los secrets MP_ACCESS_TOKEN, SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY (los dos últimos ya existen por defecto en toda
// Edge Function de Supabase).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PLAN_BY_PREAPPROVAL_PLAN_ID: Record<string, 'starter' | 'growth' | 'unlimited'> = {
  f537ed3dd7f941659494a7eec8852383: 'starter',
  '3ec680fb8fcc4d489ba93f8326ea1f7c': 'growth',
  '603cc5c5570c4ddca0b83aecc1deff98': 'unlimited',
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let preapprovalId = url.searchParams.get('data.id') ?? url.searchParams.get('id');
    let topic = url.searchParams.get('type') ?? url.searchParams.get('topic');

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        preapprovalId = body?.data?.id ?? preapprovalId;
        topic = body?.type ?? body?.action ?? topic;
      } catch {
        // Body vacío o no-JSON: seguimos con lo que haya en la query string.
      }
    }

    // Solo nos interesan los eventos de suscripción (preapproval). Cualquier
    // otro tipo de notificación se reconoce con 200 pero se ignora.
    if (!preapprovalId || (topic && !topic.includes('preapproval'))) {
      return new Response('ok', { status: 200 });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!;
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });
    if (!mpResponse.ok) {
      console.error('No se pudo leer la suscripción en Mercado Pago', await mpResponse.text());
      return new Response('ok', { status: 200 });
    }
    const preapproval = await mpResponse.json();

    const externalReference: string | undefined = preapproval.external_reference || undefined;
    const payerEmail: string | undefined = preapproval.payer_email || undefined;
    const status: string = preapproval.status;
    const plan = PLAN_BY_PREAPPROVAL_PLAN_ID[preapproval.preapproval_plan_id as string];

    if (!plan || (!externalReference && !payerEmail)) {
      console.error('Suscripción sin referencia de usuario o plan reconocible', preapproval);
      return new Response('ok', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (status === 'authorized') {
      const update = {
        plan,
        mp_preapproval_id: preapproval.id,
        mp_payer_email: payerEmail ?? null,
        plan_renews_at: preapproval.next_payment_date ?? null,
      };
      if (externalReference) {
        await supabase.from('profiles').update(update).eq('id', externalReference);
      } else {
        await supabase.from('profiles').update(update).ilike('email', payerEmail!);
      }
    } else if (status === 'cancelled' || status === 'paused') {
      await supabase
        .from('profiles')
        .update({ plan: 'free', plan_renews_at: null })
        .eq('mp_preapproval_id', preapproval.id);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error(err);
    // Siempre devolvemos 200: si no, Mercado Pago reintenta indefinidamente
    // notificaciones que ya fallaron por un motivo no transitorio.
    return new Response('ok', { status: 200 });
  }
});
