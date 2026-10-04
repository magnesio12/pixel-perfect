// Lógica de negocio. Los parámetros (puntajes, tramos, plazos, catálogo) viven en una
// configuración editable desde /admin y guardada en localStorage.

export type TipoTrabajo = "dependiente" | "pensionista" | "independiente";
export type Antiguedad = "menos1" | "1a3" | "mas3";
export type Historial = "bueno" | "nuevo" | "moroso";
export type Decision = "aprobado" | "rechazado" | "revision";

export interface Cliente { nombre: string; dni: string; telefono: string; direccion: string }

export interface DatosFinancieros {
  ingreso: number;
  gastos: number;
  tipoTrabajo: TipoTrabajo;
  antiguedad: Antiguedad;
  referencias: 0 | 1 | 2;
  historial: Historial;
}

export const TIPO_LABEL: Record<TipoTrabajo, string> = { dependiente: "Dependiente", pensionista: "Pensionista", independiente: "Independiente" };
export const ANTIG_LABEL: Record<Antiguedad, string> = { menos1: "Menos de 1 año", "1a3": "1 a 3 años", mas3: "Más de 3 años" };
export const HIST_LABEL: Record<Historial, string> = { bueno: "Cliente con buen historial", nuevo: "Cliente nuevo", moroso: "Cliente con morosidad previa" };

export interface Producto { id: string; nombre: string; precio: number; icono: string }
export interface Plazo { meses: number; factor: number }
export type TramoId = "t20" | "t25" | "t30";
export interface TramoCfg { id: TramoId; min: number; pct: number }

export interface Config {
  puntos: {
    ingresoLim1: number; ingresoLim2: number;
    ingresoP1: number; ingresoP2: number; ingresoP3: number;
    tipo: Record<TipoTrabajo, number>;
    antiguedad: Record<Antiguedad, number>;
    porReferencia: number;
    historial: Record<Historial, number>;
  };
  tramos: TramoCfg[];
  plazos: Plazo[];
  productos: Producto[];
}

const P = (id: string, nombre: string, precio: number, icono: string): Producto => ({ id, nombre, precio, icono });

export const PRODUCTOS_BASE: Producto[] = [
  P("refri-250", "Refrigeradora 250L", 1899, "🧊"), P("refri-350", "Refrigeradora 350L No Frost", 2699, "🧊"),
  P("refri-sbs", "Refrigeradora Side by Side", 4599, "🧊"), P("frigobar", "Frigobar 90L", 699, "🧊"),
  P("tv-32", 'Televisor 32" HD', 899, "📺"), P("tv-43", 'Televisor 43" Smart', 1399, "📺"),
  P("tv-55", 'Televisor 55" Smart', 2299, "📺"), P("tv-65", 'Televisor 65" 4K', 3499, "📺"),
  P("lava-10", "Lavadora 10kg", 1099, "🫧"), P("lava-16", "Lavadora 16kg", 1499, "🫧"),
  P("lavaseca", "Lavaseca 20kg", 3299, "🫧"), P("secadora", "Secadora 15kg", 1899, "🫧"),
  P("cocina-4", "Cocina 4 hornillas", 799, "🔥"), P("cocina-6", "Cocina 6 hornillas", 1299, "🔥"),
  P("micro", "Horno microondas 30L", 399, "🍲"), P("horno", "Horno eléctrico 45L", 549, "🍲"),
  P("licua", "Licuadora 1.5L", 199, "🥤"), P("freidora", "Freidora de aire 5L", 349, "🍟"),
  P("terma", "Terma eléctrica 50L", 649, "🚿"), P("aspira", "Aspiradora robot", 899, "🧹"),
  P("cel-basic", "Celular gama básica", 499, "📱"), P("cel", "Celular gama media", 999, "📱"),
  P("cel-alta", "Celular gama alta", 2999, "📱"), P("tablet", 'Tablet 10"', 899, "📱"),
  P("laptop", "Laptop Core i5", 2599, "💻"), P("laptop-gamer", "Laptop gamer", 4299, "💻"),
  P("pc", "Computadora de escritorio", 2199, "🖥️"), P("impresora", "Impresora multifuncional", 599, "🖨️"),
  P("consola", "Consola de videojuegos", 2399, "🎮"), P("parlante", "Parlante Bluetooth", 399, "🔊"),
  P("equipo", "Equipo de sonido", 1199, "🔊"), P("cama-2", "Cama 2 plazas + colchón", 1599, "🛏️"),
  P("colchon", "Colchón 2 plazas", 899, "🛏️"), P("sofa", "Sofá 3 cuerpos", 1799, "🛋️"),
  P("comedor", "Juego de comedor 6 sillas", 1999, "🪑"), P("ropero", "Ropero 3 puertas", 1099, "🚪"),
  P("bici", "Bicicleta montañera", 899, "🚲"), P("scooter", "Scooter eléctrico", 1899, "🛴"),
  P("moto-110", "Moto 110cc", 4200, "🏍️"), P("moto", "Moto 150cc", 5800, "🏍️"),
];

export const CONFIG_BASE: Config = {
  puntos: {
    ingresoLim1: 800, ingresoLim2: 1500, ingresoP1: 5, ingresoP2: 15, ingresoP3: 25,
    tipo: { dependiente: 20, pensionista: 20, independiente: 10 },
    antiguedad: { menos1: 5, "1a3": 15, mas3: 25 },
    porReferencia: 5,
    historial: { bueno: 20, nuevo: 0, moroso: -10 },
  },
  tramos: [{ id: "t20", min: 40, pct: 0.2 }, { id: "t25", min: 65, pct: 0.25 }, { id: "t30", min: 85, pct: 0.3 }],
  plazos: [{ meses: 6, factor: 0.18 }, { meses: 12, factor: 0.095 }, { meses: 18, factor: 0.068 }, { meses: 24, factor: 0.055 }],
  productos: PRODUCTOS_BASE,
};

const K_CONFIG = "carsa.config.v1";

export function getConfig(): Config {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(K_CONFIG) : null;
    return raw ? { ...CONFIG_BASE, ...JSON.parse(raw) } : CONFIG_BASE;
  } catch {
    return CONFIG_BASE;
  }
}
export function guardarConfig(c: Config) { localStorage.setItem(K_CONFIG, JSON.stringify(c)); }
export function restaurarConfig() { localStorage.removeItem(K_CONFIG); }

export const productos = () => getConfig().productos;
export const plazos = () => [...getConfig().plazos].sort((a, b) => a.meses - b.meses);

export const disponible = (d: Pick<DatosFinancieros, "ingreso" | "gastos">) => d.ingreso - d.gastos;

export interface Criterio { nombre: string; valor: string; puntos: number }

export function puntaje(d: DatosFinancieros, cfg = getConfig()): { criterios: Criterio[]; total: number } {
  const p = cfg.puntos;
  const disp = disponible(d);
  const criterios: Criterio[] = [
    { nombre: "Ingreso disponible", valor: soles(disp), puntos: disp <= p.ingresoLim1 ? p.ingresoP1 : disp <= p.ingresoLim2 ? p.ingresoP2 : p.ingresoP3 },
    { nombre: "Tipo de trabajo", valor: TIPO_LABEL[d.tipoTrabajo], puntos: p.tipo[d.tipoTrabajo] },
    { nombre: "Antigüedad", valor: ANTIG_LABEL[d.antiguedad], puntos: p.antiguedad[d.antiguedad] },
    { nombre: "Referencias verificadas", valor: `${d.referencias}`, puntos: d.referencias * p.porReferencia },
    { nombre: "Historial con la tienda", valor: HIST_LABEL[d.historial], puntos: p.historial[d.historial] },
  ];
  return { criterios, total: criterios.reduce((s, c) => s + c.puntos, 0) };
}

export type Tramo = { id: "revision" | TramoId; label: string; pct: number };

export function tramo(total: number, cfg = getConfig()): Tramo {
  const ts = [...cfg.tramos].sort((a, b) => a.min - b.min);
  if (!ts.length || total < ts[0]!.min) return { id: "revision", label: "Revisión manual", pct: 0 };
  let i = 0;
  while (i + 1 < ts.length && total >= ts[i + 1]!.min) i++;
  const t = ts[i]!;
  const rango = i + 1 < ts.length ? `${t.min}–${ts[i + 1]!.min - 1}` : `${t.min}+`;
  return { id: t.id, label: `Tramo ${rango} · ${Math.round(t.pct * 1000) / 10}%`, pct: t.pct };
}

export const cuotaMaxima = (disp: number, t: Tramo) => Math.round(disp * t.pct * 100) / 100;
export const cuota = (precio: number, factor: number) => Math.round(precio * factor * 100) / 100;

export function plazoMinimo(precio: number, max: number): number | null {
  const p = plazos().find((p) => cuota(precio, p.factor) <= max);
  return p ? p.meses : null;
}

export const soles = (n: number) =>
  "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export interface Evaluacion {
  id: string;
  fecha: string;
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
