export default function GovernancePanel({ frame }) {
  if (!frame) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Safeguards</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">Confidence and operating assumptions</h2>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">Directional confidence</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{frame.confidenceLabel}</p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-lg font-semibold text-cyan-100">
            {frame.confidenceValue}/100
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">Assumptions</p>
          <div className="mt-3 space-y-2">
            {frame.assumptions.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">Safeguards</p>
          <div className="mt-3 space-y-2">
            {frame.safeguards.map((item) => (
              <div key={item} className="rounded-[20px] border border-emerald-400/15 bg-emerald-500/8 p-3 text-sm leading-6 text-emerald-50">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
