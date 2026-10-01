import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { elegirTienda, login, logout, tiendasDe, useSesion, type Sesion, type Tienda } from "@/lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const { listo, sesion } = useSesion();
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-md bg-accent px-2 py-1 font-display text-2xl font-black italic">carsa</span>
            <span className="hidden font-display text-sm uppercase tracking-wider opacity-80 sm:block">Evaluación de crédito</span>
          </Link>
          {sesion?.tienda && (
            <nav className="flex gap-1 font-display text-base font-bold uppercase">
              <Link to="/" className="rounded-md px-3 py-2" activeProps={{ className: "bg-primary" }} activeOptions={{ exact: true }}>Nueva</Link>
              <Link to="/historial" className="rounded-md px-3 py-2" activeProps={{ className: "bg-primary" }}>Historial</Link>
            </nav>
          )}
        </div>
        {sesion && (
          <div className="bg-primary">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span><b>{sesion.nombre}</b></span>
                <span>Código: <b>{sesion.codigo}</b></span>
                <span>Tienda: <b>{sesion.tienda ? `${sesion.tienda.codigo} · ${sesion.tienda.nombre}` : "—"}</b></span>
              </div>
              <div className="flex gap-2">
                {sesion.tienda && <button onClick={() => elegirTienda(null)} className="rounded-md bg-ink px-3 py-2 font-semibold">Cambiar tienda</button>}
                <button onClick={logout} className="rounded-md bg-accent px-3 py-2 font-semibold">Salir</button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {!listo ? null : !sesion ? <Login /> : !sesion.tienda ? <SelectorTienda sesion={sesion} /> : children}
      </main>
    </div>
  );
}

function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const s = await login(u, p);
    setBusy(false);
    setErr(!s);
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-6 grid max-w-sm gap-4 rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="text-3xl font-black uppercase">Ingreso de asesor</h1>
      <label className="grid gap-1.5"><span className="text-sm font-semibold">Usuario</span>
        <input className="field" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} /></label>
      <label className="grid gap-1.5"><span className="text-sm font-semibold">Contraseña</span>
        <input className="field" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} /></label>
      {err && <p className="font-semibold text-accent">Usuario o contraseña incorrectos.</p>}
      <button disabled={busy || !u || !p} className="btn bg-primary text-primary-foreground">{busy ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}

function SelectorTienda({ sesion }: { sesion: Sesion }) {
  const [tiendas, setTiendas] = useState<Tienda[] | null>(null);
  useEffect(() => { tiendasDe(sesion.usuario).then(setTiendas); }, [sesion.usuario]);
  return (
    <div className="mx-auto mt-6 max-w-lg">
      <h1 className="mb-1 text-3xl font-black uppercase">Selecciona la tienda</h1>
      <p className="mb-4 text-muted-foreground">Elige dónde vas a operar hoy.</p>
      <div className="grid gap-3">
        {tiendas === null ? <p className="text-muted-foreground">Cargando…</p> : tiendas.length === 0 ? <p className="text-accent">No tienes tiendas asignadas.</p> :
          tiendas.map((t) => (
            <button key={t.codigo} onClick={() => elegirTienda(t)} className="rounded-xl border-4 border-transparent bg-card p-5 text-left shadow-sm hover:border-primary">
              <div className="font-display text-2xl font-bold">{t.nombre}</div>
              <div className="text-muted-foreground">Código {t.codigo}</div>
            </button>
          ))}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
}
