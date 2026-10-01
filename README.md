# Carsa — Evaluación de Crédito

Aplicación web para asesores de tienda Carsa: evalúan la capacidad de pago de un cliente, obtienen un puntaje, la cuota máxima sugerida y confirman la evaluación, con historial exportable.

Todo funciona **sin servidor**: los datos se guardan en el navegador (localStorage), pensado para entregarse como proyecto autónomo. La lógica de negocio está aislada para que, a futuro, se migre a un backend sin rehacer la app.

---

## 1. Arrancar el proyecto

Requisitos: **Node.js 20+** y **Bun** (o npm/pnpm, funcionan igual).

```bash
# 1. Instalar dependencias (una sola vez)
bun install        # o: npm install

# 2. Levantar en modo desarrollo
bun run dev        # o: npm run dev

# 3. Abrir en el navegador
# http://localhost:8080
```

Otros comandos útiles:

| Comando            | Qué hace                                          |
| ------------------ | ------------------------------------------------- |
| `bun run build`    | Compila la versión de producción (carpeta `dist`) |
| `bun run preview`  | Sirve la compilación de producción localmente      |
| `bun run lint`     | Revisa el código con ESLint                        |
| `bun run format`   | Formatea el código con Prettier                    |

---

## 2. Cómo usar la app

1. **Iniciar sesión** con usuario y contraseña (usuarios de ejemplo abajo).
2. **Elegir la tienda** en la que se va a operar.
3. La barra superior muestra el **nombre del asesor, su código y la tienda activa**; desde ahí se puede cambiar de tienda o salir.
4. **Nueva evaluación** (paso a paso): datos del cliente → resultado con puntaje y desglose → simulador de cuota → confirmar.
5. **Historial**: filtra evaluaciones por fecha, decisión y asesor; exporta todo a JSON.

### Usuarios de ejemplo

| Usuario   | Contraseña  | Asesor              | Código  | Tiendas                          |
| --------- | ----------- | ------------------- | ------- | -------------------------------- |
| `lccori`  | `carsa123`  | Luis Ccori Ramos    | AS-0341 | San Juan de Miraflores, Comas    |
| `rhuaman` | `carsa123`  | Rosa Huamán Torres  | AS-0127 | Huancayo Centro                  |

> ⚠️ Este login es solo para organizar quién opera: los datos viven en el navegador del usuario, no hay seguridad real. Se reemplazará por autenticación del backend.

### Qué está simulado (y qué no existe)

Como todo corre en el navegador, estas funciones **simulan** su comportamiento real:

- **Login y sesión**: se validan contra una lista local de usuarios; la sesión se guarda en el navegador y se pierde al borrar los datos. No hay seguridad real (se reemplazará por el backend).
- **Guardado de datos**: cada evaluación se "guarda" en el propio navegador con una pequeña demora simulada, como si fuera un servidor. Cada navegador (y cada computadora) ve su propio historial; los datos no se comparten entre usuarios ni equipos.
- **Delays de red**: las operaciones esperan ~150 ms para imitar la respuesta de un servidor.

**No existe y no se envía nada hacia afuera**: no hay correos, ni pagos, ni mensajes de WhatsApp, ni conexión a ningún servicio externo. La app funciona 100% sin internet.

### Datos de ejemplo y cómo reiniciarlos

Al abrir la app por primera vez se cargan solos los **usuarios y tiendas de ejemplo** de la tabla de arriba. El **historial de evaluaciones empieza vacío**.

Para volver todo al estado inicial (borrar evaluaciones, sesión y volver a cargar los datos de ejemplo), borra el localStorage del navegador:

1. Abre la app y presiona **F12** (herramientas de desarrollo).
2. Ve a la pestaña **Application** (Chrome/Edge) o **Almacenamiento** (Firefox).
3. En el panel izquierdo: **Local Storage → http://localhost:8080** (o el dominio donde esté publicada).
4. Clic derecho → **Clear / Borrar**, y recarga la página.

También puedes borrar solo una parte, eliminando claves individuales:

| Clave de localStorage     | Qué borra                                    |
| ------------------------- | -------------------------------------------- |
| `carsa.evaluaciones.v2`   | El historial de evaluaciones                 |
| `carsa.sesion.v1`         | La sesión activa (vuelve a la pantalla de login) |
| `carsa.asesores.v1`       | Los asesores (se recargan los de ejemplo)    |
| `carsa.tiendas.v1`        | Las tiendas (se recargan las de ejemplo)     |

> Atajos rápidos: en la consola de las herramientas de desarrollo, `localStorage.clear()` borra todo, o `localStorage.removeItem("carsa.evaluaciones.v2")` borra solo el historial.

---

## 3. Dónde está cada cosa

```
src/
├── routes/
│   ├── __root.tsx          # Estructura general (título, fuentes, lang)
│   ├── index.tsx           # Pantalla principal: evaluación paso a paso
│   └── historial.tsx       # Historial con filtros y exportación JSON
├── components/
│   ├── Shell.tsx           # Cascarón: login → selección de tienda → app
│   └── ui/                 # Componentes de interfaz reutilizables (botones, inputs…)
├── lib/
│   ├── credit.ts           # ⭐ REGLAS DE NEGOCIO (pura, sin navegador ni servidor)
│   ├── storage.ts          # Guardar/leer evaluaciones en localStorage
│   ├── auth.ts             # Sesión, asesores y tiendas en localStorage
│   └── utils.ts            # Utilidades menores
├── styles.css              # Colores y estilos globales (paleta oklch)
└── router.tsx              # Configuración interna del enrutador
```

### Archivos clave

**`src/lib/credit.ts` — las reglas del negocio.** Aquí vive todo lo que un cambio de política comercial tocaría:

- `PRODUCTOS`: catálogo con precios (Refrigeradora 250 L S/ 1 899, Televisor 55" S/ 2 299, Lavadora 16 kg S/ 1 499, Moto 150 cc S/ 5 800, Celular S/ 999).
- `PLAZOS`: meses e intereses (6m 18%, 12m 9.5%, 18m 6.8%, 24m 5.5%).
- Puntaje por criterios: ingreso disponible, independencia, antigüedad, referencias, historial de crédito.
- Tramos de decisión por puntaje: `< 40` revisión manual · `40–64` hasta 20% · `65–84` hasta 25% · `85+` hasta 30%.
- Cálculo de cuota máxima, cuota por plazo y flujo completo de evaluación.

**`src/lib/storage.ts` — los datos guardados.** Evaluaciones en `carsa.evaluaciones.v2` (localStorage del navegador). Marcado con TODOs para cambiar a backend.

**`src/lib/auth.ts` — sesiones, asesores y tiendas.** Listas iniciales en `SEED_USERS` y `SEED_TIENDAS`: al entrar por primera vez cargan los usuarios y tiendas de la tabla de arriba. Cambiar ahí para usar datos reales.

**`src/routes/index.tsx` — la pantalla de evaluación.** El flujo paso a paso y la validación del formulario (todos los campos obligatorios; DNI de 8 dígitos y teléfono de 9 dígitos).

---

## 4. Cambios frecuentes

- **Cambiar precios, plazos o puntajes** → `src/lib/credit.ts`.
- **Agregar/quitar asesores o tiendas** → `SEED_USERS` / `SEED_TIENDAS` en `src/lib/auth.ts`.
- **Cambiar colores o tipografía** → `src/styles.css`.
- **Modificar el formulario del cliente** (campos obligatorios, DNI 8 dígitos, teléfono 9 dígitos) → `src/routes/index.tsx`.
- **Cambiar el login** (usuarios y contraseñas) → `src/lib/auth.ts`.

> Nota: como los datos están en localStorage del navegador, si ya hay evaluaciones guardadas y se cambia la clave de guardado (`carsa.evaluaciones.v2`), las anteriores no se verán.

---

## 5. Preparado para backend

La migración a futuro es directa porque:

- `credit.ts` no toca el navegador: puede correr igual en un servidor.
- `storage.ts` es el único punto de acceso a los datos (TODOs marcados para reemplazar por llamadas a la API).
- `auth.ts` concentra la sesión, para sustituirla por autenticación real.

No hay que rehacer pantallas ni lógica: solo cambiar de dónde salen los datos.

---

## 6. Clientes de ejemplo para probar la solicitud

Datos ficticios para rellenar rápido el formulario de la solicitud de crédito (paso "Datos del cliente"). Todos cumplen las reglas del formulario: DNI de 8 dígitos, teléfono de 9 dígitos e ingreso mayor a 0.

**Cliente 1 — puntaje alto (aprueba con mejor tramo)**

| Campo          | Valor                            |
| -------------- | -------------------------------- |
| Nombre         | María Elena Quispe Flores        |
| DNI            | `45781236`                       |
| Teléfono       | `987654321`                      |
| Dirección      | Av. Los Próceres 450, SJM, Lima  |
| Ingreso mensual| S/ 3 500                         |
| Independiente  | No (dependiente)                 |
| Antigüedad     | 6 años                           |
| Referencias    | 3                                |
| Historial      | Bueno                            |

**Cliente 2 — puntaje medio (tramo intermedio)**

| Campo          | Valor                            |
| -------------- | -------------------------------- |
| Nombre         | Carlos Alberto Ríos Mendoza      |
| DNI            | `08456712`                       |
| Teléfono       | `951234567`                      |
| Dirección      | Jr. Huancavelica 210, Comas      |
| Ingreso mensual| S/ 2 000                         |
| Independiente  | Sí                               |
| Antigüedad     | 2 años                           |
| Referencias    | 1                                |
| Historial      | Nuevo                            |

**Cliente 3 — puntaje bajo (va a revisión manual)**

| Campo          | Valor                            |
| -------------- | -------------------------------- |
| Nombre         | Juan Pérez Sánchez               |
| DNI            | `72345698`                       |
| Teléfono       | `912345678`                      |
| Dirección      | Calle Real 88, Huancayo          |
| Ingreso mensual| S/ 700                           |
| Independiente  | No (dependiente)                 |
| Antigüedad     | Menos de 1 año                   |
| Referencias    | 0                                |
| Historial      | Moroso                           |

> ⚠️ Son datos inventados solo para pruebas; no corresponden a personas reales y no se cargan solos en la app: hay que escribirlos en el formulario.
