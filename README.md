# ⚽ PENTAGOLAZO

Todo tu campeonato, en un solo lugar. App móvil (Expo + React Native + TypeScript) para gestionar
campeonatos de Fútbol 6: equipos, jugadores, fixture, resultados, tabla de posiciones, goleadores,
asistencias y tarjetas — todo calculado automáticamente desde los partidos.

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para el detalle de arquitectura, modelo de datos y
decisiones de diseño. Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para publicar en App Store / Google Play.

## 1. Requisitos

- Node.js 20+ y npm
- Una cuenta y proyecto en [Supabase](https://supabase.com) (gratis)
- App **Expo Go** en tu teléfono (o un emulador Android/iOS), o navegador para el modo web

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_schema.sql`
   - `0002_views_functions.sql`
   - `0003_rls.sql`
   - `0004_storage.sql` (bucket para escudos de equipo y fotos de jugador)
   - `0005_groups.sql` (fase de grupos para el sistema "Grupos + playoffs")
   - `0006_knockout.sql` (fase eliminatoria / playoffs)
   - `0007_billing.sql` (super admin, planes y límite de campeonatos — ver [BILLING.md](./BILLING.md))
3. En **Project Settings → API**, copia la `Project URL` y la `anon public key`.
4. Copia `.env.example` a `.env` y completa:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

## 3. Instalar y correr la app

```bash
npm install
npm run start
```

Escanea el QR con Expo Go, o presiona `w` para abrir la versión web, `a`/`i` para Android/iOS.

## 4. Cargar el campeonato demo (opcional)

1. Regístrate una vez en la app (pantalla Registro) para tener una cuenta.
2. En **Project Settings → API**, copia también la `service_role key` (secreta, solo para este
   script — nunca la pongas en `EXPO_PUBLIC_*`).
3. Agrega a tu `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   OWNER_EMAIL=el-email-con-el-que-te-registraste
   ```
4. Ejecuta:
   ```bash
   npm run seed:demo
   ```

Esto crea "Liga Golazo 2026" con 8 equipos, jugadores, fixture completo (todos contra todos) y las
primeras 3 fechas ya jugadas con goles, asistencias y tarjetas — quedará en tu sección "Mis
campeonatos" y visible públicamente en `/public/<slug>` (el slug se imprime al terminar el script).

## 5. Comandos útiles

```bash
npm run typecheck   # TypeScript estricto, sin emitir archivos
npm run web         # abre la app en el navegador
npm run android
npm run ios
```

## 6. Qué es MVP y qué queda para después

Implementado (ver punto 32 del brief): registro/login, perfil, crear campeonato, equipos,
jugadores, fixture automático (todos contra todos), partidos, modo en vivo, registro de
resultados/goles/asistencias/tarjetas, tabla de posiciones y rankings automáticos, estadísticas del
campeonato, perfiles de equipo/jugador, perfil público compartible con QR, panel administrativo.

Deliberadamente fuera del MVP (preparado en el modelo de datos para crecer, ver sección 7 de
ARCHITECTURE.md): grupos + playoffs / eliminación directa (el fixture automático solo cubre "todos
contra todos"), notificaciones push reales (la tabla `notifications` existe pero el envío requiere
una Edge Function con service role), premios individuales (MVP, mejor arquero), fútbol 7/8/11,
pagos y suscripciones.
