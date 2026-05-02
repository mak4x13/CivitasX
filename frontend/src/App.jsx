import { useEffect, useMemo, useRef, useState } from 'react';
import AlertSystem from './components/AlertSystem';
import AgentFlowPanel from './components/AgentFlowPanel';
import AnalysisPanel from './components/AnalysisPanel';
import City3D from './components/City3D';
import ConflictBanner from './components/ConflictBanner';
import ControlPanel from './components/ControlPanel';
import GovernancePanel from './components/GovernancePanel';
import PersonaPanel from './components/PersonaPanel';
import ZonePopup from './components/ZonePopup';
import { loadBootstrap, simulateScenario } from './lib/api';
import {
  buildActionPlan,
  buildAlertItems,
  buildConsequenceFeed,
  buildGovernanceFrame,
  buildPersonaImpacts,
  buildPlaybackStages,
  buildProblemFrame,
  buildVisualMetrics,
  buildZoneStates,
  DEMO_SCENARIO,
  FALLBACK_SCENARIO,
} from './lib/transformers';

function MetricCard({ label, value, accent, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-[0_16px_50px_rgba(2,6,23,0.25)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Header({ metrics, simulation }) {
  const cards = [
    {
      label: 'City Stability',
      value: `${metrics.stabilityScore}/100`,
      accent: 'text-emerald-300',
      hint: 'Higher is better',
    },
    {
      label: 'Mobility',
      value: `${metrics.mobility}/100`,
      accent: 'text-cyan-300',
      hint: 'Higher is better',
    },
    {
      label: 'Economic Impact',
      value: `${metrics.economicImpact}/100`,
      accent: 'text-orange-300',
      hint: 'Higher is worse',
    },
    {
      label: 'Education Continuity',
      value: `${metrics.educationContinuity}/100`,
      accent: 'text-sky-300',
      hint: 'Higher is better',
    },
    {
      label: 'Digital Dependency Risk',
      value: `${metrics.digitalRisk}/100`,
      accent: 'text-violet-300',
      hint: 'Higher is worse',
    },
    {
      label: 'Protest Risk',
      value: `${metrics.protestRisk}/100`,
      accent: 'text-rose-300',
      hint: 'Higher is worse',
    },
  ];

  return (
    <header className="rounded-[30px] border border-white/10 bg-slate-950/70 px-5 py-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">CivitasX</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            CivitasX - Visual Multi-Agent City Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Submit a policy decision to the backend, watch the city react in 3D, and trace the agent-to-agent impact flow.
          </p>
          {simulation ? (
            <p className="mt-3 text-sm text-slate-400">
              {simulation.city_profile.summary}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:min-w-[720px]">
          {cards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </header>
  );
}

function ProblemFrame({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 px-5 py-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-cyan-300/70">Why This Matters</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">One policy choice can break multiple city systems at once</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
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
  const [showCityOverlay, setShowCityOverlay] = useState(true);
  const [requestState, setRequestState] = useState('booting');
  const [lastResponseAt, setLastResponseAt] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [consequences, setConsequences] = useState([
    'The simulator is ready. Apply a decision to start the live city response.',
  ]);
  const [playbackStages, setPlaybackStages] = useState([]);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState(0);
  const [playbackRunning, setPlaybackRunning] = useState(false);
  const alertTimers = useRef(new Map());

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

  async function applyScenario(nextControls, isBootstrap = false) {
    setRequestState('sending');

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
    void applyScenario(controls);
  }

  function handleReset() {
    alertTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    alertTimers.current.clear();

    const defaultScenario = metadata?.default_scenario || FALLBACK_SCENARIO;
    setControls(defaultScenario);
    setActiveZone(null);
    setShowCityOverlay(true);
    setAlerts([]);
    void applyScenario(defaultScenario);
  }

  function handleDemo() {
    setControls(DEMO_SCENARIO);
    void applyScenario(DEMO_SCENARIO);
  }

  const visualMetrics = buildVisualMetrics(simulation);
  const zoneStates = buildZoneStates(simulation);
  const personas = buildPersonaImpacts(simulation, zoneStates);
  const actionPlan = buildActionPlan(simulation);
  const governanceFrame = buildGovernanceFrame(simulation);
  const problemFrame = buildProblemFrame(simulation);
  const selectedZone = zoneStates.find((zone) => zone.id === activeZone) || null;
  const activePlaybackStage = playbackStages[activePlaybackIndex] || null;
  const pulseZoneIds = activePlaybackStage?.zoneIds || [];
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
      ? 'The frontend has submitted the scenario and is waiting for the backend response.'
      : requestState === 'error'
        ? 'Check the FastAPI server and try again.'
        : lastResponseAt
          ? `Last backend response: ${new Date(lastResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Waiting for the first backend response.';

  return (
    <div className="relative min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <AlertSystem alerts={alerts} onDismiss={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))} />

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1850px] flex-col gap-4">
        <Header metrics={visualMetrics} simulation={simulation} />

        <ProblemFrame items={problemFrame} />

        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 px-5 py-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.32em] text-cyan-300/70">Frontend / Backend Boundary</p>
              <p className="mt-1 text-sm text-slate-300">
                The frontend collects the scenario and visualizes agentic effects. The backend computes the city outcome.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:min-w-[420px]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Request State</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    requestState === 'sending'
                      ? 'bg-amber-300'
                      : requestState === 'error'
                        ? 'bg-rose-300'
                        : 'bg-emerald-300'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-100">{requestLabel}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{requestDetail}</p>
            </div>
          </div>
        </section>

        {simulation ? (
          <ConflictBanner conflicts={simulation.conflicts} recommendation={simulation.agents?.advisor?.recommendation} />
        ) : null}

        <main className="grid flex-1 gap-4 xl:grid-cols-[330px_minmax(0,1fr)_390px]">
          <div className="space-y-4 xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto xl:pr-1">
            <ControlPanel
              controls={controls}
              options={metadata?.options}
              citySummary={selectedCity?.summary}
              onChange={updateControl}
              onApply={handleApply}
              onReset={handleReset}
              onDemo={handleDemo}
              requestState={requestState}
              generatedBy={simulation?.generated_by}
            />
          </div>

          <div className="space-y-4">
            <div className="relative min-h-[720px] xl:max-h-[calc(100vh-160px)] xl:overflow-hidden">
              <City3D
                zoneStates={zoneStates}
                metrics={visualMetrics}
                activeZoneId={activeZone}
                pulseZoneIds={pulseZoneIds}
                playbackStage={activePlaybackStage}
                onSelectZone={(zone) => setActiveZone(zone.id)}
                showOverlay={showCityOverlay}
                onCloseOverlay={() => setShowCityOverlay(false)}
              />
              {!showCityOverlay ? (
                <button
                  type="button"
                  onClick={() => setShowCityOverlay(true)}
                  className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 shadow-lg shadow-black/40 backdrop-blur-xl transition hover:bg-white/10"
                >
                  Show City Map
                </button>
              ) : null}
              <ZonePopup zone={selectedZone} onClose={() => setActiveZone(null)} />
            </div>

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

          <div className="space-y-4 xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto xl:pr-1">
            <AnalysisPanel simulation={simulation} actionPlan={actionPlan} />

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Consequence Feed</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">Live impact log</h2>
              </div>
              <div className="space-y-3">
                {consequences.map((entry) => (
                  <div key={entry} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                    {entry}
                  </div>
                ))}
              </div>
            </section>

            <PersonaPanel personas={personas} />
            <GovernancePanel frame={governanceFrame} />
          </div>
        </main>
      </div>
    </div>
  );
}
