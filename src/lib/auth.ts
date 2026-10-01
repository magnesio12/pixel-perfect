// Autenticación y sesión. Hoy: localStorage. Futuro backend:
// POST /api/auth/login, GET /api/tiendas, POST /api/sesion/tienda
import { useEffect, useState } from "react";

export interface Asesor { usuario: string; password: string; nombre: string; codigo: string; tiendas: string[] }
export interface Tienda { codigo: string; nombre: string }
export interface Sesion { usuario: string; nombre: string; codigo: string; tienda: Tienda | null }

const K_USERS = "carsa.asesores.v1";
const K_TIENDAS = "carsa.tiendas.v1";
const K_SESION = "carsa.sesion.v1";
const EVT = "carsa-sesion";

const SEED_USERS: Asesor[] = [
  { usuario: "lccori", password: "carsa123", nombre: "Luis Ccori Ramos", codigo: "AS-0341", tiendas: ["LIM-034", "LIM-021"] },
  { usuario: "rhuaman", password: "carsa123", nombre: "Rosa Huamán Torres", codigo: "AS-0127", tiendas: ["HYO-012"] },
];
const SEED_TIENDAS: Tienda[] = [
  { codigo: "LIM-034", nombre: "Carsa San Juan de Miraflores" },
  { codigo: "LIM-021", nombre: "Carsa Comas" },
  { codigo: "HYO-012", nombre: "Carsa Huancayo Centro" },
];

function get<T>(k: string, seed: T): T {
  const raw = localStorage.getItem(k);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(k, JSON.stringify(seed));
  return seed;
}
const delay = () => new Promise((r) => setTimeout(r, 150));
const emit = () => window.dispatchEvent(new Event(EVT));

export function leerSesion(): Sesion | null {
  const raw = localStorage.getItem(K_SESION);
  return raw ? JSON.parse(raw) : null;
}

export async function login(usuario: string, password: string): Promise<Sesion | null> {
  await delay();
  const u = get(K_USERS, SEED_USERS).find((x) => x.usuario === usuario.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  const s: Sesion = { usuario: u.usuario, nombre: u.nombre, codigo: u.codigo, tienda: null };
  localStorage.setItem(K_SESION, JSON.stringify(s));
  emit();
  return s;
}

export async function tiendasDe(usuario: string): Promise<Tienda[]> {
  await delay();
  const u = get(K_USERS, SEED_USERS).find((x) => x.usuario === usuario);
  return get(K_TIENDAS, SEED_TIENDAS).filter((t) => u?.tiendas.includes(t.codigo));
}

export function elegirTienda(t: Tienda | null) {
  const s = leerSesion();
  if (!s) return;
  localStorage.setItem(K_SESION, JSON.stringify({ ...s, tienda: t }));
  emit();
}

export function logout() {
  localStorage.removeItem(K_SESION);
  emit();
}

export function useSesion() {
  const [s, setS] = useState<{ listo: boolean; sesion: Sesion | null }>({ listo: false, sesion: null });
  useEffect(() => {
    const f = () => setS({ listo: true, sesion: leerSesion() });
    f();
    window.addEventListener(EVT, f);
    window.addEventListener("storage", f);
    return () => { window.removeEventListener(EVT, f); window.removeEventListener("storage", f); };
  }, []);
  return s;
}
