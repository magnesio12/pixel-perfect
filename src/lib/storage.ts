// Capa de persistencia de evaluaciones (localStorage). Punto único a reemplazar por la API.
import {
  cuota, cuotaMaxima, disponible, nuevoId, plazos, productos, puntaje, tramo,
  type Antiguedad, type Cliente, type DatosFinancieros, type Decision, type Evaluacion, type Historial, type TipoTrabajo,
} from "./credit";

const KEY = "carsa.evaluaciones.v3";
const delay = () => new Promise((r) => setTimeout(r, 120));

export function storageDisponible(): boolean {
  try {
    const k = "__carsa_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function read(): Evaluacion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    const seed = semilla();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return [];
  }
}

export async function listarEvaluaciones(): Promise<Evaluacion[]> {
  await delay();
  return read().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

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
  const p = productos().find((x) => x.id === productoId) ?? null;
  const factor = plazos().find((x) => x.meses === plazo)?.factor ?? 0;
  return {
    id: nuevoId(), fecha: fecha.toISOString(), cliente, datos, puntaje: total, tramo: t.id,
    cuotaMaxima: cuotaMaxima(Math.max(disp, 0), t),
    producto: p ? { id: p.id, nombre: p.nombre, precio: p.precio } : null,
    plazo, cuota: p && plazo ? cuota(p.precio, factor) : null, decision, asesor, tienda,
  };
}

// 120 solicitudes históricas de ejemplo (deterministas).
const NOMBRES = ["María", "José", "Rosa", "Luis", "Carmen", "Jorge", "Ana", "Pedro", "Lucía", "Miguel", "Elena", "Raúl", "Sofía", "Víctor", "Julia"];
const APELLIDOS = ["Quispe", "Huamán", "Flores", "Mamani", "Rojas", "Torres", "Ramos", "Castillo", "Vargas", "Chávez", "Mendoza", "Ccori", "Paredes", "Gutiérrez"];
const CALLES = ["Av. Giráldez", "Jr. Junín", "Av. Los Héroes", "Jr. Ica", "Av. Túpac Amaru", "Calle Real", "Av. Huancavelica"];
export const ASESORES_EJEMPLO = ["Luis Ccori Ramos (AS-0341)", "Rosa Huamán Torres (AS-0127)", "Pedro Salas Vega (AS-0210)", "Ana Rojas Paz (AS-0388)"];
export const TIENDAS_EJEMPLO = ["LIM-034 · San Juan de Miraflores", "LIM-021 · Comas", "HYO-012 · Huancayo Centro"];

function semilla(): Evaluacion[] {
  let s = 20260101;
  const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const prods = productos();
  const pls = plazos();
  const out: Evaluacion[] = [];
  for (let i = 0; i < 120; i++) {
    const nombre = `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
    const cliente: Cliente = {
      nombre,
      dni: String(10000000 + Math.floor(r() * 89999999)),
      telefono: "9" + String(Math.floor(r() * 1e8)).padStart(8, "0"),
      direccion: `${pick(CALLES)} ${100 + Math.floor(r() * 900)}`,
    };
    const ingreso = 1000 + Math.round(r() * 40) * 100;
    const datos: DatosFinancieros = {
      ingreso,
      gastos: Math.round((ingreso * (0.2 + r() * 0.5)) / 50) * 50,
      tipoTrabajo: pick(["dependiente", "pensionista", "independiente"] as TipoTrabajo[]),
      antiguedad: pick(["menos1", "1a3", "mas3"] as Antiguedad[]),
      referencias: pick([0, 1, 2] as const),
      historial: pick(["bueno", "bueno", "nuevo", "moroso"] as Historial[]),
    };
    const fecha = new Date(Date.now() - Math.floor(r() * 90 * 86400000));
    const ev0 = construir(cliente, datos, "revision", pick(ASESORES_EJEMPLO), pick(TIENDAS_EJEMPLO), null, null, fecha);
    if (ev0.tramo === "revision") { out.push(ev0); continue; }
    const prod = pick(prods);
    const pl = pls.find((p) => cuota(prod.precio, p.factor) <= ev0.cuotaMaxima);
    const decision: Decision = pl ? (r() < 0.85 ? "aprobado" : "rechazado") : "rechazado";
    const plazo = pl?.meses ?? pls[pls.length - 1].meses;
    out.push({ ...construir(cliente, datos, decision, ev0.asesor, ev0.tienda, prod.id, plazo, fecha), id: ev0.id });
  }
  return out;
}
