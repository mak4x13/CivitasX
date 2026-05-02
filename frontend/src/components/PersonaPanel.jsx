function toneClass(status) {
  if (status === 'Critical') {
    return 'text-rose-300 border-rose-400/15 bg-rose-500/8';
  }

  if (status === 'High') {
    return 'text-orange-300 border-orange-400/15 bg-orange-500/8';
  }

  if (status === 'Medium') {
    return 'text-amber-300 border-amber-400/15 bg-amber-500/8';
  }

  return 'text-emerald-300 border-emerald-400/15 bg-emerald-500/8';
}

export default function PersonaPanel({ personas }) {
  if (!personas || personas.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Stakeholder Layer</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">Who gets hit first</h2>
        <p className="mt-2 text-sm text-slate-400">
          Lightweight persona reactions make the simulation feel human instead of purely abstract.
        </p>
      </div>

      <div className="space-y-3">
        {personas.map((persona) => (
          <div key={persona.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{persona.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{persona.focus}</p>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(persona.status)}`}>
                {persona.status} • {persona.score}/100
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{persona.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-slate-200">
                Exposure zone: {persona.zone}
              </span>
            </div>
            <p className="mt-3 rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-200">
              Mitigation: {persona.driver}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
