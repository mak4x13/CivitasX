export default function GovernancePanel({ frame }) {
  if (!frame) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Governance Layer</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">Confidence, ethics, and assumptions</h2>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Directional confidence</p>
            <p className="mt-1 text-sm text-slate-300">{frame.confidenceLabel}</p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-lg font-semibold text-cyan-200">
            {frame.confidenceValue}/100
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Assumptions</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {frame.assumptions.map((item) => (
              <li key={item} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Safeguards</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {frame.safeguards.map((item) => (
              <li key={item} className="rounded-2xl border border-emerald-400/12 bg-emerald-500/8 p-3 text-emerald-50">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
