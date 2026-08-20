# Publicar PENTAGOLAZO en App Store y Google Play

Esta guía cubre todo el camino desde el código hasta que la app esté disponible en las tiendas,
usando **EAS** (Expo Application Services), la forma oficial de compilar y publicar apps Expo.

Ya está listo en el repo: [app.json](app.json) con identificadores/versión/permisos,
[eas.json](eas.json) con los perfiles de build, ícono de marca real (`assets/icon.png` y
variantes), splash screen configurado, y [PRIVACY.md](PRIVACY.md) como borrador de política de
privacidad.

**Lo que sigue requiere tus propias cuentas y no puedo hacerlo por ti** (crear cuentas, aceptar
términos legales y pagar son acciones que debes realizar tú directamente):

## 1. Cuentas necesarias

| Cuenta | Costo | Dónde |
|---|---|---|
| Cuenta Expo/EAS | Gratis (plan pago opcional para más builds concurrentes) | [expo.dev/signup](https://expo.dev/signup) |
| Apple Developer Program | USD 99/año | [developer.apple.com/programs](https://developer.apple.com/programs) |
| Google Play Console | USD 25 (pago único) | [play.google.com/console/signup](https://play.google.com/console/signup) |

Apple requiere verificación de identidad (puede tardar 24-48h). Empieza esa cuenta primero si vas
a publicar en iOS.

## 2. Instalar y conectar EAS CLI

```bash
npm install -g eas-cli
eas login
```

Ingresa con tu cuenta Expo. Luego, dentro de la carpeta del proyecto:

```bash
eas init
```

Esto vincula el proyecto local con un proyecto en tu cuenta de Expo (crea un `projectId` y lo
guarda en `app.json` bajo `extra.eas.projectId`).

## 3. Antes de compilar: decide tus identificadores

`app.json` trae `com.golazo.app` como bundle identifier (iOS) y package name (Android) — es un
placeholder. Si no controlas el dominio `golazo.app`, cámbialo por algo que sí controles, por
ejemplo `com.tunombre.golazo`. **No se puede cambiar después de la primera publicación**, así que
decídelo ahora en `app.json`:

```json
"ios": { "bundleIdentifier": "com.tunombre.golazo" },
"android": { "package": "com.tunombre.golazo" }
```

## 4. Variables de entorno en el build

Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` se incrustan en el
binario en tiempo de build (no se leen del `.env` del dispositivo del usuario). Configúralas como
secrets de EAS para que los builds en la nube las tengan disponibles:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
```

Usa las credenciales de tu proyecto Supabase de **producción** (no un proyecto de pruebas), ya con
las 5 migraciones de `supabase/migrations/` ejecutadas.

## 5. Generar los builds

```bash
# Verifica primero que todo compile:
npm run typecheck

# Build de producción para ambas tiendas:
eas build --platform ios --profile production
eas build --platform android --profile production
```

- **iOS**: la primera vez EAS te pregunta si quiere generar y administrar el certificado de firma
  y el perfil de aprovisionamiento por ti (recomendado: responde que sí). Te pedirá tu Apple ID.
- **Android**: EAS genera y guarda un keystore de firma por ti la primera vez (**no lo pierdas** —
  sin él no puedes volver a firmar actualizaciones de la misma app; EAS lo respalda en tu cuenta).

Cada build tarda entre 10 y 25 minutos en la nube. Puedes seguir el progreso en el link que imprime
la terminal o en [expo.dev](https://expo.dev).

## 6. Preparar la ficha de cada tienda

Antes de enviar a revisión necesitas, en ambas tiendas:

- **Ícono** ✅ ya generado (`assets/icon.png`).
- **Capturas de pantalla**: mínimo 2-3 por tamaño de dispositivo requerido. Ábrela con
  `npm run start` (o en un simulador/emulador) y toma capturas de: Home, un campeonato (Resumen),
  Tabla de posiciones, y el registro de resultado en vivo — son las pantallas más representativas.
- **Descripción corta y larga**: puedes reusar el texto de la sección "Objetivo principal" de
  [AGENTS.md](AGENTS.md)/el brief original, adaptado a marketing.
- **Categoría**: Deportes.
- **Política de privacidad (URL pública)**: completa y publica [PRIVACY.md](PRIVACY.md) (súbelo a
  GitHub Pages, Notion público, o tu sitio) — ambas tiendas piden esta URL en un campo del
  formulario.
- **Clasificación de contenido**: cuestionario estándar de la tienda; PENTAGOLAZO no tiene contenido
  para adultos, apuestas ni compras — deberías calificar para "Todo público" / "4+".
- **Cuenta de prueba para el revisor**: como casi toda la app requiere login, crea una cuenta real
  de prueba (regístrate en la app) con datos de ejemplo cargados, y anota el email/contraseña en
  las notas para el revisor (App Store Connect: "App Review Information"; Play Console: sección de
  instrucciones de acceso). Sin esto, el revisor no puede evaluar la app y la rechaza.
- **Formulario de privacidad de datos** (Google "Data safety" / Apple "App Privacy"): declara que
  recolectas email, nombre, teléfono (opcional) y fotos, con el propósito "funcionalidad de la
  app" — consistente con [PRIVACY.md](PRIVACY.md).

### App Store Connect (iOS)

1. Crea la app en [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → "+".
   Usa el mismo bundle identifier que en `app.json`.
2. Completa ficha, capturas, privacidad, clasificación.
3. Sube el build:
   ```bash
   eas submit --platform ios --profile production
   ```
4. En App Store Connect, asocia el build subido a la versión y envía a revisión ("Add for Review").

### Google Play Console (Android)

1. Crea la app en [play.google.com/console](https://play.google.com/console) → "Crear app". Usa el
   mismo package name que en `app.json`.
2. Completa la ficha de Play Store, capturas, política de privacidad, "Data safety", clasificación
   de contenido, y el cuestionario de "App content".
3. Sube el build:
   ```bash
   eas submit --platform android --profile production
   ```
4. Publica primero a una pista interna o de pruebas cerradas (recomendado) antes de producción, y
   luego promuévela a producción cuando estés conforme.

## 7. Tiempos de revisión

- **Apple**: normalmente 1-3 días. Rechazos comunes: falta cuenta de prueba, splash/icon genéricos
  (ya resuelto), o pedir permisos (cámara/fotos) sin explicar el motivo (ya está el texto en
  `NSPhotoLibraryUsageDescription`).
- **Google**: desde pocas horas hasta un par de días en apps nuevas.

## 8. Después de publicar: actualizaciones

- **Cambios solo de JS/UI** (la mayoría de las mejoras futuras): puedes usar
  `eas update` para enviar actualizaciones over-the-air sin pasar por revisión de tienda otra vez.
  Requiere instalar `expo-updates` y configurar un canal — pregúntame cuando llegues a este punto y
  lo dejamos configurado.
- **Cambios nativos** (nuevas librerías con código nativo, cambios de permisos, `app.json` de
  íconos/splash): requieren un nuevo `eas build` + `eas submit`, subiendo la versión
  (`version`/`buildNumber`/`versionCode` en `app.json`).

## 9. Checklist rápido

- [ ] Cuenta Expo, Apple Developer y Google Play Console creadas
- [ ] `app.json`: bundle id / package definitivos (no `com.golazo.app` a menos que lo controles)
- [ ] Proyecto Supabase de producción con las 5 migraciones aplicadas
- [ ] Secrets de Supabase cargados en EAS (`eas secret:create`)
- [ ] `PRIVACY.md` completado (sin corchetes) y publicado en una URL pública
- [ ] `eas build --profile production` para iOS y Android exitosos
- [ ] Ficha de tienda completa (capturas, descripción, categoría, clasificación, data safety)
- [ ] Cuenta de prueba para el revisor creada y anotada
- [ ] `eas submit` para ambas plataformas
