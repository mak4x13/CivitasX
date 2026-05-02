const toneClasses = {
  info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-50',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-50',
  critical: 'border-rose-400/20 bg-rose-400/10 text-rose-50',
};

export default function AlertSystem({ alerts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-40 flex w-[min(100%,360px)] flex-col gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl transition-all duration-300 animate-[alertIn_0.28s_ease-out] ${toneClasses[alert.tone]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.24em] opacity-70">Live Alert</p>
              <p className="mt-1 text-sm font-semibold leading-5">{alert.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="rounded-full bg-black/10 px-2 py-1 text-xs font-semibold opacity-80 transition hover:bg-black/20"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
