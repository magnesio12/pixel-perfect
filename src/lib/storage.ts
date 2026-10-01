// Capa de persistencia. Hoy: localStorage. Mañana: reemplazar cada función por fetch al backend.
import {
  cuota, cuotaMaxima, disponible, nuevoId, puntaje, tramo, PRODUCTOS,
  type Cliente, type DatosFinancieros, type Decision, type Evaluacion,
} from "./credit";

const KEY = "carsa.evaluaciones.v2";
const delay = () => new Promise((r) => setTimeout(r, 120));

function read(): Evaluacion[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// TODO backend: GET /api/evaluaciones?tienda=&asesor=
export async function listarEvaluaciones(): Promise<Evaluacion[]> {
  await delay();
  return read().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// TODO backend: POST /api/evaluaciones
export async function guardarEvaluacion(e: Evaluacion): Promise<Evaluacion> {
  await delay();
  const all = read();
  all.push(e);
  localStorage.setItem(KEY, JSON.stringify(all));
  return e;
}

export function construir(
  cliente: Cliente, datos: DatosFinancieros, decision: Decision,
  asesor: string, tienda: string, productoId: string | null, plazo: number | null, fecha = new Date(),
): Evaluacion {
  const disp = disponible(datos);
  const { total } = puntaje(datos);
  const t = tramo(total);
  const p = PRODUCTOS.find((x) => x.id === productoId) ?? null;
  const factor = plazo ? [0.18, 0.095, 0.068, 0.055][[6, 12, 18, 24].indexOf(plazo)] : 0;
  return {
    id: nuevoId(), fecha: fecha.toISOString(), cliente, datos, puntaje: total, tramo: t.id,
    cuotaMaxima: cuotaMaxima(disp, t),
    producto: p ? { id: p.id, nombre: p.nombre, precio: p.precio } : null,
    plazo, cuota: p && plazo ? cuota(p.precio, factor ?? 0) : null, decision, asesor, tienda,
  };
}

