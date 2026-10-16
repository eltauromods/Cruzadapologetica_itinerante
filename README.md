# Cruzada Apologética Itinerante (CAI)

Web estática (HTML + CSS + JS). Funciona completa **sin backend**: si no hay base de datos conectada, guarda todo en el navegador y pasa sola a Supabase cuando la configuras.

## Probar ahora
Sirve la carpeta con `npx serve` (o Live Server). Abre `/login`, crea tu cuenta: la **primera cuenta es administradora** (ves el Panel) y tu punto aparece en el mapa. Los datos locales viven en ese navegador (`localStorage`, clave `cai_local_v1`).

## URLs sin `.html`
`login.html` se abre como `/login`: en GitHub Pages ya funciona, en Vercel lo hace `vercel.json` (`cleanUrls`) y en Apache/InfinityFree lo hace `.htaccess`. Todas las rutas son relativas, así que sirve también bajo una subcarpeta (`usuario.github.io/repo/`).

## Conectar la base de datos (cuando quieras)
1. Supabase > SQL Editor > pega `supabase/schema.sql` > Run.
2. Pon `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `js/config.js`. Nada más: el código cambia de local a Supabase solo.
3. Regístrate y hazte admin: `update public.profiles set role = 'admin' where username = 'tu_usuario';`

## Tyrone AI (`api/motor.php`)
- La API key y el modelo se configuran **dentro del propio `motor.php`** (bloque de configuración arriba).
- **PHP no corre en GitHub Pages ni en Vercel.** Sube `motor.php` a un hosting con PHP (tu InfinityFree) y escribe su URL completa en `AI_ENDPOINT` de `js/config.js`. El archivo ya envía las cabeceras CORS necesarias.
- Si el repositorio es público no pegues la clave en el archivo: crea `api/config.local.php` con `<?php $GROQ_API_KEY = 'gsk_...';` (está en `.gitignore`).
- Si Tyrone falla, el visitante solo ve mensajes amables; el detalle técnico queda en el log del servidor.

## Dónde editar
- Redes y correo del pie de página: `js/config.js` (lo vacío no se muestra).
- Rangos, puntos, misiones y fichas de apologética: `js/data.js`.
- Colores y tipografías: variables al inicio de `css/styles.css`.
- Sección oculta del desarrollo: `#/dev` (enlace casi invisible `</>` en el pie).
