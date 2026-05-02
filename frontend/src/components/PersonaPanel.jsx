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
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Stakeholder impact</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">Who is affected most</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          See the top stakeholder groups and the priorities they need next.
        </p>
      </div>

      <div className="grid gap-3">
        {personas.map((persona) => (
          <article key={persona.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{persona.name}</p>
                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">{persona.focus}</p>
              </div>
              <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass(persona.status)}`}>
                {persona.status} - {persona.score}/100
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">{persona.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Exposure zone: {persona.zone}</span>
            </div>

            <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-3">
              <p className="text-[0.64rem] uppercase tracking-[0.18em] text-slate-400">Mitigation priority</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{persona.driver}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
