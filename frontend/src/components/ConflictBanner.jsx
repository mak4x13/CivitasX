function severityTone(level) {
  if (level === 'critical') {
    return 'border-rose-400/20 bg-rose-500/10 text-rose-50';
  }

  if (level === 'warning') {
    return 'border-amber-400/20 bg-amber-500/10 text-amber-50';
  }

  return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50';
}

export default function ConflictBanner({ conflicts, recommendation }) {
  const hasConflict = conflicts && conflicts.length > 0;
  const tone = hasConflict ? (conflicts.length > 1 ? 'critical' : 'warning') : 'safe';

  return (
    <section className={`rounded-[28px] border px-5 py-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl ${severityTone(tone)}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-[0.7rem] uppercase tracking-[0.32em] opacity-75">Conflict Detector</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {hasConflict ? 'Policy conflict detected' : 'No major policy conflict detected'}
          </h2>
          <p className="mt-2 text-sm leading-6 opacity-90">
            {hasConflict
              ? conflicts[0]
              : 'The current scenario does not contain a major cross-agent contradiction. The system is still tracking downstream effects.'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 lg:max-w-[420px]">
          <p className="text-xs uppercase tracking-[0.22em] opacity-70">Advisor Response</p>
          <p className="mt-2 text-sm leading-6">{recommendation}</p>
        </div>
      </div>
    </section>
  );
}
