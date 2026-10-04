import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, Shell } from "@/components/Shell";
import {
  ANTIG_LABEL, HIST_LABEL, TIPO_LABEL, plazos, productos, cuota, cuotaMaxima, disponible,
  plazoMinimo, puntaje, soles, tramo,
  type Antiguedad, type Cliente, type DatosFinancieros, type Decision, type Historial, type TipoTrabajo,
} from "@/lib/credit";
import { construir, guardarEvaluacion } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nueva evaluación de crédito — Carsa" },
      { name: "description", content: "Evalúa el crédito del cliente con puntaje transparente y simula productos y plazos." },
      { property: "og:title", content: "Nueva evaluación de crédito — Carsa" },
      { property: "og:description", content: "Puntaje transparente y simulador de cuotas para asesores Carsa." },
    ],
  }),
  component: Page,
});

type Paso = "solicitud" | "resultado" | "simulador" | "confirmar";

const TRAMO_STYLE = {
  revision: "bg-bad-soft border-accent text-accent",
  t20: "bg-warn-soft border-warn text-ink",
  t25: "bg-orange-soft border-orange text-ink",
  t30: "bg-ok-soft border-ok text-ok",
};

function Page() {
  const nav = useNavigate();
  const [paso, setPaso] = useState<Paso>("solicitud");
  const [cliente, setCliente] = useState<Cliente>({ nombre: "", dni: "", telefono: "", direccion: "" });
  const [datos, setDatos] = useState<DatosFinancieros>({ ingreso: 0, gastos: 0, tipoTrabajo: "dependiente", antiguedad: "1a3", referencias: 0, historial: "nuevo" });
  const [prod, setProd] = useState<string | null>(null);
  const [plazo, setPlazo] = useState<number | null>(null);
  const [asesor, setAsesorRaw] = useState("");
  const [tienda, setTiendaRaw] = useState("");
  useEffect(() => { try { setAsesorRaw(localStorage.getItem("carsa.asesor") ?? ""); setTiendaRaw(localStorage.getItem("carsa.tienda") ?? ""); } catch { /* sin storage */ } }, []);
  const setAsesor = (v: string) => { setAsesorRaw(v); try { localStorage.setItem("carsa.asesor", v); } catch { /* sin storage */ } };
  const setTienda = (v: string) => { setTiendaRaw(v); try { localStorage.setItem("carsa.tienda", v); } catch { /* sin storage */ } };
  const [guardando, setGuardando] = useState(false);

  const disp = disponible(datos);
  const score = useMemo(() => puntaje(datos), [datos]);
  const t = tramo(score.total);
  const max = cuotaMaxima(Math.max(disp, 0), t);
  const formOk = cliente.nombre.trim() && /^\d{8}$/.test(cliente.dni) && /^\d{9}$/.test(cliente.telefono) && cliente.direccion.trim() && datos.ingreso > 0 && disp >= 0;

  const producto = productos().find((p) => p.id === prod) ?? null;
  const factor = plazos().find((p) => p.meses === plazo)?.factor;
  const cuotaSel = producto && factor ? cuota(producto.precio, factor) : null;

  async function decidir(decision: Decision) {
    setGuardando(true);
    await guardarEvaluacion(construir(cliente, datos, decision, asesor, tienda, prod, plazo));
    nav({ to: "/historial" });
  }

  const setD = <K extends keyof DatosFinancieros>(k: K, v: DatosFinancieros[K]) => setDatos({ ...datos, [k]: v });

  return (
    <Shell>
      <Steps paso={paso} />

      {paso === "solicitud" && (
        <div className="grid gap-5">
          <Card>
            <h2 className="mb-4 text-2xl font-bold">Datos del cliente</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Nombre completo"><input className="field" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} placeholder="Ej. Rosa Huamán Torres" /></F>
              <F label="DNI (8 dígitos)"><input className="field" inputMode="numeric" maxLength={8} value={cliente.dni} onChange={(e) => setCliente({ ...cliente, dni: e.target.value.replace(/\D/g, "") })} placeholder="45872163" /></F>
              <F label="Teléfono (9 dígitos)"><input className="field" inputMode="numeric" maxLength={9} value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value.replace(/\D/g, "") })} placeholder="987654321" /></F>
              <F label="Dirección"><input className="field" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} placeholder="Jr. Junín 452, Huancayo" /></F>
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 text-2xl font-bold">Datos financieros</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Ingreso mensual (S/)"><input className="field" type="number" min={0} inputMode="decimal" value={datos.ingreso || ""} onChange={(e) => setD("ingreso", Number(e.target.value))} /></F>
              <F label="Gastos fijos declarados (S/)"><input className="field" type="number" min={0} inputMode="decimal" value={datos.gastos || ""} onChange={(e) => setD("gastos", Number(e.target.value))} /></F>
              <F label="Tipo de trabajo"><Sel value={datos.tipoTrabajo} opts={TIPO_LABEL} onChange={(v) => setD("tipoTrabajo", v as TipoTrabajo)} /></F>
              <F label="Antigüedad"><Sel value={datos.antiguedad} opts={ANTIG_LABEL} onChange={(v) => setD("antiguedad", v as Antiguedad)} /></F>
              <F label="Referencias verificadas">
                <div className="grid grid-cols-3 gap-2">
                  {([0, 1, 2] as const).map((n) => (
                    <button key={n} onClick={() => setD("referencias", n)} className={`btn border-2 ${datos.referencias === n ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>{n}</button>
                  ))}
                </div>
              </F>
              <F label="Historial con la tienda"><Sel value={datos.historial} opts={HIST_LABEL} onChange={(v) => setD("historial", v as Historial)} /></F>
            </div>
            <div className={`mt-5 flex items-center justify-between rounded-lg p-4 ${disp < 0 ? "bg-bad-soft text-accent" : "bg-secondary"}`}>
              <span className="font-semibold">Ingreso disponible</span>
              <span className="font-display text-3xl font-bold">{soles(disp)}</span>
            </div>
            {disp < 0 && <p className="mt-2 font-semibold text-accent">Los gastos superan al ingreso. Revisa los montos con el cliente.</p>}
          </Card>
          <button disabled={!formOk} onClick={() => setPaso("resultado")} className="btn w-full bg-primary text-primary-foreground">Calcular puntaje</button>
          {!formOk && <p className="-mt-3 text-center text-sm text-muted-foreground">Completa todos los campos: nombre, DNI de 8 dígitos, teléfono de 9 dígitos, dirección e ingreso.</p>}
        </div>
      )}

      {paso === "resultado" && (
        <div className="grid gap-5">
          <Card>
            <h2 className="mb-1 text-2xl font-bold">{cliente.nombre}</h2>
            <p className="mb-4 text-muted-foreground">DNI {cliente.dni}</p>
            <div className="divide-y">
              {score.criterios.map((c) => (
                <div key={c.nombre} className="flex items-center justify-between gap-3 py-3">
                  <div><div className="font-semibold">{c.nombre}</div><div className="text-sm text-muted-foreground">{c.valor}</div></div>
                  <span className={`font-display text-2xl font-bold ${c.puntos < 0 ? "text-accent" : "text-primary"}`}>{c.puntos > 0 ? "+" : ""}{c.puntos}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3">
                <span className="font-display text-xl font-bold uppercase">Puntaje total</span>
                <span className="font-display text-4xl font-black">{score.total}</span>
              </div>
            </div>
          </Card>
          <div className={`rounded-xl border-4 p-6 text-center ${TRAMO_STYLE[t.id]}`}>
            <div className="font-display text-lg font-bold uppercase">{t.label}</div>
            {t.id === "revision" ? (
              <>
                <div className="mt-2 font-display text-3xl font-black">Derivar a revisión de crédito</div>
                <p className="mt-1 font-semibold">No aprobable por asesor. El puntaje ({score.total}) es menor a 40.</p>
              </>
            ) : (
              <>
                <div className="mt-2 text-sm font-semibold uppercase">Cuota máxima mensual</div>
                <div className="font-display text-6xl font-black">{soles(max)}</div>
                <p className="mt-2 font-medium">Tu cuota máxima es {soles(max)} porque tu ingreso disponible es {soles(disp)} y puedes comprometer el {t.pct * 100}%.</p>
              </>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => setPaso("solicitud")} className="btn border-2 border-input bg-card">Corregir datos</button>
            {t.id === "revision"
              ? <button onClick={() => setPaso("confirmar")} className="btn bg-warn text-ink">Guardar para revisión</button>
              : <button onClick={() => setPaso("simulador")} className="btn bg-primary text-primary-foreground">Ir al simulador</button>}
          </div>
        </div>
      )}

      {paso === "simulador" && (
        <div className="grid gap-5">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl bg-ink p-4 text-ink-foreground">
            <span className="font-display uppercase">Cuota máxima</span>
            <span className="font-display text-3xl font-black">{soles(max)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {productos().map((p) => {
              const min = plazoMinimo(p.precio, max);
              return (
                <button key={p.id} onClick={() => { setProd(p.id); setPlazo(min); }}
                  className={`rounded-xl border-4 bg-card p-4 text-left transition ${prod === p.id ? "border-primary" : "border-transparent"}`}>
                  <div className="text-4xl">{p.icono}</div>
                  <div className="mt-2 font-display text-lg font-bold leading-tight">{p.nombre}</div>
                  <div className="text-muted-foreground">{soles(p.precio)}</div>
                  <div className={`mt-2 text-xs font-bold uppercase ${min ? "text-ok" : "text-accent"}`}>{min ? `Desde ${min} meses` : "No califica"}</div>
                </button>
              );
            })}
          </div>
          {producto && (
            <Card>
              <h3 className="mb-3 text-xl font-bold">{producto.nombre} · elige plazo</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {plazos().map((pl) => {
                  const c = cuota(producto.precio, pl.factor);
                  const ok = c <= max;
                  return (
                    <button key={pl.meses} onClick={() => setPlazo(pl.meses)}
                      className={`rounded-xl border-4 p-4 text-center ${ok ? "bg-ok-soft" : "bg-bad-soft"} ${plazo === pl.meses ? "border-ink" : "border-transparent"}`}>
                      <div className="font-display text-lg font-bold">{pl.meses} meses</div>
                      <div className={`font-display text-2xl font-black ${ok ? "text-ok" : "text-accent"}`}>{soles(c)}</div>
                      <div className="text-xs font-bold uppercase">{ok ? "● Entra" : "● No entra"}</div>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const min = plazoMinimo(producto.precio, max);
                return (
                  <p className={`mt-4 rounded-lg p-3 font-semibold ${min ? "bg-ok-soft" : "bg-bad-soft text-accent"}`}>
                    {min ? `Plazo mínimo sugerido: ${min} meses.` : `No califica para este producto: la cuota más baja (${soles(cuota(producto.precio, plazos()[plazos().length - 1].factor))} a ${plazos()[plazos().length - 1].meses} meses) supera tu cuota máxima de ${soles(max)}.`}
                  </p>
                );
              })()}
              {cuotaSel !== null && cuotaSel > max && (
                <p className="mt-2 text-accent">No te alcanza porque tu ingreso disponible es {soles(disp)} y la cuota sale {soles(cuotaSel)} (máximo {soles(max)}).</p>
              )}
            </Card>
          )}
          <Card>
            <h3 className="mb-3 text-xl font-bold">Comparativa completa</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-2">Producto</th>{plazos().map((p) => <th key={p.meses} className="text-center">{p.meses}m</th>)}</tr></thead>
                <tbody>
                  {productos().map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 font-semibold">{p.nombre}</td>
                      {plazos().map((pl) => { const c = cuota(p.precio, pl.factor); return (
                        <td key={pl.meses} className="p-1"><div className={`rounded-md py-2 text-center font-bold ${c <= max ? "bg-ok-soft text-ok" : "bg-bad-soft text-accent"}`}>{soles(c)}</div></td>
                      ); })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => setPaso("resultado")} className="btn border-2 border-input bg-card">Volver</button>
            <button disabled={!producto || !plazo} onClick={() => setPaso("confirmar")} className="btn bg-primary text-primary-foreground">Continuar</button>
          </div>
        </div>
      )}

      {paso === "confirmar" && (
        <div className="grid gap-5">
          <Card>
            <h2 className="mb-4 text-2xl font-bold">Resumen</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <R k="Cliente" v={`${cliente.nombre} · DNI ${cliente.dni}`} />
              <R k="Puntaje" v={`${score.total} pts · ${t.label}`} />
              <R k="Cuota máxima" v={t.id === "revision" ? "—" : soles(max)} />
              <R k="Producto" v={producto ? `${producto.nombre} (${soles(producto.precio)})` : "—"} />
              <R k="Plazo" v={plazo ? `${plazo} meses` : "—"} />
              <R k="Cuota" v={cuotaSel !== null ? soles(cuotaSel) : "—"} />
            </dl>
          </Card>
          <Card>
            <h2 className="mb-4 text-2xl font-bold">Datos del asesor</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Asesor (nombre y código)"><input className="field" value={asesor} onChange={(e) => setAsesor(e.target.value)} placeholder="Ej. Rosa Huamán (AS-0127)" /></F>
              <F label="Tienda"><input className="field" value={tienda} onChange={(e) => setTienda(e.target.value)} placeholder="Ej. HYO-012 · Huancayo Centro" /></F>
            </div>
          </Card>
          {(() => {
            const listo = asesor.trim() && tienda.trim() && !guardando;
            const puedeAprobar = t.id !== "revision" && cuotaSel !== null && cuotaSel <= max;
            return (
              <div className="grid gap-3 sm:grid-cols-3">
                <button disabled={!listo || !puedeAprobar} onClick={() => decidir("aprobado")} className="btn bg-ok text-primary-foreground">Aprobar crédito</button>
                <button disabled={!listo} onClick={() => decidir("rechazado")} className="btn bg-accent text-accent-foreground">Rechazar</button>
                <button disabled={!listo} onClick={() => decidir("revision")} className="btn bg-warn text-ink">Guardar para revisión</button>
                {t.id === "revision" && <p className="text-sm font-semibold text-accent sm:col-span-3">Puntaje menor a 40: el asesor no puede aprobar.</p>}
              </div>
            );
          })()}
          <button onClick={() => setPaso(t.id === "revision" ? "resultado" : "simulador")} className="btn border-2 border-input bg-card">Volver</button>
        </div>
      )}
    </Shell>
  );
}

function Steps({ paso }: { paso: Paso }) {
  const all: [Paso, string][] = [["solicitud", "Solicitud"], ["resultado", "Resultado"], ["simulador", "Simulador"], ["confirmar", "Registro"]];
  const i = all.findIndex(([p]) => p === paso);
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2">
      {all.map(([p, l], n) => (
        <li key={p} className={`rounded-md py-2 text-center font-display text-xs font-bold uppercase sm:text-sm ${n <= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n + 1}. {l}</li>
      ))}
    </ol>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-sm font-semibold">{label}</span>{children}</label>;
}
function Sel({ value, opts, onChange }: { value: string; opts: Record<string, string>; onChange: (v: string) => void }) {
  return <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{Object.entries(opts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>;
}
function R({ k, v }: { k: string; v: string }) {
  return <div className="rounded-lg bg-muted p-3"><dt className="text-xs font-semibold uppercase text-muted-foreground">{k}</dt><dd className="font-display text-lg font-bold">{v}</dd></div>;
}
