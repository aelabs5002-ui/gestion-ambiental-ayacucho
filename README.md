# Gestión Ambiental Ayacucho — Web App de Aseo Urbano y Cobros

> **Enlace de demostración en vivo (HTTPS):** https://gestion-ambiental-ayacucho.vercel.app

Plataforma web institucional (**Nuxt 3 + Tailwind CSS + Prisma + Supabase + Gemini 2.5 Flash**) diseñada para gestionar el servicio municipal de recolección de desechos sólidos, cobros mensuales (\$3.00 USD / equivalente en Bs. vía **Ubii Pagos**), seguimiento GPS de las 3 unidades, chat con IA y atención de denuncias vecinales.

---

## Arranque rápido (Demostración local y desde teléfonos en Wi-Fi)

```bash
# 1. Instalar dependencias (si aún no se hizo)
npm install

# 2. Crear base de datos y cargar datos de ejemplo de Ayacucho
npm run db:setup

# 3. Iniciar servidor accesible desde tu PC y desde teléfonos en el mismo Wi-Fi
npx nuxt dev --host 0.0.0.0 --port 3000
```

- En tu computadora abre: `http://localhost:3000`
- En teléfonos conectados al mismo Wi-Fi abre: `http://<IP-DE-TU-PC>:3000`

### Cuentas de demostración (o botones de 1 clic en el login)
- **Vecino (Jefe de Familia):** `vecino@ayacucho.gob.ve` / `Vecino123*`
- **Administrador:** `admin@ayacucho.gob.ve` / `Admin123*`
- **Supervisor Municipal (solo lectura):** `supervisor@ayacucho.gob.ve` / `Super123*`

---

## Paso a producción (Vercel + Supabase + Ubii Pagos)

1. **Base de datos PostgreSQL (Supabase):**
   - En `prisma/schema.prisma`, cambia `provider = "sqlite"` por `provider = "postgresql"`.
   - Configura `DATABASE_URL` con la cadena de conexión de Supabase y ejecuta `npx prisma db push && npm run db:seed`.
2. **Despliegue en Vercel:**
   - Sube este repositorio a GitHub e impórtalo en Vercel.
   - Configura las variables de entorno listadas en `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `TASA_CAMBIO_USD_BS`, `DEMO_MODE`).
3. **Activar Ubii Pagos real:**
   - Completa `UBII_API_KEY`, `UBII_SECRET`, cambia `DEMO_MODE="false"` e implementa la llamada firmada dentro de `RealUbiiAdapter` en `server/utils/payments.ts` (el resto de la app no cambia).
