import { titleize } from '../lib/transformers';

function riskTone(risk) {
  if (risk === 'Critical') {
    return 'border-rose-400/18 bg-rose-500/8 text-rose-50';
  }

  if (risk === 'High') {
    return 'border-orange-400/18 bg-orange-500/8 text-orange-50';
  }

  if (risk === 'Medium' || risk === 'Medium-High') {
    return 'border-amber-400/18 bg-amber-500/8 text-amber-50';
  }

  return 'border-emerald-400/18 bg-emerald-500/8 text-emerald-50';
}

export default function AgentReadoutPanel({ agents }) {
  if (!agents) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Run a scenario to inspect the full agent readouts.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">System briefing</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">What each city system is doing</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Focus on the most urgent system risks and the recommended response.
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(agents).map(([agentKey, agent]) => (
          <article key={agentKey} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-cyan-300/75">{titleize(agentKey)}</p>
                <p className="mt-2 text-lg font-semibold text-white">{agent.key_reason}</p>
              </div>
              <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${riskTone(agent.risk)}`}>
                {agent.risk} - {agent.score}/100
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">{agent.summary}</p>

            <div className="mt-4 rounded-[22px] border border-emerald-400/14 bg-emerald-500/8 p-3">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-emerald-100/75">Recommended action</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50">{agent.recommendation}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {agent.drivers.map((driver) => (
                <span key={`${agentKey}-${driver}`} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-200">
                  {driver}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
