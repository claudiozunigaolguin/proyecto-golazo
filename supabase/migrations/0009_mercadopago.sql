-- Reemplaza los campos pensados para Stripe (nunca usados) por los de
-- Mercado Pago. mp_preapproval_id es el ID de la suscripción (preapproval)
-- que la Edge Function del webhook usa para encontrar y actualizar el
-- perfil correcto en cada evento de pago.

alter table public.profiles
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  add column mp_preapproval_id text,
  add column mp_payer_email text;

create or replace function public.protect_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.is_super_admin is distinct from old.is_super_admin
    or new.plan is distinct from old.plan
    or new.mp_preapproval_id is distinct from old.mp_preapproval_id
    or new.mp_payer_email is distinct from old.mp_payer_email
    or new.plan_renews_at is distinct from old.plan_renews_at
  then
    raise exception 'No puedes modificar tu plan o permisos directamente.';
  end if;

  return new;
end;
$$;
