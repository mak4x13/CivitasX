import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import AlertSystem from './components/AlertSystem';
import AgentFlowPanel from './components/AgentFlowPanel';
import AgentReadoutPanel from './components/AgentReadoutPanel';
import AnalysisPanel from './components/AnalysisPanel';
import ConflictBanner from './components/ConflictBanner';
import ControlPanel from './components/ControlPanel';
import GovernancePanel from './components/GovernancePanel';
import PersonaPanel from './components/PersonaPanel';
import ZonePopup from './components/ZonePopup';
import { loadBootstrap, loadLiveContext, simulateScenario } from './lib/api';
import {
  buildActionPlan,
  buildAlertItems,
  buildConsequenceFeed,
  buildGovernanceFrame,
  buildPersonaImpacts,
  buildPlaybackStages,
  buildVisualMetrics,
  buildZoneStates,
  DEMO_SCENARIO,
  FALLBACK_SCENARIO,
  titleize,
} from './lib/transformers';

const City3D = lazy(() => import('./components/City3D'));

function MetricCard({ label, value, accent, hint }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_44px_rgba(2,6,23,0.22)] backdrop-blur-xl">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  );
}

function ScenarioChip({ label, value }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
      <span className="text-slate-400">{label}: </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function describeRoadClosureState(level) {
  return level === 'none' ? 'None' : titleize(level);
}

function describeConnectivityState(level) {
  if (level === 'off') {
    return 'Open';
  }

  if (level === 'partial') {
    return 'Partial restriction';
  }

  return 'Shutdown';
}

function buildTriggerNarrative(liveContext, selectedCity, simulation) {
  if (liveContext?.mode === 'rss') {
    return liveContext.summary;
  }

  if (liveContext?.trigger_type) {
    const affectedSystems = (liveContext.affected_systems || []).slice(0, 3).join(', ');
    return `${liveContext.trigger_type} is the current starting frame${affectedSystems ? `. Most exposed systems: ${affectedSystems}.` : '.'}`;
  }

  return simulation?.comparison?.headline || simulation?.city_profile?.summary || selectedCity?.summary || 'Test a restriction policy and watch the city systems react.';
}

function Header({
  controls,
  metrics,
  requestLabel,
  requestDetail,
  requestState,
  selectedCity,
  simulation,
  liveContext,
}) {
  const cards = [
    {
      label: 'City Stability',
      value: `${metrics.stabilityScore}/100`,
      accent: 'text-emerald-300',
      hint: 'Overall resilience after the decision',
    },
    {
      label: 'Mobility',
      value: `${metrics.mobility}/100`,
      accent: 'text-cyan-300',
      hint: 'How easily people can still move',
    },
    {
      label: 'Economic Stress',
      value: `${metrics.economicImpact}/100`,
      accent: 'text-orange-300',
      hint: 'Higher means stronger disruption',
    },
    {
      label: 'Protest Risk',
      value: `${metrics.protestRisk}/100`,
      accent: 'text-rose-300',
      hint: 'Public tension under the scenario',
    },
  ];

  const statusTone =
    requestState === 'sending'
      ? 'bg-amber-300'
      : requestState === 'error'
        ? 'bg-rose-300'
        : 'bg-emerald-300';

  const narrative = buildTriggerNarrative(liveContext, selectedCity, simulation);

  return (
    <header className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.92),rgba(2,6,23,0.82))] p-5 shadow-[0_26px_100px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:p-6">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-cyan-100">
            Live Trigger to Decision Lab
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          </div>

          <p className="mt-5 font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">CivitasX</p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-cyan-50 sm:text-3xl xl:max-w-3xl">
            Stress-test public decisions before they hit the city
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            CivitasX turns real-world pressure into policy scenarios, reveals downstream impact across mobility, markets, services, and sentiment, and helps decision-makers choose the safer response before policy goes public.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <ScenarioChip label="City" value={controls.city} />
            <ScenarioChip label="Policy" value={titleize(controls.scenario_type)} />
            <ScenarioChip label="Duration" value={`${controls.duration_days} day${controls.duration_days > 1 ? 's' : ''}`} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">Trigger snapshot</p>
              <p className="mt-2 text-lg font-semibold text-white">What is happening before the decision</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{narrative}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <span className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                  Road closures: <span className="font-semibold text-white">{describeRoadClosureState(controls.road_closure_level)}</span>
                </span>
                <span className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                  Connectivity: <span className="font-semibold text-white">{describeConnectivityState(controls.internet_shutdown)}</span>
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">System status</p>
              <div className="mt-3 flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${statusTone}`} />
                <p className="text-sm font-semibold text-white">{requestLabel}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{requestDetail}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </header>
  );
}

function SegmentedTabs({ items, activeKey, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            activeKey === item.key
              ? 'bg-white text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.12)]'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, subtitle, summary, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5"
      >
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">{title}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{subtitle}</h2>
          {summary ? <p className="mt-2 text-sm leading-6 text-slate-400">{summary}</p> : null}
        </div>
        <span className={`text-2xl leading-none transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open ? <div className="border-t border-white/10 p-4">{children}</div> : null}
    </section>
  );
}

function FloatingMetrics({ metrics, trends }) {
  const rows = [
    {
      label: 'City Stability',
      value: `${metrics.stabilityScore}/100`,
      delta: trends?.city_stability,
    },
    {
      label: 'Mobility',
      value: `${metrics.mobility}/100`,
      delta: trends?.mobility,
    },
    {
      label: 'Economic Stress',
      value: `${metrics.economicImpact}/100`,
      delta: trends?.economic_impact,
      invert: true,
    },
    {
      label: 'Protest Risk',
      value: `${metrics.protestRisk}/100`,
      delta: trends?.protest_probability,
      invert: true,
    },
  ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Live metrics</p>
        <p className="mt-2 text-sm text-slate-400">Key city indicators that update with the simulation.</p>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => {
          const numeric = Number(row.delta || 0);
          const positive = numeric > 0;
          const negative = numeric < 0;
          const arrow = numeric === 0 ? '=' : positive ? '+' : '-';
          const tone = row.invert ? (positive ? 'text-rose-300' : negative ? 'text-emerald-300' : 'text-slate-300') : positive ? 'text-emerald-300' : negative ? 'text-amber-300' : 'text-slate-300';

          return (
            <div key={row.label} className="rounded-[22px] border border-white/10 bg-slate-950/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-slate-400">{row.label}</p>
                <span className={`text-sm font-semibold ${tone}`}>{arrow} {row.delta !== undefined ? Math.abs(numeric) : '--'}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{row.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StickyMetricRail({ metrics, trends, requestState, lastResponseAt }) {
  const rows = [
    {
      label: 'City Stability',
      value: `${metrics.stabilityScore}/100`,
      delta: trends?.city_stability,
    },
    {
      label: 'Mobility',
      value: `${metrics.mobility}/100`,
      delta: trends?.mobility,
    },
    {
      label: 'Economic Stress',
      value: `${metrics.economicImpact}/100`,
      delta: trends?.economic_impact,
      invert: true,
    },
    {
      label: 'Protest Risk',
      value: `${metrics.protestRisk}/100`,
      delta: trends?.protest_probability,
      invert: true,
    },
  ];
  const statusTone =
    requestState === 'sending'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-50'
      : requestState === 'error'
        ? 'border-rose-400/20 bg-rose-400/10 text-rose-50'
        : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50';
  const statusLabel =
    requestState === 'sending'
      ? 'Updating simulation'
      : requestState === 'error'
        ? 'Backend unavailable'
        : lastResponseAt
          ? `Updated ${new Date(lastResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Awaiting first run';

  return (
    <section className="sticky top-4 z-30 rounded-[24px] border border-white/10 bg-slate-950/88 p-3 shadow-[0_20px_80px_rgba(2,6,23,0.4)] backdrop-blur-2xl">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Live scoreline</p>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone}`}>
          <span className="h-2 w-2 rounded-full bg-current opacity-80" />
          {statusLabel}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        {rows.map((row) => {
          const numeric = Number(row.delta || 0);
          const positive = numeric > 0;
          const negative = numeric < 0;
          const arrow = numeric === 0 ? '=' : positive ? '+' : '-';
          const tone = row.invert ? (positive ? 'text-rose-300' : negative ? 'text-emerald-300' : 'text-slate-300') : positive ? 'text-emerald-300' : negative ? 'text-amber-300' : 'text-slate-300';

          return (
            <div key={row.label} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.58rem] uppercase tracking-[0.24em] text-slate-400">{row.label}</p>
                <span className={`text-xs font-semibold ${tone}`}>{arrow} {row.delta !== undefined ? Math.abs(numeric) : '--'}</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-white">{row.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getUrgencyProfile(metrics) {
  const urgencyValue = Math.max(100 - metrics.stabilityScore, 100 - metrics.mobility, metrics.economicImpact, metrics.protestRisk);

  if (urgencyValue >= 75) {
    return {
      label: 'Critical response',
      tone: 'border-rose-400/20 bg-rose-500/10 text-rose-50',
      note: 'The city model expects cascading disruption unless the rollout is softened quickly.',
    };
  }

  if (urgencyValue >= 60) {
    return {
      label: 'High alert',
      tone: 'border-orange-400/20 bg-orange-500/10 text-orange-50',
      note: 'Pressure is concentrated enough that one weak system can trigger secondary effects.',
    };
  }

  if (urgencyValue >= 40) {
    return {
      label: 'Active watch',
      tone: 'border-amber-400/20 bg-amber-500/10 text-amber-50',
      note: 'The scenario is manageable, but a few indicators need active monitoring.',
    };
  }

  return {
    label: 'Controlled',
    tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50',
    note: 'The current scenario is relatively stable and suited to explanation rather than crisis response.',
  };
}

function getPrimaryPressure(metrics) {
  const candidates = [
    { label: 'Mobility shock', value: 100 - metrics.mobility, detail: 'Movement friction is the first downstream trigger.' },
    { label: 'Economic strain', value: metrics.economicImpact, detail: 'Income loss and market access are taking the main hit.' },
    { label: 'Public tension', value: metrics.protestRisk, detail: 'Sentiment and protest risk are shaping the urgency level.' },
    { label: 'Digital fragility', value: metrics.digitalRisk, detail: 'Connectivity loss is removing the city fallback path.' },
  ];

  return candidates.sort((a, b) => b.value - a.value)[0];
}

function LiveContextPanel({ liveContext, metrics, simulation, consequences, requestState }) {
  const urgency = getUrgencyProfile(metrics);
  const modeLabel = liveContext?.mode === 'rss' ? 'Live feed connected' : 'Using city profile';
  const primaryPressure = getPrimaryPressure(metrics);
  const triggerSummary =
    liveContext?.mode === 'rss'
      ? liveContext?.summary
      : liveContext?.trigger_type
        ? `${liveContext.trigger_type} is the current baseline trigger for this city. Use a live feed or refresh later if you want external headlines to replace the profile-based frame.`
        : 'Backend context will appear here once the feed responds.';

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Current Trigger</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">What is happening, what is under consideration, and what the model sees</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            The trigger explains why a decision is being considered. The structured controls above define the candidate response, and the simulation below shows its likely ripple before the decision is finalized.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50">
            <span className="h-2 w-2 rounded-full bg-cyan-300 opacity-80" />
            {modeLabel}
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${urgency.tone}`}>
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {requestState === 'sending' ? 'Recomputing' : urgency.label}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-slate-400">Trigger summary</p>
            {liveContext?.updated_at ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-slate-300">
                Updated {new Date(liveContext.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-base leading-7 text-slate-100">{triggerSummary}</p>
          <p className="mt-3 text-sm leading-6 text-cyan-100">{liveContext?.signal || 'No backend signal yet.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50">
              {liveContext?.trigger_type || 'Pending trigger'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
              Severity: {titleize(liveContext?.severity || 'unknown')}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
              Confidence: {titleize(liveContext?.confidence || 'unknown')}
            </span>
          </div>
        </div>

        <div className="rounded-[22px] border border-cyan-400/14 bg-cyan-400/8 p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-cyan-200/80">Predicted ripple check</p>
          <p className="mt-3 text-sm leading-7 text-slate-100">
            {consequences?.[0] || simulation?.main_risks?.[0] || 'Run the scenario to compare the live context against the model output.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_0.9fr_0.9fr]">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-slate-400">Supporting signals</p>
          <div className="mt-3 space-y-2">
            {(liveContext?.items || []).slice(0, 3).map((item) => (
              <div key={`${item.source}-${item.title}`} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{item.source}</span>
                  {item.published_at ? <span>{new Date(item.published_at).toLocaleString()}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-slate-400">Primary pressure</p>
          <p className="mt-2 text-lg font-semibold text-white">{primaryPressure.label}</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{primaryPressure.value}/100</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{primaryPressure.detail}</p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-slate-400">Affected systems</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {(liveContext?.affected_systems || []).join(', ') || 'No backend query yet.'}
          </p>
        </div>
      </div>
    </section>
  );
}

function SimulationRunningOverlay({ controls }) {
  const stages = [
    'Locking the scenario inputs',
    'Recomputing transport, economy, and access pressure',
    'Refreshing sentiment, advice, and headline scores',
  ];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/72 backdrop-blur-md">
      <div className="w-full max-w-[560px] rounded-[28px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(8,15,28,0.96),rgba(2,6,23,0.92))] p-6 text-center shadow-[0_26px_100px_rgba(2,6,23,0.55)]">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Simulation running</p>
        <div className="mt-6 flex items-center justify-center">
          <div className="relative h-28 w-28">
            <span className="sim-ring absolute inset-0 rounded-full border border-cyan-300/35" />
            <span className="sim-ring sim-ring-delay absolute inset-3 rounded-full border border-sky-300/30" />
            <span className="absolute inset-[34px] rounded-full bg-cyan-300 shadow-[0_0_34px_rgba(34,211,238,0.45)]" />
          </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-white">
          Recomputing {titleize(controls.scenario_type)} for {controls.city}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          The model is updating transport, services, public sentiment, and the final advisory posture.
        </p>

        <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
              {stage}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelinePanel({ stages, activeIndex, onSelect }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Impact timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Cause to effect progression</h2>
        </div>
        <p className="text-sm text-slate-400">Tap a point to jump ahead.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`min-w-[180px] rounded-[22px] border px-4 py-4 text-left transition ${
              activeIndex === index ? 'border-cyan-400 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/20 hover:bg-white/10'
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stage.timestamp || `T+${index * 2}h`}</p>
            <p className="mt-2 font-semibold">{stage.title}</p>
            <p className="mt-1 text-sm text-slate-400">{stage.detail}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function PlaybackStrip({ playbackStages, activeStageIndex, playbackRunning, onRestartPlayback, onTogglePlayback }) {
  if (!playbackStages?.length) {
    return null;
  }

  const activeStage = playbackStages[activeStageIndex] || playbackStages[0];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Ripple Playback</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">{activeStage.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{activeStage.detail}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onRestartPlayback(0)}
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Replay
          </button>
          <button
            type="button"
            onClick={onTogglePlayback}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/10"
          >
            {playbackRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {playbackStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => onRestartPlayback(index)}
            className={`rounded-[22px] border p-3 text-left transition ${
              index === activeStageIndex
                ? 'border-cyan-300/30 bg-cyan-400/12 text-cyan-50'
                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
            }`}
          >
            <p className="text-[0.64rem] uppercase tracking-[0.2em] opacity-75">Step {index + 1}</p>
            <p className="mt-2 text-sm font-semibold">{stage.title}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function LiveFeedPanel({ consequences }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Key signals</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">What is moving first</h2>
      </div>

      <div className="space-y-3">
        {consequences.slice(0, 4).map((entry) => (
          <div key={entry} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
            {entry}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [cities, setCities] = useState([]);
  const [controls, setControls] = useState(FALLBACK_SCENARIO);
  const [simulation, setSimulation] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [requestState, setRequestState] = useState('booting');
  const [lastResponseAt, setLastResponseAt] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [consequences, setConsequences] = useState([
    'The simulator is ready. Apply a decision to start the live city response.',
  ]);
  const [playbackStages, setPlaybackStages] = useState([]);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState(0);
  const [playbackRunning, setPlaybackRunning] = useState(false);
  const [liveContext, setLiveContext] = useState(null);
  const [liveContextState, setLiveContextState] = useState('idle');
  const [insightTab, setInsightTab] = useState('brief');
  const alertTimers = useRef(new Map());
  const workspaceRef = useRef(null);

  useEffect(() => {
    return () => {
      alertTimers.current.forEach((timerId) => window.clearTimeout(timerId));
      alertTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!playbackRunning || playbackStages.length <= 1) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setActivePlaybackIndex((current) => {
        if (current >= playbackStages.length - 1) {
          return 0;
        }

        return current + 1;
      });
    }, 2200);

    return () => window.clearInterval(timerId);
  }, [playbackRunning, playbackStages]);

  useEffect(() => {
    if (!controls.city) {
      return undefined;
    }

    let cancelled = false;

    async function refresh() {
      setLiveContextState('loading');

      try {
        const result = await loadLiveContext(controls.city);
        if (cancelled) {
          return;
        }

        setLiveContext(result);
        setLiveContextState('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLiveContext(null);
        setLiveContextState('error');
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [controls.city]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const payload = await loadBootstrap();
        if (cancelled) {
          return;
        }

        setMetadata(payload.metadata);
        setCities(payload.cities.cities || []);
        const defaultScenario = payload.metadata?.default_scenario || FALLBACK_SCENARIO;
        setControls(defaultScenario);
        setRequestState('ready');
        await applyScenario(defaultScenario, true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRequestState('error');
        setAlerts([
          {
            id: `boot-${Date.now()}`,
            message: 'Failed to load backend metadata. Start the API and try again.',
            tone: 'critical',
          },
        ]);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateControl(key, value) {
    setControls((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function pushAlerts(nextAlerts) {
    nextAlerts.forEach((alert, index) => {
      const id = `${Date.now()}-${index}-${alert.message}`;
      setAlerts((current) => [
        {
          id,
          message: alert.message,
          tone: alert.tone,
        },
        ...current,
      ].slice(0, 6));

      const timerId = window.setTimeout(() => {
        setAlerts((current) => current.filter((entry) => entry.id !== id));
        alertTimers.current.delete(id);
      }, 4500 + index * 250);

      alertTimers.current.set(id, timerId);
    });
  }

  function focusWorkspace() {
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  }

  async function refreshLiveContextForCity(nextCity = controls.city) {
    setLiveContextState('loading');

    try {
      const result = await loadLiveContext(nextCity);
      setLiveContext(result);
      setLiveContextState('ready');
    } catch (error) {
      setLiveContext(null);
      setLiveContextState('error');
      pushAlerts([
        {
          message: error.message || 'Context feed request failed.',
          tone: 'warning',
        },
      ]);
    }
  }

  function applyTriggerSuggestion() {
    if (!liveContext?.suggested_scenario) {
      return;
    }

    setControls((current) => ({
      ...current,
      ...liveContext.suggested_scenario,
    }));

    pushAlerts([
      {
        message: 'Trigger framing applied to the candidate decision controls.',
        tone: 'info',
      },
    ]);
  }

  async function applyScenario(nextControls, isBootstrap = false) {
    setRequestState('sending');
    setActiveZone(null);

    try {
      const result = await simulateScenario(nextControls, { useLLM: true });
      const nextZoneStates = buildZoneStates(result);
      setSimulation(result);
      setConsequences(buildConsequenceFeed(result));
      setPlaybackStages(buildPlaybackStages(result, nextZoneStates));
      setActivePlaybackIndex(0);
      setPlaybackRunning(true);
      setLastResponseAt(Date.now());
      setRequestState('ready');
      setActiveZone(null);
      setInsightTab('brief');
      if (!isBootstrap) {
        pushAlerts(buildAlertItems(result));
      }
    } catch (error) {
      setRequestState('error');
      pushAlerts([
        {
          message: error.message || 'Backend request failed.',
          tone: 'critical',
        },
      ]);
    }
  }

  function handleApply() {
    focusWorkspace();
    void applyScenario(controls);
  }

  function handleReset() {
    alertTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    alertTimers.current.clear();

    const defaultScenario = metadata?.default_scenario || FALLBACK_SCENARIO;
    setControls(defaultScenario);
    setActiveZone(null);
    setAlerts([]);
    setInsightTab('brief');
    focusWorkspace();
    void refreshLiveContextForCity(defaultScenario.city);
    void applyScenario(defaultScenario);
  }

  function handleDemo() {
    setControls(DEMO_SCENARIO);
    setInsightTab('brief');
    focusWorkspace();
    void refreshLiveContextForCity(DEMO_SCENARIO.city);
    void applyScenario(DEMO_SCENARIO);
  }

  const visualMetrics = useMemo(() => buildVisualMetrics(simulation), [simulation]);
  const zoneStates = useMemo(() => buildZoneStates(simulation), [simulation]);
  const personas = useMemo(() => buildPersonaImpacts(simulation, zoneStates), [simulation, zoneStates]);
  const actionPlan = useMemo(() => buildActionPlan(simulation), [simulation]);
  const governanceFrame = useMemo(() => buildGovernanceFrame(simulation), [simulation]);
  const selectedZone = useMemo(() => zoneStates.find((zone) => zone.id === activeZone) || null, [zoneStates, activeZone]);
  const activePlaybackStage = useMemo(() => playbackStages[activePlaybackIndex] || null, [playbackStages, activePlaybackIndex]);
  const pulseZoneIds = useMemo(() => activePlaybackStage?.zoneIds || [], [activePlaybackStage]);
  const selectedCity = useMemo(
    () => cities.find((entry) => entry.name === controls.city),
    [cities, controls.city],
  );

  const requestLabel =
    requestState === 'sending'
      ? 'Running backend simulation'
      : requestState === 'error'
        ? 'Backend unavailable'
        : requestState === 'booting'
          ? 'Loading metadata'
          : 'Backend connected';

  const requestDetail =
    requestState === 'sending'
      ? 'The scenario has been submitted. CivitasX is waiting for the city response.'
      : requestState === 'error'
        ? 'Check the FastAPI server and try again.'
        : lastResponseAt
          ? `Last backend response at ${new Date(lastResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : 'Waiting for the first backend response.';

  return (
    <div className="relative min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <AlertSystem alerts={alerts} onDismiss={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))} />

      <div className="mx-auto w-full max-w-[1680px] space-y-5">
        <Header
          controls={controls}
          metrics={visualMetrics}
          requestLabel={requestLabel}
          requestDetail={requestDetail}
          requestState={requestState}
          selectedCity={selectedCity}
          simulation={simulation}
          liveContext={liveContext}
        />

        <ControlPanel
          controls={controls}
          options={metadata?.options}
          citySummary={selectedCity?.summary}
          onChange={updateControl}
          liveContext={liveContext}
          liveContextState={liveContextState}
          onRefreshLiveContext={() => void refreshLiveContextForCity()}
          onApplyTriggerSuggestion={applyTriggerSuggestion}
          onApply={handleApply}
          onReset={handleReset}
          onDemo={handleDemo}
          requestState={requestState}
        />

        <div className="space-y-5">
          <div ref={workspaceRef}>
            <CollapsibleSection
            title="Simulation workspace"
            subtitle="Live ripple flow and city response"
            summary={requestState === 'sending' ? 'Simulation is running.' : 'Run a scenario to inspect the ripple and city response.'}
            defaultOpen
          >
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Simulation workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Live ripple and city response</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                {requestState === 'sending' ? 'Simulation running' : 'Ready'}
              </div>
            </div>

            <StickyMetricRail
              metrics={visualMetrics}
              trends={simulation?.comparison?.score_deltas}
              requestState={requestState}
              lastResponseAt={lastResponseAt}
            />

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl xl:h-[680px]">
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">3D city</p>
                </div>

                <div className="relative min-h-[380px] flex-1 rounded-[26px] border border-white/10 bg-slate-950/70 shadow-[0_20px_80px_rgba(2,6,23,0.45)] xl:min-h-0 xl:overflow-hidden">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%),linear-gradient(180deg,#020617_0%,#01040c_100%)]">
                        <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 px-5 py-4 text-sm text-cyan-50">
                          Loading 3D city view...
                        </div>
                      </div>
                    }
                  >
                    <City3D
                      zoneStates={zoneStates}
                      metrics={visualMetrics}
                      activeZoneId={activeZone}
                      pulseZoneIds={pulseZoneIds}
                      onSelectZone={(zone) => setActiveZone(zone.id)}
                    />
                  </Suspense>
                  {requestState === 'sending' ? <SimulationRunningOverlay controls={controls} /> : null}
                  <ZonePopup zone={selectedZone} onClose={() => setActiveZone(null)} />
                </div>
              </section>

              <AgentFlowPanel
                network={simulation?.agent_network}
                headline={simulation?.comparison?.headline}
                playbackStages={playbackStages}
                activeStageIndex={activePlaybackIndex}
                playbackRunning={playbackRunning}
                onTogglePlayback={() => setPlaybackRunning((current) => !current)}
                onRestartPlayback={(index = 0) => {
                  setActivePlaybackIndex(index);
                  setPlaybackRunning(true);
                }}
              />
            </div>
            </CollapsibleSection>
          </div>

          <LiveContextPanel
            liveContext={liveContext}
            metrics={visualMetrics}
            simulation={simulation}
            consequences={consequences}
            requestState={requestState}
          />

          {simulation ? <ConflictBanner conflicts={simulation.conflicts} /> : null}

          <CollapsibleSection
            title="Decision briefing"
            subtitle="Summary, systems, and stakeholders"
            summary="Expand to see the briefing and detailed insights."
            defaultOpen={false}
          >
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Decision Briefing</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-white">Explain the result clearly</h2>
                </div>

                <SegmentedTabs
                  items={[
                    { key: 'brief', label: 'Summary' },
                    { key: 'agents', label: 'Systems' },
                    { key: 'people', label: 'Stakeholders' },
                  ]}
                  activeKey={insightTab}
                  onChange={setInsightTab}
                />
              </div>
            </div>

            {insightTab === 'brief' ? (
              <>
                <AnalysisPanel simulation={simulation} actionPlan={actionPlan} />
                <LiveFeedPanel consequences={consequences} />
              </>
            ) : null}

            {insightTab === 'agents' ? <AgentReadoutPanel agents={simulation?.agents} /> : null}

            {insightTab === 'people' ? (
              <>
                <PersonaPanel personas={personas} />
                <GovernancePanel frame={governanceFrame} />
              </>
            ) : null}
          </CollapsibleSection>

          <TimelinePanel
            stages={playbackStages.length ? playbackStages : [{ id: 'idle', title: 'Awaiting simulation', detail: 'Run a scenario to populate the timeline.' }]}
            activeIndex={activePlaybackIndex}
            onSelect={(index) => {
              setActivePlaybackIndex(index);
              setPlaybackRunning(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
