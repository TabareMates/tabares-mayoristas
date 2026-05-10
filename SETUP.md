# Setup — Portal Mayoristas Tabaré Mates

## Pasos para lanzar (una sola vez)

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `tabares-mayoristas`
3. Una vez creado, ir a **SQL Editor** y pegar el contenido de `supabase/schema.sql` → Run

### 2. Obtener credenciales Supabase

En Supabase: Settings → API
- Copiar `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
- Copiar `anon public` key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Editar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Configurar email auth en Supabase

Authentication → Settings:
- Site URL: `https://tu-dominio.vercel.app`
- Redirect URLs agregar: `https://tu-dominio.vercel.app/auth/callback`

### 4. Crear tu usuario admin

1. En Supabase → Authentication → Users → Invite User (con tu email manuel@tabare.com.ar)
2. Aceptar el magic link
3. En SQL Editor correr:
```sql
INSERT INTO clients (user_id, name, email, country, currency, is_admin)
SELECT id, 'Manuel', 'manuel@tabare.com.ar', 'Argentina', 'USD', true
FROM auth.users WHERE email = 'manuel@tabare.com.ar';
```

### 5. Deploy en Vercel

```bash
npm install -g vercel
vercel
```

O conectar el repo en [vercel.com](https://vercel.com) y agregar las env vars.

---

## Agregar un cliente nuevo

1. En Supabase → Authentication → Users → **Send Invite** (con el email del cliente)
2. Ir a `/admin/clients` → Nuevo cliente (completar nombre, email, país, moneda)
3. El `user_id` se asigna automáticamente cuando el cliente acepta la invitación*

> *Para vincular manualmente: en SQL Editor:
> ```sql
> UPDATE clients SET user_id = (
>   SELECT id FROM auth.users WHERE email = 'cliente@email.com'
> ) WHERE email = 'cliente@email.com';
> ```

## Actualizar precios

Ir a `/admin/clients` → expandir cliente → editar precios → Guardar.

## Importar productos desde TiendaNube

Pedirle a Claude que los importe corriendo el script de scraping (disponible bajo pedido).

---

## Estructura del proyecto

```
app/
  page.tsx              → Login (magic link)
  catalog/page.tsx      → Catálogo del cliente
  orders/page.tsx       → Historial de pedidos
  admin/page.tsx        → Panel admin (órdenes)
  admin/products/       → Gestión de productos
  admin/clients/        → Gestión de clientes + precios
  auth/callback/        → Callback de Supabase auth
components/
  NavBar.tsx
  ProductCard.tsx
  Cart.tsx
lib/
  supabase/client.ts    → Supabase browser client
  supabase/server.ts    → Supabase server client
  types.ts              → TypeScript types
supabase/
  schema.sql            → Schema completo de la DB
```
