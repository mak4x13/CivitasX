import { formatMetricDelta, titleize } from '../lib/transformers';

function PanelBlock({ title, subtitle, children }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ComparisonPill({ label, value, invert = false }) {
  const numericValue = Number(value || 0);
  const effective = invert ? -numericValue : numericValue;
  const positive = effective > 0;
  const neutral = effective === 0;

  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-3 text-center">
      <p className="text-[0.64rem] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${neutral ? 'text-slate-100' : positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        {formatMetricDelta(numericValue, invert)}
      </p>
    </div>
  );
}

function AgentPulse({ agents }) {
  if (!agents) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(agents).map(([agentKey, agent]) => (
        <div key={agentKey} className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.64rem] uppercase tracking-[0.18em] text-slate-400">{titleize(agentKey)}</p>
            <span className="text-sm font-semibold text-white">{agent.score}/100</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{agent.risk}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{agent.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default function AnalysisPanel({ simulation, actionPlan }) {
  if (!simulation) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Run a scenario to populate the decision brief.
        </div>
      </section>
    );
  }

  const changedAlternativeFields = simulation.alternative_policy
    ? Object.entries(simulation.alternative_policy).filter(([key, value]) => simulation.scenario[key] !== value)
    : [];

  const priorityRisks = [...simulation.main_risks, ...simulation.conflicts].slice(0, 4);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Judges' summary</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">What this policy does next</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Focus on the headline outcome, top risks, and the best next step.</p>
      </div>

      <div className="space-y-4">
        <PanelBlock title="Executive summary" subtitle={simulation.city_profile.summary}>
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-sm leading-7 text-slate-100">{simulation.executive_summary}</p>
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
              {simulation.generated_by === 'groq' ? 'Groq SDK summary' : 'Rule-based summary'}
            </div>
          </div>
        </PanelBlock>

        <div className="grid gap-4">
          <PanelBlock title="Top risks">
            <div className="space-y-2">
              {priorityRisks.slice(0, 3).map((item) => (
                <div key={item} className="flex gap-3 rounded-[20px] border border-white/10 bg-black/20 p-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-amber-300" />
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </PanelBlock>

          <PanelBlock title="Recommended actions">
            <div className="space-y-2">
              {actionPlan.slice(0, 3).map((step) => (
                <div key={step.label} className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                  <p className="text-[0.64rem] uppercase tracking-[0.18em] text-cyan-300/75">{step.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                </div>
              ))}
            </div>
          </PanelBlock>
        </div>

        <PanelBlock title="Safer alternative" subtitle={simulation.comparison?.headline}>
          {changedAlternativeFields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {changedAlternativeFields.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-50"
                >
                  {titleize(key)}: {typeof value === 'boolean' ? (value ? 'On' : 'Off') : titleize(value)}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
              No safer alternative was required for this scenario.
            </div>
          )}

          {simulation.comparison ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ComparisonPill label="Stability" value={simulation.comparison.score_deltas.city_stability} />
              <ComparisonPill label="Mobility" value={simulation.comparison.score_deltas.mobility} />
              <ComparisonPill label="Economic Risk" value={simulation.comparison.score_deltas.economic_impact} invert />
              <ComparisonPill label="Education" value={simulation.comparison.score_deltas.education_continuity} />
              <ComparisonPill label="Digital Risk" value={simulation.comparison.score_deltas.internet_dependency_risk} invert />
              <ComparisonPill label="Protest Risk" value={simulation.comparison.score_deltas.protest_probability} invert />
            </div>
          ) : null}
        </PanelBlock>
      </div>
    </section>
  );
}
