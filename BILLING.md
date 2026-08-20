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

## Qué falta para cobrar de verdad (Stripe)

Ahora mismo la pantalla **Planes** (`/upgrade`) muestra los 3 niveles y, al tocar "Suscribirme",
intenta llamar a una Supabase Edge Function que **todavía no existe** — falla con un mensaje claro
en vez de simular un pago. Esto es intencional (ver punto 36 del brief: nada de botones que
aparenten funcionar sin hacerlo).

Para dejarlo funcionando de verdad:

### 1. Cuenta de Stripe (la creas tú — no puedo hacerlo por ti)

- Crea una cuenta en [stripe.com](https://dashboard.stripe.com/register).
- En **Product catalog**, crea 3 productos con precio **recurrente mensual**:
  - Starter — USD 5/mes
  - Growth — USD 10/mes
  - Unlimited — USD 15/mes
- Copia el **Price ID** (`price_...`) de cada uno.
- En **Developers → API keys**, copia la **Secret key** (`sk_live_...` o `sk_test_...` mientras
  pruebas).

### 2. Dos Supabase Edge Functions (te ayudo a escribirlas cuando tengas lo anterior)

- **`create-checkout-session`**: recibe `{ plan }`, crea una Stripe Checkout Session en modo
  `subscription` con el Price ID correspondiente, y devuelve `{ url }` para redirigir al usuario.
- **`stripe-webhook`**: recibe los eventos de Stripe (`checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`), verifica la firma con el
  *webhook signing secret*, y actualiza `profiles.plan`, `stripe_customer_id`,
  `stripe_subscription_id` y `plan_renews_at` usando la **service role key** (el único rol que
  puede escribir esos campos).

### 3. Variables de entorno

En Supabase (**Project Settings → Edge Functions → Secrets**):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_UNLIMITED`

Cuando tengas la cuenta de Stripe y los Price IDs, avísame y armamos las dos funciones.
