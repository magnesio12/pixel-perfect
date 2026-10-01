import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, Shell } from "@/components/Shell";
import { soles, type Decision, type Evaluacion } from "@/lib/credit";
import { listarEvaluaciones } from "@/lib/storage";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de evaluaciones — Carsa" },
      { name: "description", content: "Evaluaciones de crédito registradas por tienda y asesor." },
      { property: "og:title", content: "Historial de evaluaciones — Carsa" },
      { property: "og:description", content: "Consulta, filtra y exporta las decisiones de crédito." },
    ],
  }),
  component: HistorialPage,
});

const BADGE: Record<Decision, string> = {
  aprobado: "bg-ok text-primary-foreground",
  rechazado: "bg-accent text-accent-foreground",
  revision: "bg-warn text-ink",
};
const LABEL: Record<Decision, string> = { aprobado: "Aprobado", rechazado: "Rechazado", revision: "Revisión" };

function HistorialPage() {
  const [items, setItems] = useState<Evaluacion[] | null>(null);
  const [dec, setDec] = useState<"" | Decision>("");
  const [asesor, setAsesor] = useState("");
  const [fecha, setFecha] = useState("");
  const [json, setJson] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { listarEvaluaciones().then(setItems); }, []);

  const asesores = useMemo(() => [...new Set((items ?? []).map((i) => i.asesor))], [items]);
  const lista = (items ?? []).filter((i) =>
    (!dec || i.decision === dec) && (!asesor || i.asesor === asesor) && (!fecha || i.fecha.slice(0, 10) === fecha));
  const texto = JSON.stringify(lista, null, 2);

  return (
    <Shell>
      <h1 className="mb-4 text-4xl font-black uppercase">Historial</h1>
      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <input type="date" className="field" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <select className="field" value={dec} onChange={(e) => setDec(e.target.value as Decision | "")}>
            <option value="">Todas las decisiones</option>
            <option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option><option value="revision">Revisión</option>
          </select>
          <select className="field" value={asesor} onChange={(e) => setAsesor(e.target.value)}>
            <option value="">Todos los asesores</option>
            {asesores.map((a) => <option key={a}>{a}</option>)}
          </select>
          <button onClick={() => setJson(!json)} className="btn bg-ink text-ink-foreground">{json ? "Ocultar JSON" : "Exportar"}</button>
        </div>
      </Card>

      {json && (
        <Card className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">{lista.length} registros</span>
            <button className="btn min-h-10 bg-primary text-primary-foreground" onClick={async () => { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}>{copiado ? "Copiado" : "Copiar"}</button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-lg bg-ink p-3 text-xs text-ink-foreground">{texto}</pre>
        </Card>
      )}

      {items === null ? <p className="text-muted-foreground">Cargando…</p> : lista.length === 0 ? <p className="text-muted-foreground">No hay evaluaciones con esos filtros.</p> : (
        <div className="grid gap-3">
          {lista.map((e) => (
            <Card key={e.id} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl font-bold">{e.cliente.nombre}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${BADGE[e.decision]}`}>{LABEL[e.decision]}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {new Date(e.fecha).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })} · {e.asesor} · Tienda {e.tienda}
                </div>
                <div className="mt-1 text-sm">
                  {e.producto ? `${e.producto.nombre} · ${e.plazo} meses · ${soles(e.cuota ?? 0)}/mes` : "Sin producto"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-black">{e.puntaje}</div>
                <div className="text-xs uppercase text-muted-foreground">puntos</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
