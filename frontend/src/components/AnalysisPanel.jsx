import { formatMetricDelta, titleize } from '../lib/transformers';

function Section({ title, children, subtitle }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_16px_50px_rgba(2,6,23,0.3)]">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">{children}</div>
    </section>
  );
}

function AgentCard({ agentKey, agent }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.24em] text-cyan-300/70">{titleize(agentKey)}</p>
          <p className="mt-1 text-sm font-semibold text-white">{agent.risk}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-100">
          {agent.score}/100
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">{agent.key_reason}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{agent.summary}</p>
      <p className="mt-3 rounded-2xl border border-emerald-400/10 bg-emerald-400/8 p-3 text-emerald-50">
        {agent.recommendation}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {agent.drivers.map((driver) => (
          <span key={`${agentKey}-${driver}`} className="rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200">
            {driver}
          </span>
        ))}
      </div>
    </div>
  );
}

function ComparisonPill({ label, value, invert = false }) {
  const numericValue = Number(value || 0);
  const effective = invert ? -numericValue : numericValue;
  const positive = effective > 0;
  const neutral = effective === 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${neutral ? 'text-slate-100' : positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        {formatMetricDelta(numericValue, invert)}
      </p>
    </div>
  );
}

export default function AnalysisPanel({ simulation }) {
  if (!simulation) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Backend Output</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">City Response Summary</h2>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
          Run a scenario to populate the executive summary, agent analysis, and safer alternative panel.
        </div>
      </section>
    );
  }

  const changedAlternativeFields = simulation.alternative_policy
    ? Object.entries(simulation.alternative_policy).filter(([key, value]) => simulation.scenario[key] !== value)
    : [];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Backend Output</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">City Response Summary</h2>
        <p className="mt-2 text-sm text-slate-400">
          This panel is driven by the live FastAPI response, not a local mock simulation.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Executive Summary" subtitle={simulation.city_profile.summary}>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="leading-7 text-slate-100">{simulation.executive_summary}</p>
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              {simulation.generated_by === 'groq' ? 'Groq SDK summary' : 'Rule-based summary'}
            </div>
          </div>
        </Section>

        <Section title="Main Risks">
          <ul className="space-y-2">
            {simulation.main_risks.map((item) => (
              <li key={item} className="flex gap-2 rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Conflict Detection" subtitle="These are the policy clashes the backend surfaced across agents.">
          <ul className="space-y-2">
            {(simulation.conflicts.length > 0 ? simulation.conflicts : ['No major policy conflict detected.']).map((item) => (
              <li key={item} className="rounded-2xl border border-rose-400/12 bg-rose-400/8 p-3 text-rose-50">
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Agent Readouts" subtitle="These cards come directly from the backend agent outputs.">
          <div className="grid gap-3">
            {Object.entries(simulation.agents).map(([agentKey, agent]) => (
              <AgentCard key={agentKey} agentKey={agentKey} agent={agent} />
            ))}
          </div>
        </Section>

        <Section title="Recommended Alternative" subtitle={simulation.comparison?.headline}>
          {changedAlternativeFields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {changedAlternativeFields.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-50"
                >
                  {titleize(key)}: {typeof value === 'boolean' ? (value ? 'On' : 'Off') : titleize(value)}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">No safer alternative was required for this scenario.</div>
          )}

          {simulation.comparison ? (
            <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
              <ComparisonPill label="Stability" value={simulation.comparison.score_deltas.city_stability} />
              <ComparisonPill label="Mobility" value={simulation.comparison.score_deltas.mobility} />
              <ComparisonPill label="Economic Risk" value={simulation.comparison.score_deltas.economic_impact} invert />
              <ComparisonPill label="Education" value={simulation.comparison.score_deltas.education_continuity} />
              <ComparisonPill label="Digital Risk" value={simulation.comparison.score_deltas.internet_dependency_risk} invert />
              <ComparisonPill label="Protest Risk" value={simulation.comparison.score_deltas.protest_probability} invert />
            </div>
          ) : null}
        </Section>
      </div>
    </section>
  );
}
