import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Card, Shell } from "@/components/Shell";
import {
  ANTIG_LABEL, CONFIG_BASE, HIST_LABEL, TIPO_LABEL, getConfig, guardarConfig, restaurarConfig,
  type Antiguedad, type Config, type Historial, type TipoTrabajo,
} from "@/lib/credit";

// Clave de acceso al panel. Para cambiarla, edita este valor (ver README).
const CLAVE_ADMIN = "carsa-admin-2026";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración de crédito — Carsa" },
      { name: "description", content: "Panel del área de créditos para ajustar puntajes, tramos, tasas y catálogo." },
      { property: "og:title", content: "Administración de crédito — Carsa" },
      { property: "og:description", content: "Ajuste de reglas de evaluación y catálogo de productos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [ok, setOk] = useState(false);
  const [clave, setClave] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => { try { setOk(sessionStorage.getItem("carsa.admin") === "1"); } catch { /* sin storage */ } }, []);
  function entrar(e: FormEvent) {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) { setOk(true); try { sessionStorage.setItem("carsa.admin", "1"); } catch { /* sin storage */ } }
    else setErr(true);
  }
  return (
    <Shell>
      {ok ? <Editor onSalir={() => { setOk(false); try { sessionStorage.removeItem("carsa.admin"); } catch { /* sin storage */ } }} /> : (
        <form onSubmit={entrar} className="mx-auto mt-6 grid max-w-sm gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-black uppercase">Administración</h1>
          <label className="grid gap-1.5"><span className="text-sm font-semibold">Clave de acceso</span>
            <input className="field" type="password" value={clave} onChange={(e) => { setClave(e.target.value); setErr(false); }} /></label>
          {err && <p className="font-semibold text-accent">Clave incorrecta.</p>}
          <button disabled={!clave} className="btn bg-primary text-primary-foreground">Entrar</button>
        </form>
      )}
    </Shell>
  );
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="grid gap-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <input className="field" type="number" step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(Number(e.target.value))} /></label>
  );
}
const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-3 sm:grid-cols-3">{children}</div>;

function Editor({ onSalir }: { onSalir: () => void }) {
  const [c, setC] = useState<Config>(CONFIG_BASE);
  const [msg, setMsg] = useState("");
  useEffect(() => { setC(getConfig()); }, []);
  const pt = c.puntos;
  const setP = (patch: Partial<Config["puntos"]>) => setC({ ...c, puntos: { ...pt, ...patch } });

  function guardar() {
    try { guardarConfig(c); setMsg("Cambios guardados. Se aplican a las nuevas evaluaciones."); }
    catch { setMsg("No se pudo guardar: el almacenamiento local está bloqueado."); }
  }
  function restaurar() {
    if (!confirm("¿Restaurar todos los valores originales?")) return;
    restaurarConfig(); setC(CONFIG_BASE); setMsg("Valores originales restaurados.");
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-black uppercase">Administración</h1>
        <button onClick={onSalir} className="btn border-2 border-input bg-card">Cerrar panel</button>
      </div>

      <Card>
        <h2 className="mb-3 text-2xl font-bold">Tabla de puntaje</h2>
        <h3 className="mb-2 font-semibold">Ingreso disponible</h3>
        <div className="grid gap-3 sm:grid-cols-5">
          <Num label="Límite 1 (S/)" value={pt.ingresoLim1} onChange={(n) => setP({ ingresoLim1: n })} />
          <Num label="Límite 2 (S/)" value={pt.ingresoLim2} onChange={(n) => setP({ ingresoLim2: n })} />
          <Num label="Pts ≤ límite 1" value={pt.ingresoP1} onChange={(n) => setP({ ingresoP1: n })} />
          <Num label="Pts ≤ límite 2" value={pt.ingresoP2} onChange={(n) => setP({ ingresoP2: n })} />
          <Num label="Pts > límite 2" value={pt.ingresoP3} onChange={(n) => setP({ ingresoP3: n })} />
        </div>
        <h3 className="mb-2 mt-4 font-semibold">Tipo de trabajo</h3>
        <Grid>{(Object.keys(TIPO_LABEL) as TipoTrabajo[]).map((k) => <Num key={k} label={TIPO_LABEL[k]} value={pt.tipo[k]} onChange={(n) => setP({ tipo: { ...pt.tipo, [k]: n } })} />)}</Grid>
        <h3 className="mb-2 mt-4 font-semibold">Antigüedad</h3>
        <Grid>{(Object.keys(ANTIG_LABEL) as Antiguedad[]).map((k) => <Num key={k} label={ANTIG_LABEL[k]} value={pt.antiguedad[k]} onChange={(n) => setP({ antiguedad: { ...pt.antiguedad, [k]: n } })} />)}</Grid>
        <h3 className="mb-2 mt-4 font-semibold">Historial y referencias</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {(Object.keys(HIST_LABEL) as Historial[]).map((k) => <Num key={k} label={HIST_LABEL[k]} value={pt.historial[k]} onChange={(n) => setP({ historial: { ...pt.historial, [k]: n } })} />)}
          <Num label="Pts por referencia" value={pt.porReferencia} onChange={(n) => setP({ porReferencia: n })} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-2xl font-bold">Tramos y cuota máxima</h2>
        <p className="mb-3 text-sm text-muted-foreground">Debajo del puntaje mínimo del primer tramo, la solicitud va a revisión manual.</p>
        <div className="grid gap-3">
          {c.tramos.map((t, i) => (
            <div key={t.id} className="grid gap-3 sm:grid-cols-2">
              <Num label={`Tramo ${i + 1} · puntaje desde`} value={t.min} onChange={(n) => setC({ ...c, tramos: c.tramos.map((x, j) => j === i ? { ...x, min: n } : x) })} />
              <Num label="% del disponible para cuota" step={0.5} value={Math.round(t.pct * 1000) / 10} onChange={(n) => setC({ ...c, tramos: c.tramos.map((x, j) => j === i ? { ...x, pct: n / 100 } : x) })} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-2xl font-bold">Plazos y tasas</h2>
        <p className="mb-3 text-sm text-muted-foreground">Factor: cuota mensual = precio × factor.</p>
        <div className="grid gap-3">
          {c.plazos.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <Num label="Meses" value={p.meses} onChange={(n) => setC({ ...c, plazos: c.plazos.map((x, j) => j === i ? { ...x, meses: n } : x) })} />
              <Num label="Factor" step={0.001} value={p.factor} onChange={(n) => setC({ ...c, plazos: c.plazos.map((x, j) => j === i ? { ...x, factor: n } : x) })} />
              <button disabled={c.plazos.length <= 1} onClick={() => setC({ ...c, plazos: c.plazos.filter((_, j) => j !== i) })} className="btn border-2 border-input bg-card">Quitar</button>
            </div>
          ))}
          <button onClick={() => setC({ ...c, plazos: [...c.plazos, { meses: 36, factor: 0.04 }] })} className="btn border-2 border-input bg-card">+ Agregar plazo</button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-2xl font-bold">Catálogo ({c.productos.length} productos)</h2>
        <div className="grid gap-2">
          {c.productos.map((p, i) => {
            const upd = (patch: Partial<typeof p>) => setC({ ...c, productos: c.productos.map((x, j) => j === i ? { ...x, ...patch } : x) });
            return (
              <div key={p.id} className="grid grid-cols-[3.5rem_1fr_7rem_auto] items-center gap-2">
                <input className="field text-center" value={p.icono} onChange={(e) => upd({ icono: e.target.value })} aria-label="Ícono" />
                <input className="field" value={p.nombre} onChange={(e) => upd({ nombre: e.target.value })} aria-label="Nombre" />
                <input className="field" type="number" value={p.precio} onChange={(e) => upd({ precio: Number(e.target.value) })} aria-label="Precio" />
                <button onClick={() => setC({ ...c, productos: c.productos.filter((_, j) => j !== i) })} className="btn border-2 border-input bg-card">✕</button>
              </div>
            );
          })}
          <button onClick={() => setC({ ...c, productos: [...c.productos, { id: `p-${Date.now()}`, nombre: "Nuevo producto", precio: 1000, icono: "📦" }] })} className="btn border-2 border-input bg-card">+ Agregar producto</button>
        </div>
      </Card>

      {msg && <p className="rounded-lg bg-secondary p-3 font-semibold">{msg}</p>}
      <div className="sticky bottom-0 grid gap-3 bg-background py-3 sm:grid-cols-2">
        <button onClick={restaurar} className="btn border-2 border-input bg-card">Restaurar valores originales</button>
        <button onClick={guardar} className="btn bg-primary text-primary-foreground">Guardar cambios</button>
      </div>
    </div>
  );
}
