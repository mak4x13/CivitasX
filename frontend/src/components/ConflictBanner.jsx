function severityTone(level) {
  if (level === 'critical') {
    return 'border-rose-400/20 bg-rose-500/10 text-rose-50';
  }

  if (level === 'warning') {
    return 'border-amber-400/20 bg-amber-500/10 text-amber-50';
  }

  return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50';
}

export default function ConflictBanner({ conflicts }) {
  const hasConflict = conflicts && conflicts.length > 0;
  const tone = hasConflict ? (conflicts.length > 1 ? 'critical' : 'warning') : 'safe';
  const primaryConflict = hasConflict ? conflicts[0] : null;
  const secondaryConflict = conflicts?.[1] || null;

  return (
    <section className={`rounded-[30px] border px-5 py-4 shadow-[0_20px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl ${severityTone(tone)}`}>
      <div className="max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
          Policy tension
          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[0.62rem]">
            {hasConflict ? `${conflicts.length} signal${conflicts.length > 1 ? 's' : ''}` : 'Stable'}
          </span>
        </div>

        <h2 className="mt-3 font-display text-2xl font-semibold">
          {hasConflict ? 'The current policy mix is creating a visible tradeoff.' : 'No major cross-system contradiction is currently flagged.'}
        </h2>
        <p className="mt-2 text-sm leading-7 opacity-90">
          {primaryConflict ||
            'The current scenario is still being monitored for downstream effects, but no major contradiction has been flagged across agents.'}
        </p>

        {secondaryConflict ? (
          <div className="mt-4 rounded-[22px] border border-white/10 bg-black/15 p-4">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] opacity-70">Secondary signal</p>
            <p className="mt-2 text-sm leading-6">{secondaryConflict}</p>
          </div>
        ) : null}

        {conflicts && conflicts.length > 2 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {conflicts.slice(2, 4).map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
