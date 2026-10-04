import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { storageDisponible } from "@/lib/storage";

export function Shell({ children }: { children: ReactNode }) {
  const [sinStorage, setSinStorage] = useState(false);
  useEffect(() => { setSinStorage(!storageDisponible()); }, []);
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-md bg-accent px-2 py-1 font-display text-2xl font-black italic">carsa</span>
            <span className="hidden font-display text-sm uppercase tracking-wider opacity-80 sm:block">Evaluación de crédito</span>
          </Link>
          <nav className="flex gap-1 font-display text-base font-bold uppercase">
            <Link to="/" className="rounded-md px-3 py-2" activeProps={{ className: "bg-primary" }} activeOptions={{ exact: true }}>Nueva</Link>
            <Link to="/historial" className="rounded-md px-3 py-2" activeProps={{ className: "bg-primary" }}>Historial</Link>
          </nav>
        </div>
      </header>
      {sinStorage && (
        <div role="alert" className="bg-accent text-accent-foreground">
          <div className="mx-auto max-w-5xl px-4 py-3 font-semibold">
            Tu navegador tiene bloqueado el almacenamiento local. La app no podrá guardar evaluaciones ni configuración.
            Activa las cookies y datos de sitios (o sal del modo incógnito) y recarga la página.
          </div>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
}
