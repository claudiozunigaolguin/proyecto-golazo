# Planes, super admin y cobros — PENTAGOLAZO

## Cómo funciona hoy

- **Plan gratis** (`free`, por defecto al registrarse): 1 campeonato. Ese campeonato queda con
  `name_locked = true` y `delete_locked = true` — no se puede renombrar ni eliminar, para que no
  sirva de "cupo reciclable" (crear → borrar → crear otro gratis).
- **Starter** (`starter`, USD 5/mes): hasta 10 campeonatos.
- **Growth** (`growth`, USD 10/mes): hasta 30 campeonatos.
- **Unlimited** (`unlimited`, USD 15/mes): sin límite.
- **Super administrador**: sin límite de campeonatos, y además administra **cualquier**
  campeonato de la plataforma (no solo los propios) — pensado para vos.

El límite se aplica en dos capas:
1. **Base de datos** (la que realmente importa): un trigger en `championships` (migración
   `0007_billing.sql`) rechaza el INSERT si ya se alcanzó el límite del plan del dueño, y dos
   triggers más impiden que un usuario se auto-otorgue `is_super_admin`, cambie su propio `plan`,
   o desbloquee `name_locked`/`delete_locked` llamando la API directo (sin pasar por el flujo de
   pago). Solo el rol de servicio (`service_role`, usado por el futuro webhook de Stripe) puede
   tocar esos campos.
2. **App**: la pantalla de crear campeonato consulta tu cupo y muestra un aviso con link a
   `/upgrade` en vez del formulario si ya lo usaste todo — solo para que la experiencia sea mejor
   que un mensaje de error crudo; la protección real está en la base de datos.

## Activar tu cuenta como super admin

1. Regístrate normalmente en la app con `claudiozunigaolguin@gmail.com`.
2. En el **SQL Editor** de Supabase, ejecuta una sola vez:
   ```sql
   update public.profiles set is_super_admin = true
   where email = 'claudiozunigaolguin@gmail.com';
   ```

No hay forma de hacer esto desde la app a propósito — es intencional, para que nadie más pueda
auto-otorgarse el rol.

## Cobros reales (Mercado Pago)

La pantalla **Planes** (`/upgrade`) muestra los 3 niveles y, al tocar "Suscribirme", llama a la
Edge Function `create-subscription`, que crea una suscripción personalizada en Mercado Pago para
ese usuario (asociada al plan elegido vía `preapproval_plan_id`) y te redirige al checkout
hospedado por Mercado Pago.

Los 3 planes de suscripción ya están creados a mano en el panel de Mercado Pago (no vía API):

| Plan | Precio | Link de checkout | `preapproval_plan_id` |
|---|---|---|---|
| Starter | USD 5/mes | `mpago.la/22eSpk5` | `f537ed3dd7f941659494a7eec8852383` |
| Growth | USD 10/mes | `mpago.la/1Zz5g7H` | `3ec680fb8fcc4d489ba93f8326ea1f7c` |
| Unlimited | USD 15/mes | `mpago.la/25Nvt2W` | `603cc5c5570c4ddca0b83aecc1deff98` |

Estos IDs no son secretos (identifican el plan, no una cuenta ni un pago) así que están escritos
directamente en el código de las dos Edge Functions:

- **`supabase/functions/create-subscription`**: recibe `{ plan, back_url }` del usuario logueado,
  llama a `POST /preapproval` de Mercado Pago con `preapproval_plan_id`, el `payer_email` del
  usuario y `external_reference = auth.uid()` (así el webhook sabe a quién actualizar), y devuelve
  `{ url }` (el `init_point` de Mercado Pago) para redirigir.
- **`supabase/functions/mercadopago-webhook`**: recibe las notificaciones de Mercado Pago cuando
  la suscripción se autoriza, se pausa o se cancela; vuelve a consultar la API de Mercado Pago con
  el ID recibido (nunca confía en el payload de la notificación sola), y actualiza
  `profiles.plan`, `mp_preapproval_id`, `mp_payer_email` y `plan_renews_at` usando la **service
  role key** (el único rol que puede escribir esos campos, ver `protect_billing_fields()` en
  `0009_mercadopago.sql`).

### 1. Variable de entorno a configurar (la única que falta)

En Supabase (**Project Settings → Edge Functions → Secrets**), agrega:
- `MP_ACCESS_TOKEN` — el Access Token de **producción** de tu cuenta de Mercado Pago (Tu negocio →
  Configuración → Credenciales → Credenciales de producción). Es secreto: no lo pegues en el chat,
  cópialo directo desde el panel de Mercado Pago al de Supabase.

### 2. Desplegar las Edge Functions

Necesitas la Supabase CLI logueada (`supabase login`, se hace una vez en tu propia terminal) y
luego:
```bash
supabase functions deploy create-subscription
supabase functions deploy mercadopago-webhook --no-verify-jwt
```
(`mercadopago-webhook` lleva `--no-verify-jwt` porque lo llama Mercado Pago, no un usuario
logueado de la app).

### 3. Registrar el webhook en Mercado Pago

En el panel de Mercado Pago → **Tu negocio → Configuración → Webhooks**, agrega la URL pública de
`mercadopago-webhook` (Supabase te la muestra al desplegarla, algo como
`https://TU_PROYECTO.supabase.co/functions/v1/mercadopago-webhook`) y suscríbela a eventos de
**Suscripciones**.

Con eso, cuando alguien paga en el checkout de Mercado Pago, el webhook actualiza su plan
automáticamente — sin volver a tocar la base de datos a mano.
