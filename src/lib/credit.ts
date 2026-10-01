// Lógica de negocio pura (sin storage). Migrable tal cual al backend.

export type TipoTrabajo = "dependiente" | "pensionista" | "independiente";
export type Antiguedad = "menos1" | "1a3" | "mas3";
export type Historial = "bueno" | "nuevo" | "moroso";
export type Decision = "aprobado" | "rechazado" | "revision";

export interface Cliente {
  nombre: string;
  dni: string;
  telefono: string;
  direccion: string;
}

export interface DatosFinancieros {
  ingreso: number;
  gastos: number;
  tipoTrabajo: TipoTrabajo;
  antiguedad: Antiguedad;
  referencias: 0 | 1 | 2;
  historial: Historial;
}

export const TIPO_LABEL: Record<TipoTrabajo, string> = {
  dependiente: "Dependiente",
  pensionista: "Pensionista",
  independiente: "Independiente",
};
export const ANTIG_LABEL: Record<Antiguedad, string> = {
  menos1: "Menos de 1 año",
  "1a3": "1 a 3 años",
  mas3: "Más de 3 años",
};
export const HIST_LABEL: Record<Historial, string> = {
  bueno: "Cliente con buen historial",
  nuevo: "Cliente nuevo",
  moroso: "Cliente con morosidad previa",
};

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  icono: string;
}

export const PRODUCTOS: Producto[] = [
  { id: "refri", nombre: "Refrigeradora 250L", precio: 1899, icono: "🧊" },
  { id: "tv", nombre: 'Televisor 55" Smart', precio: 2299, icono: "📺" },
  { id: "lava", nombre: "Lavadora 16kg", precio: 1499, icono: "🫧" },
  { id: "moto", nombre: "Moto 150cc", precio: 5800, icono: "🏍️" },
  { id: "cel", nombre: "Celular gama media", precio: 999, icono: "📱" },
];

export const PLAZOS = [
  { meses: 6, factor: 0.18 },
  { meses: 12, factor: 0.095 },
  { meses: 18, factor: 0.068 },
  { meses: 24, factor: 0.055 },
] as const;

export const disponible = (d: Pick<DatosFinancieros, "ingreso" | "gastos">) => d.ingreso - d.gastos;

export interface Criterio {
  nombre: string;
  valor: string;
  puntos: number;
}

export function puntaje(d: DatosFinancieros): { criterios: Criterio[]; total: number } {
  const disp = disponible(d);
  const ptsIngreso = disp <= 800 ? 5 : disp <= 1500 ? 15 : 25;
  const ptsTipo = d.tipoTrabajo === "independiente" ? 10 : 20;
  const ptsAnt = d.antiguedad === "menos1" ? 5 : d.antiguedad === "1a3" ? 15 : 25;
  const ptsRef = d.referencias * 5;
  const ptsHist = d.historial === "bueno" ? 20 : d.historial === "nuevo" ? 0 : -10;
  const criterios: Criterio[] = [
    { nombre: "Ingreso disponible", valor: soles(disp), puntos: ptsIngreso },
    { nombre: "Tipo de trabajo", valor: TIPO_LABEL[d.tipoTrabajo], puntos: ptsTipo },
    { nombre: "Antigüedad", valor: ANTIG_LABEL[d.antiguedad], puntos: ptsAnt },
    { nombre: "Referencias verificadas", valor: `${d.referencias}`, puntos: ptsRef },
    { nombre: "Historial con la tienda", valor: HIST_LABEL[d.historial], puntos: ptsHist },
  ];
  return { criterios, total: criterios.reduce((s, c) => s + c.puntos, 0) };
}

export type Tramo = { id: "revision" | "t20" | "t25" | "t30"; label: string; pct: number };

export function tramo(total: number): Tramo {
  if (total < 40) return { id: "revision", label: "Revisión manual", pct: 0 };
  if (total < 65) return { id: "t20", label: "Tramo 40–64 · 20%", pct: 0.2 };
  if (total < 85) return { id: "t25", label: "Tramo 65–84 · 25%", pct: 0.25 };
  return { id: "t30", label: "Tramo 85+ · 30%", pct: 0.3 };
}

export const cuotaMaxima = (disp: number, t: Tramo) => Math.round(disp * t.pct * 100) / 100;
export const cuota = (precio: number, factor: number) => Math.round(precio * factor * 100) / 100;

export function plazoMinimo(precio: number, max: number): number | null {
  const p = PLAZOS.find((p) => cuota(precio, p.factor) <= max);
  return p ? p.meses : null;
}

export const soles = (n: number) =>
  "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export interface Evaluacion {
  id: string;
  fecha: string; // ISO
  cliente: Cliente;
  datos: DatosFinancieros;
  puntaje: number;
  tramo: Tramo["id"];
  cuotaMaxima: number;
  producto: { id: string; nombre: string; precio: number } | null;
  plazo: number | null;
  cuota: number | null;
  decision: Decision;
  asesor: string;
  tienda: string;
}

export const nuevoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
