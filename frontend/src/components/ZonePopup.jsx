export default function ZonePopup({ zone, onClose }) {
  if (!zone) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-10 w-[min(100%,360px)] rounded-3xl border border-white/10 bg-slate-950/82 p-4 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Selected Zone</p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-white">{zone.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{zone.departmentName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Zone Stability</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{zone.stabilityScore}/100</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Risk Band</p>
          <p className="mt-1 text-2xl font-semibold capitalize text-amber-200">{zone.riskBand}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/60 p-3">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current Issues</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {zone.issues.map((issue) => (
            <span key={issue} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
              {issue}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-3 text-sm leading-6 text-slate-300">
        {zone.summary}
      </div>

      <div className="mt-4 text-sm leading-6 text-slate-300">
        <p>
          Traffic pressure: <span className="font-semibold text-white">{zone.displayTrafficPressure}</span>
        </p>
        <p>
          Protest pressure: <span className="font-semibold text-white">{zone.displayProtestPressure}</span>
        </p>
        <p>
          Police pressure: <span className="font-semibold text-white">{zone.displayPolicePressure}</span>
        </p>
      </div>
    </div>
  );
}
