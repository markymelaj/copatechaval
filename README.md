# copete.app · V1 de prueba profesional

Proyecto Next.js + Supabase orientado a botillerías en Chile.

## Qué incluye
- Marketplace por comuna
- Tienda pública por slug
- Checkout con dirección sugerida + ubicación actual
- Zonas de reparto con valor fijo
- Panel admin para pedidos, productos, zonas y repartidores
- Vista repartidor con mapa y navegación
- Backoffice para aprobar botis y ajustar trial

## Variables de entorno
Copia `.env.example` a `.env.local` o configúralas en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Deploy
1. Corre el SQL base en Supabase.
2. Sube este proyecto a GitHub.
3. Configura variables en Vercel.
4. Deploy.
5. Crea tu usuario y promuévelo a superadmin con la función SQL.
