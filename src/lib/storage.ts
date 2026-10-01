// Capa de persistencia. Hoy: localStorage. Mañana: reemplazar cada función por fetch al backend.
import {
  cuota, cuotaMaxima, disponible, nuevoId, puntaje, tramo, PRODUCTOS,
  type Cliente, type DatosFinancieros, type Decision, type Evaluacion,
} from "./credit";

const KEY = "carsa.evaluaciones.v1";
const delay = () => new Promise((r) => setTimeout(r, 120));

function read(): Evaluacion[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const seed = semilla();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
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

function semilla(): Evaluacion[] {
  const d = (h: number) => new Date(Date.now() - h * 3600_000);
  return [
    construir({ nombre: "María Fernández Quispe", dni: "45872163", telefono: "987 654 321", direccion: "Jr. Junín 452, Huancayo" },
      { ingreso: 1200, gastos: 400, tipoTrabajo: "independiente", antiguedad: "1a3", referencias: 1, historial: "nuevo" },
      "revision", "Rosa Huamán", "HYO-012", null, null, d(50)),
    construir({ nombre: "Carlos Ruiz Mamani", dni: "41236598", telefono: "954 112 778", direccion: "Av. Los Héroes 1180, San Juan de Miraflores" },
      { ingreso: 1800, gastos: 600, tipoTrabajo: "dependiente", antiguedad: "mas3", referencias: 2, historial: "bueno" },
      "aprobado", "Luis Ccori", "LIM-034", "tv", 12, d(26)),
    construir({ nombre: "Juan Pérez Condori", dni: "70451289", telefono: "923 448 190", direccion: "Calle Lima 233, Juliaca" },
      { ingreso: 900, gastos: 500, tipoTrabajo: "independiente", antiguedad: "menos1", referencias: 0, historial: "moroso" },
      "revision", "Rosa Huamán", "HYO-012", null, null, d(3)),
  ];
}
