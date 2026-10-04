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

1. **Nueva evaluación** (paso a paso): datos del cliente → resultado con puntaje y desglose → simulador de cuota → registro. En el registro el asesor escribe su nombre/código y la tienda (se recuerdan para la siguiente evaluación).
2. **Historial**: filtra evaluaciones por fecha, decisión y asesor; exporta a JSON.
3. **Administración** (`/admin`): solo para el área de créditos, protegida con clave. Permite ajustar la tabla de puntaje, los tramos y su % de cuota máxima, los plazos y sus tasas (factor), y el catálogo de productos. Los cambios se aplican a las evaluaciones nuevas.

No hay login para asesores: la app se abre directo en la evaluación.

### Clave de /admin y cómo cambiarla

Clave actual: **`carsa-admin-2026`**.

Para cambiarla, abre `src/routes/admin.tsx` y edita la constante al inicio del archivo:

```ts
const CLAVE_ADMIN = "carsa-admin-2026";
```

Guarda, vuelve a compilar/publicar y la nueva clave queda activa. El acceso se recuerda solo mientras la pestaña esté abierta.

> ⚠️ Es una clave simple dentro del código: evita el acceso directo casual a /admin, pero no es seguridad real. Con backend se reemplazará por usuarios con permisos.

### Qué está simulado (y qué no existe)

- **Guardado de datos**: evaluaciones y configuración se guardan en el propio navegador (localStorage) con una pequeña demora simulada (~120 ms), como si fuera un servidor. Cada navegador ve su propio historial.
- **Clave de /admin**: validación local, sin servidor.

**No existe y no se envía nada hacia afuera**: no hay correos, ni pagos, ni WhatsApp, ni conexión a servicios externos. La app funciona 100% sin internet.

### Si el navegador bloquea el almacenamiento

Si el navegador tiene bloqueado el almacenamiento local (modo incógnito estricto, cookies desactivadas), la app muestra un **aviso rojo** debajo de la barra superior indicando que no podrá guardar datos y cómo solucionarlo.

### Datos de ejemplo y cómo reiniciarlos

Al abrir la app por primera vez se precargan:

- **40 productos** en el catálogo.
- **120 solicitudes históricas** en el historial (últimos 90 días, varios asesores y tiendas, con decisiones aprobadas, rechazadas y en revisión).

Para volver al estado inicial, borra el localStorage: **F12 → Application → Local Storage → el dominio de la app → Clear**, y recarga. Las 120 solicitudes se vuelven a generar.

| Clave de localStorage     | Qué borra                                              |
| ------------------------- | ------------------------------------------------------ |
| `carsa.evaluaciones.v3`   | El historial (se regeneran las 120 de ejemplo)         |
| `carsa.config.v1`         | Ajustes hechos en /admin (vuelven los valores originales) |
| `carsa.asesor` / `carsa.tienda` | Asesor y tienda recordados en el registro        |

> Atajo: en la consola, `localStorage.clear()` borra todo.

---

## 3. Dónde está cada cosa

```
src/
├── routes/
│   ├── __root.tsx          # Estructura general (título, fuentes, lang)
│   ├── index.tsx           # Evaluación paso a paso
│   ├── historial.tsx       # Historial con filtros y exportación JSON
│   └── admin.tsx           # Panel de administración (clave CLAVE_ADMIN)
├── components/
│   └── Shell.tsx           # Barra superior, navegación y aviso de almacenamiento
├── lib/
│   ├── credit.ts           # ⭐ REGLAS DE NEGOCIO + configuración base (CONFIG_BASE, 40 productos)
│   ├── storage.ts          # Evaluaciones en localStorage + generación de las 120 de ejemplo
│   └── utils.ts            # Utilidades menores
└── styles.css              # Colores y estilos globales
```

**`src/lib/credit.ts`** — `CONFIG_BASE` contiene los valores originales: puntaje (ingreso disponible ≤800: 5, ≤1500: 15, más: 25; dependiente/pensionista 20, independiente 10; antigüedad 5/15/25; 5 pts por referencia; historial bueno 20, nuevo 0, moroso −10), tramos (`<40` revisión · `40–64` 20% · `65–84` 25% · `85+` 30%), plazos (6m 0.18, 12m 0.095, 18m 0.068, 24m 0.055) y el catálogo de 40 productos. Lo editado en /admin se guarda encima de estos valores.

**`src/lib/storage.ts`** — único punto de lectura/escritura de evaluaciones.

---

## 4. Cambios frecuentes

- **Puntajes, tramos, tasas o catálogo** → desde `/admin` (sin tocar código), o los valores base en `src/lib/credit.ts`.
- **Clave de /admin** → `CLAVE_ADMIN` en `src/routes/admin.tsx`.
- **Colores o tipografía** → `src/styles.css`.
- **Formulario del cliente** (campos obligatorios, DNI 8 dígitos, teléfono 9 dígitos) → `src/routes/index.tsx`.

---

## 5. Preparado para backend

- `credit.ts` no depende de pantallas: la lógica corre igual en un servidor; la configuración pasaría a una tabla.
- `storage.ts` es el único punto de acceso a evaluaciones: basta reemplazar sus funciones por llamadas a la API.
- La clave de /admin se reemplazaría por usuarios con rol de administrador.

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
| Gastos fijos   | S/ 1 200                         |
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
| Gastos fijos   | S/ 700                           |
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
| Gastos fijos   | S/ 400                           |
| Independiente  | No (dependiente)                 |
| Antigüedad     | Menos de 1 año                   |
| Referencias    | 0                                |
| Historial      | Moroso                           |

> ⚠️ Son datos inventados solo para pruebas; no corresponden a personas reales y no se cargan solos en la app: hay que escribirlos en el formulario.
