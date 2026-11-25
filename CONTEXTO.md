# CONTEXTO.md — Sistema de Gestión Ambiental y Cobro de Recolección de Desechos Sólidos (Ayacucho)

> **Nota de referencia:** El sistema de diseño oficial de este proyecto se encuentra en [`diseno-stitch.md`](./diseno-stitch.md) (referenciado en este documento como `DESIGN.md`).

---

## 1. Relato: Por qué y para qué existe esta app

### El problema
En una comunidad de aproximadamente **20.000 hogares**, el servicio de recolección de desechos sólidos se gestiona hoy de forma manual e informal. Esto genera una cadena de problemas que afectan tanto a los vecinos como a la administración:

- **Cobranza ineficiente y opaca:** el cobro de una tarifa mensual de **\$3.00 USD por jefe de familia** se hace casa por casa o por canales dispersos (WhatsApp, llamadas, transferencias sin comprobante unificado). No existe un registro confiable de quién pagó y quién no, lo que provoca morosidad, discusiones y pérdida de ingresos.
- **Falta de transparencia en la operación:** los vecinos no saben cuándo pasará el camión por su sector, si la unidad está averiada o retrasada, ni a quién dirigir una queja. Las **3 unidades de recolección** operan sin visibilidad pública.
- **Canales de comunicación rotos:** las denuncias (recolección no realizada, unidad dañada, maltrato) y las sugerencias se pierden en mensajes informales. No hay trazabilidad: el vecino no sabe si su reporte fue recibido, atendido o resuelto.
- **Carga administrativa insostenible:** la junta o administración debe perseguir manualmente a miles de hogares para cobrar, enviar avisos uno por uno, y cuadrar pagos contra una lista en Excel. Con 20.000 hogares, esto es humanamente imposible de sostener con calidad.
- **Falta de una herramienta institucional:** no existe una plataforma única que proyecte autoridad, claridad fiscal y eficiencia administrativa, adaptada al contexto venezolano (pagos en bolívares, Pago Móvil, pasarelas locales).

### La solución
Esta aplicación web centraliza toda la operación del servicio en una sola plataforma, con dos experiencias diferenciadas (vecino y administrador) y una capa opcional de supervisión municipal:

- **Para el vecino:** un portal donde ve su estado de cuenta, paga los \$3.00 USD del mes en segundos (con **Ubii Pagos**), consulta su historial y descarga comprobantes, sigue en un mapa la ubicación de las 3 unidades de recolección, conversa con un asistente de IA que responde dudas sobre horarios, pagos y reglamento, y envía denuncias o sugerencias con seguimiento de estado.
- **Para el administrador:** un panel de control donde ve en tiempo real cuántos hogares pagaron, cuántos están pendientes y cuántos vencidos, cuánto se recaudó y cuánto falta por cobrar; puede enviar avisos de cobro individuales o masivos, gestionar las denuncias y sugerencias con respuesta directa al vecino, administrar las 3 unidades de recolección y gestionar a otros administradores.
- **Para la autoridad municipal (opcional):** una vista de solo lectura con métricas consolidadas del servicio y el estado de las unidades, sin capacidad de edición.

### El impacto esperado
- **Recaudación:** reducir la morosidad al hacer el pago accesible, con recordatorio automático y comprobable.
- **Transparencia:** cada vecino sabe exactamente qué debe, qué pagó y cuándo pasa el camión.
- **Eficiencia administrativa:** eliminar la cobranza manual y los avisos uno por uno.
- **Confianza institucional:** una interfaz con autoridad visual, claridad fiscal y seguridad transaccional, inspirada en portales de banca digital y administración pública moderna.
- **Trazabilidad:** cada denuncia y sugerencia tiene un ciclo de vida visible para el vecino y gestionable por el administrador.

---

## 2. Alcance, roles y montos

### Roles del sistema
1. **Usuario (hogar / jefe de familia):** accede a su estado de cuenta, paga, consulta historial, ve el mapa, usa el chat con IA, envía reportes y gestiona su perfil.
2. **Administrador:** gestiona hogares, pagos, avisos de cobro, denuncias, unidades y otros administradores. Acceso completo.
3. **Supervisor municipal (opcional, solo lectura):** consulta métricas globales, estado de las unidades y reportes. Sin permisos de edición ni de envío de avisos.

### Regla de negocio principal
- **Monto mensual del servicio:** \$3.00 USD por jefe de familia.
- La interfaz muestra siempre el monto en **USD** y, de forma referencial, su equivalente en **bolívares (Bs.)** usando una tasa configurable (variable de entorno o parámetro de administrador).
- **Estados de pago:** `Pagado` (verde), `Pendiente` (ámbar), `Vencido` (rojo).

---

## 3. Módulos funcionales detallados

### 3.1 Módulos del Usuario (Hogar)

#### Autenticación y registro
- Registro con: nombre completo, cédula, teléfono, correo, dirección exacta, sector (dropdown), número de casa, contraseña.
- Inicio de sesión con correo o cédula + contraseña.
- Recuperación de contraseña por correo.
- Cada usuario pertenece a un sector y tiene un número de cuenta único.

#### Inicio / Estado de cuenta
- Tarjeta principal con el monto a pagar del mes (\$3.00 USD), fecha de vencimiento y badge de estado (`Pagado` / `Pendiente` / `Vencido`).
- Botón primario destacado **"Pagar ahora"**.
- Accesos rápidos a: Seguimiento de Unidades, Chat con IA, Denuncias y Sugerencias.
- Navegación inferior (móvil) o sidebar (escritorio): Inicio, Pagos, Mapa, Chat, Reportes, Perfil.

#### Pagos
- Pantalla de checkout con resumen del servicio, mes, monto en USD y equivalente en Bs.
- Selector de método de pago preparado para **Ubii Pagos**.
- **Modo Demostración** (controlado por variable de entorno `DEMO_MODE=true`): banner visible en la parte superior que dice *"MODO DEMOSTRACIÓN: las transacciones son simuladas"*. Al confirmar, se simula una transacción exitosa, se actualiza el estado del hogar a "Pagado" y se genera un comprobante.
- Arquitectura de pagos mediante un adaptador/servicio con métodos: `crearPago()`, `verificarPago()`, `procesarWebhook()`. Cuando se obtengan las credenciales reales de Ubii Pagos, solo se sustituye el adaptador simulado por el real, sin tocar el resto de la app.
- Al confirmarse el pago, se actualiza automáticamente el estado de cuenta.
- El usuario puede descargar el comprobante en **PDF** de cada pago (real o simulado).

#### Historial de pagos
- Lista de los últimos 12 meses con: mes, monto (\$3.00 USD), fecha de pago, método, referencia y estado (badge).
- Filtro por año.
- Icono de descarga de comprobante por fila.

#### Seguimiento de las 3 unidades
- Mapa interactivo a pantalla completa con 3 marcadores (`Unidad 1`, `Unidad 2`, `Unidad 3`), cada uno con color distintivo y etiqueta.
- Panel inferior deslizable con el estado de cada unidad: `"En ruta"`, `"Detenida"`, `"Fuera de servicio"`, y hora de última actualización.
- Lista de sectores que cubre cada unidad y horario estimado de paso.
- Icono de refresh para actualizar.
- Estructura preparada para recibir coordenadas GPS desde una fuente externa (endpoint o WebSocket). Mientras no haya fuente real, se usan datos simulados.

#### Chat con IA
- Interfaz de chat clásica con burbujas: usuario a la derecha (fondo azul, texto blanco), IA a la izquierda (fondo blanco, texto oscuro, borde sutil).
- Aviso fijo superior: *"Las respuestas son generadas por IA"*.
- Backend llama a la **API de Gemini** mediante clave configurable en variables de entorno (`GEMINI_API_KEY`). No incluir claves reales en el código.
- Guarda el historial de conversaciones por usuario.
- Barra de entrada inferior con campo de texto y botón de enviar.

#### Denuncias y sugerencias
- Formulario con: categoría (`Recolección no realizada`, `Unidad dañada`, `Maltrato`, `Sugerencia`, `Otro`), descripción, ubicación (con botón *"Usar mi ubicación actual"*) y opción de adjuntar foto.
- Lista de reportes enviados por el usuario con estado: `Recibido` (gris), `En proceso` (ámbar), `Resuelto` (verde).
- Al hacer clic, se expande el detalle con la respuesta del administrador.
- Notificación al usuario cuando su reporte cambie de estado.

#### Perfil
- Ver y editar datos personales.
- Cambiar contraseña.
- Cerrar sesión.

---

### 3.2 Módulos del Administrador (Escritorio)

#### Dashboard
- Sidebar fija azul con ítems: `Dashboard` (activo), `Hogares`, `Avisos de Cobro`, `Denuncias`, `Unidades`, `Administradores`. En la parte inferior: nombre del administrador y botón de cerrar sesión.
- Header con título, fecha actual y campana de notificaciones.
- 4 tarjetas de métricas: Hogares Activos, Hogares Pagados (badge verde), Hogares Pendientes (badge ámbar), Monto Recaudado USD.
- Gráfico de barras **"Pagos por Mes"** (6 meses) y gráfico circular **"Pagos por Sector"**.
- Tabla resumen **"Últimos Pagos"** con 5 filas: Hogar, Sector, Monto (\$3.00 USD), Fecha, Estado.

#### Gestión de hogares
- Buscador por nombre/cédula + filtros por Sector, Estado de Pago y Estado de Cuenta. Botón *"Limpiar filtros"*.
- Botón primario **"Exportar a Excel/CSV"**.
- Tabla con columnas: Nombre, Cédula, Sector, N° Casa, Teléfono, Estado del Mes (badge), Monto (\$3.00 USD), Fecha de Pago, Acciones.
- Acciones por fila: Ver detalle, Editar, Enviar aviso de cobro, Desactivar, Registrar pago manual.
- Paginación.

#### Avisos de cobro
- Formulario: Asunto, Mensaje (textarea con plantilla editable por defecto: *"Estimado(a) [Nombre], le recordamos que su pago del servicio de recolección correspondiente al mes de [Mes] por un monto de \$3.00 USD se encuentra pendiente..."*).
- Selector de destinatarios: Todos los pendientes / Todos los vencidos / Seleccionar manualmente.
- Botón **"Enviar Aviso"**.
- Tabla **"Historial de Avisos Enviados"**: Fecha, Destinatarios (número), Asunto, Estado.
- Canales de envío: correo electrónico y notificación dentro de la app.

#### Bandeja de denuncias y sugerencias
- Filtros: Categoría y Estado.
- Lista de reportes con: Usuario, Sector, Categoría (badge), Fecha, Descripción corta, Estado.
- Panel lateral (drawer) al seleccionar: descripción completa, foto adjunta, campo *"Respuesta del administrador"*, dropdown *"Cambiar Estado"*.
- Botones: **"Guardar y Notificar al Usuario"** y **"Cancelar"**.

#### Gestión y mapa de despacho de unidades
- Layout dos columnas: mapa grande (60%) con los 3 marcadores + lista de tarjetas (40%) con: identificador, estado (badge), sectores asignados, última actualización, botones Editar / Ver historial.
- Botón **"Añadir Unidad"**.
- Tabla compacta **"Historial de Ubicaciones"**: Unidad, Fecha/Hora, Sector, Coordenadas.

#### Gestión de administradores
- Botón **"Crear Administrador"**.
- Tabla: Nombre, Cédula, Correo, Rol (`Administrador` / `Supervisor`), Estado (`Activo` / `Inactivo`), Último acceso, Acciones.
- Acciones: Editar, Desactivar, Restablecer contraseña.
- Modal de creación: Nombre, Cédula, Correo, Contraseña temporal, Rol.
- Paginación.

---

### 3.3 Módulo del Supervisor Municipal (Opcional, solo lectura)
- Mismo layout de sidebar con ítem **"Supervisión"**.
- Métricas globales: total de hogares, porcentaje de pagos del mes, estado de las 3 unidades, número de denuncias abiertas.
- Mapa general con la ubicación de las 3 unidades.
- Sin botones de edición ni envío de avisos. Solo exportación de reportes en PDF.

---

## 4. Sistema de diseño (obligatorio, ya definido en `diseno-stitch.md` / `DESIGN.md`)

### Paleta de colores

| Rol | HEX | Uso |
|---|---|---|
| Primario (Azul Institucional) | `#1565C0` | Header, sidebar, botones primarios, enlaces activos |
| Secundario (Rojo Alerta) | `#C62828` | Botones de acción crítica, badges de "Vencido", alertas |
| Texto sobre primario/secundario | `#FFFFFF` | Obligatorio para garantizar contraste |
| Fondo de pantalla | `#F5F7FA` | Fondo general de la app |
| Fondo de tarjetas | `#FFFFFF` | Cards, contenedores, tablas |
| Texto principal | `#1A1A1A` | Párrafos, títulos sobre fondo claro |
| Texto secundario | `#616161` | Subtítulos, ayudas, metadatos |
| Éxito (Pagado) | Fondo `#E8F5E9` / Texto `#2E7D32` | Badges de pagado, confirmaciones |
| Advertencia (Pendiente) | Fondo `#FFF8E1` / Texto `#F9A825` | Badges de pendiente |
| Peligro (Vencido) | Fondo `#FFEBEE` / Texto `#C62828` | Badges de vencido, errores |

### Reglas de contraste (críticas)
- Todo texto sobre azul `#1565C0` o rojo `#C62828` debe ser blanco `#FFFFFF`.
- Nunca texto rojo sobre azul, ni viceversa.
- Los badges de estado siempre usan fondo claro con texto oscuro del mismo tono.

### Tipografía
- Familia: **Inter** o sans-serif geométrica similar.
- Jerarquía: títulos de pantalla `24px/700`, títulos de sección `18px/600`, cuerpo `14px/400`, metadatos `12px/400`.

### Estilo visual
- Estilo **Corporate / Modern**: estructurado, limpio, funcional, con autoridad institucional y claridad fiscal. Inspirado en fintech empresarial y portales de administración pública.
- Bordes redondeados: `8px` para tarjetas y botones, `12px` para modales.
- Sombras sutiles: `0 2px 4px rgba(0,0,0,0.05)`.
- Espaciados: `24px` entre secciones, `16px` de padding interno en tarjetas.
- Accesibilidad **WCAG AAA** (contraste estricto).

### Responsive
- **Usuario:** mobile-first (`375px → 1440px`). Sidebar se convierte en menú hamburguesa o navegación inferior.
- **Administrador:** desktop-first (sidebar lateral, tablas anchas). Debe degradar con elegancia a tablet.

---

## 5. Modelo de datos

### Tablas mínimas
- **usuarios:** `id`, `nombre`, `cedula`, `correo`, `telefono`, `contrasena` (hash), `rol` (`usuario`/`admin`/`supervisor`), `estado`, `fecha_registro`, `ultimo_acceso`.
- **hogares:** `id`, `usuario_id`, `sector_id`, `numero_casa`, `direccion`, `numero_cuenta`, `estado`.
- **sectores:** `id`, `nombre`, `descripcion`.
- **pagos:** `id`, `hogar_id`, `monto_usd`, `monto_bs`, `tasa_cambio`, `fecha_pago`, `metodo`, `referencia`, `estado` (`pagado`/`pendiente`/`vencido`), `comprobante_url`, `es_simulado` (bool).
- **unidades:** `id`, `identificador` (`Unidad 1`/`2`/`3`), `estado` (`en_ruta`/`detenida`/`fuera_de_servicio`), `sectores_asignados`, `ultima_actualizacion`.
- **ubicaciones:** `id`, `unidad_id`, `latitud`, `longitud`, `sector_id`, `timestamp`.
- **avisos:** `id`, `asunto`, `mensaje`, `destinatarios` (json), `fecha_envio`, `estado`, `creado_por`.
- **reportes:** `id`, `usuario_id`, `categoria`, `descripcion`, `ubicacion`, `foto_url`, `estado` (`recibido`/`en_proceso`/`resuelto`), `fecha_creacion`.
- **respuestas:** `id`, `reporte_id`, `administrador_id`, `mensaje`, `fecha`.
- **conversaciones_chat:** `id`, `usuario_id`, `fecha_inicio`, `fecha_ultimo_mensaje`.
- **mensajes:** `id`, `conversacion_id`, `rol` (`user`/`assistant`), `contenido`, `timestamp`.
- **auditoria:** `id`, `administrador_id`, `accion`, `entidad`, `entidad_id`, `timestamp`.

### Capa de acceso a datos
Debe permitir cambiar fácilmente de **SQLite** (desarrollo) a **PostgreSQL / Supabase** (producción) mediante variables de entorno (`DATABASE_URL`, `DATABASE_PROVIDER`). Usar un ORM (**Prisma** o **Drizzle**) que abstraiga el motor.

### Datos de ejemplo (seed)
- Al menos 3 sectores.
- 20 hogares de prueba con usuarios asociados.
- Las 3 unidades de recolección con estados variados.
- Pagos simulados de los últimos 3 meses (exitosos y pendientes) para poblar el dashboard y el historial.
- Varios reportes en distintos estados.

---

## 6. Reglas de negocio y flujos operativos

### Ciclo de pago
1. El usuario inicia sesión y ve su estado del mes.
2. Si está pendiente o vencido, pulsa **"Pagar ahora"**.
3. En modo demostración, la transacción se simula y el estado cambia a `Pagado` al instante. En modo real, se crea un pago en Ubii Pagos, se redirige al usuario y se confirma por webhook.
4. Al confirmarse, se genera comprobante PDF, se actualiza el estado del hogar y se registra en auditoría.

### Ciclo de aviso de cobro
1. El administrador selecciona destinatarios (pendientes / vencidos / manual).
2. Edita la plantilla si lo desea.
3. Envía: se registra en `avisos` y se dispara correo + notificación in-app.
4. El vecino recibe el aviso y puede pagar desde el enlace de la notificación.

### Ciclo de denuncia/sugerencia
1. El vecino envía el reporte con categoría, descripción, ubicación y foto opcional.
2. Estado inicial: `Recibido`.
3. El administrador lo abre, responde y cambia el estado a `En proceso` o `Resuelto`.
4. El vecino recibe notificación en cada cambio y ve la respuesta en su lista de reportes.

### Ciclo de seguimiento de unidades
1. Las 3 unidades reportan ubicación (fuente externa o simulada).
2. El backend actualiza `ubicaciones`.
3. Los usuarios ven el mapa en tiempo real; los administradores ven el mapa de despacho con historial.
4. Los estados (`En ruta` / `Detenida` / `Fuera de servicio`) los actualiza el administrador o la propia unidad.

---

## 7. Stack técnico y arquitectura

### Frontend + Backend
- **Nuxt 3 (Vue 3)** como framework full-stack, con SSR y rutas API integradas.
- **Tailwind CSS** para los estilos, respetando el sistema de diseño del `DESIGN.md`.
- Componentes accesibles (WCAG AAA).

### Base de datos
- **Desarrollo:** SQLite.
- **Producción:** PostgreSQL en Supabase.
- **ORM:** Prisma o Drizzle.

### Autenticación
- Login con correo/cédula + contraseña (hash con `bcrypt` o `argon2`).
- Sesiones con JWT o cookies `httpOnly`.
- Protección de rutas por rol (middleware).
- Recuperación de contraseña por correo.

### Integraciones
- **Ubii Pagos (pagos):** adaptador desacoplado con modo demo. Variables: `UBII_API_KEY`, `UBII_SECRET`, `DEMO_MODE`.
- **Gemini API (chat IA):** variable `GEMINI_API_KEY`. Modelo: `gemini-1.5-flash` (o el modelo Flash actual disponible en la API). Historial guardado por usuario.
- **GPS de unidades:** endpoint `POST /api/unidades/:id/ubicacion` preparado para recibir coordenadas. Datos simulados mientras no haya fuente real.
- **Correo:** SMTP o servicio como Resend para avisos de cobro y recuperación de contraseña.
- **Generación de PDF:** librería como `pdfkit` o `puppeteer` para comprobantes.

### Variables de entorno requeridas
```env
DATABASE_URL=
DATABASE_PROVIDER=sqlite|postgres
JWT_SECRET=
GEMINI_API_KEY=
UBII_API_KEY=
UBII_SECRET=
DEMO_MODE=true
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
TASA_CAMBIO_USD_BS=
```

---

## 8. Seguridad y buenas prácticas
- Contraseñas con hash (`bcrypt`/`argon2`).
- Protección de rutas por rol en middleware.
- Validación de formularios en frontend y backend (`Zod` o similar).
- Variables de entorno para todas las claves y credenciales. Nunca hardcodear claves.
- Registro de auditoría de acciones del administrador (quién cambió qué y cuándo).
- Sanitización de entradas para evitar inyección SQL y XSS.
- Rate limiting en endpoints sensibles (login, pagos, chat).
- Protección CSRF en formularios.
- HTTPS obligatorio en producción.

---

## 9. Plan de despliegue a producción
1. **GitHub:** repositorio con el código, ramas `main` y `develop`.
2. **Vercel:** hosting del frontend/backend Nuxt 3, conectado al repo de GitHub para despliegue automático.
3. **Supabase:** PostgreSQL gestionado, autenticación opcional, APIs listas.
4. **Migración de datos:** script para pasar de SQLite a Supabase.
5. **Configuración de variables de entorno en Vercel.**
6. **Dominio y HTTPS.**
7. **Backups automáticos de la base de datos.**

---

## 10. Fases de desarrollo sugeridas
1. **Fase 1 — Base:** estructura del proyecto Nuxt 3, Tailwind configurado con el sistema de diseño, autenticación, modelo de datos con Prisma/Drizzle, seed de datos de ejemplo.
2. **Fase 2 — Módulo usuario:** dashboard, estado de cuenta, historial, perfil.
3. **Fase 3 — Pagos:** checkout con Ubii Pagos en modo demo, adaptador desacoplado, comprobantes PDF.
4. **Fase 4 — Mapa y chat:** seguimiento de las 3 unidades (con datos simulados), chat con Gemini API.
5. **Fase 5 — Reportes:** formulario de denuncias/sugerencias, lista de reportes del usuario, notificaciones.
6. **Fase 6 — Panel admin:** dashboard, gestión de hogares, avisos de cobro, bandeja de reportes, gestión de unidades, gestión de administradores.
7. **Fase 7 — Supervisor municipal (opcional):** vista de solo lectura.
8. **Fase 8 — Pruebas, accesibilidad y despliegue:** pruebas de flujo, auditoría WCAG, migración a Supabase, despliegue en Vercel.

---

## 11. Notas operativas de desarrollo
- Leer primero `diseno-stitch.md` (`DESIGN.md`) y este `CONTEXTO.md` antes de escribir código.
- Usar el sistema de diseño de forma obligatoria (colores, tipografía, componentes, espaciados, accesibilidad WCAG AAA).
- Construir módulo por módulo, mostrando vista previa funcional al final de cada fase, para revisar y ajustar.
- Mantener el modo demostración activado (`DEMO_MODE=true`) durante todo el desarrollo, para que las transacciones sean simuladas y se puedan probar los flujos completos sin credenciales reales de Ubii Pagos.
- No incluir claves reales en el código. Usar variables de entorno con valores de ejemplo en `.env.example`.
- Preparar la app para migrar de SQLite a PostgreSQL sin cambios de código, solo cambiando `DATABASE_PROVIDER` y `DATABASE_URL`.
- Generar datos de ejemplo al inicializar la base de datos para que el dashboard y el historial se vean poblados desde el primer arranque.
