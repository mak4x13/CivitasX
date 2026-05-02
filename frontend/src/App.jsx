import { useEffect, useMemo, useRef, useState } from 'react';
import AlertSystem from './components/AlertSystem';
import AgentFlowPanel from './components/AgentFlowPanel';
import AgentReadoutPanel from './components/AgentReadoutPanel';
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
  buildVisualMetrics,
  buildZoneStates,
  DEMO_SCENARIO,
  FALLBACK_SCENARIO,
  titleize,
} from './lib/transformers';

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

function Header({
  controls,
  metrics,
  requestLabel,
  requestDetail,
  requestState,
  selectedCity,
  simulation,
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

  const narrative =
    simulation?.comparison?.headline ||
    simulation?.city_profile?.summary ||
    selectedCity?.summary ||
    'Test a restriction policy and watch the city systems react.';

  return (
    <header className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.92),rgba(2,6,23,0.82))] p-5 shadow-[0_26px_100px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:p-6">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-cyan-100">
            CivitasX
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Policy Impact Theater
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:max-w-3xl">
            Simulate a civic restriction before it hits the city.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            CivitasX turns a proposed policy into a live, multi-agent city response so teams can see disruption,
            conflict, and safer alternatives before rollout.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <ScenarioChip label="City" value={controls.city} />
            <ScenarioChip label="Scenario" value={titleize(controls.scenario_type)} />
            <ScenarioChip label="Roads" value={titleize(controls.road_closure_level)} />
            <ScenarioChip label="Internet" value={titleize(controls.internet_shutdown)} />
            <ScenarioChip label="Duration" value={`${controls.duration_days} day${controls.duration_days > 1 ? 's' : ''}`} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">Current Read</p>
              <p className="mt-2 text-lg font-semibold text-white">What this simulation is signaling right now</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{narrative}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Digital fallback risk: <span className="font-semibold text-white">{metrics.digitalRisk}/100</span>
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Education continuity: <span className="font-semibold text-white">{metrics.educationContinuity}/100</span>
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">System Status</p>
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

function WorkflowStrip() {
  const items = [
    {
      step: '1',
      title: 'Set the decision',
      detail: 'Pick the city, restriction type, and mitigation levers you want to test.',
    },
    {
      step: '2',
      title: 'Watch the ripple',
      detail: 'The backend simulates transport, economy, education, internet, and sentiment reactions.',
    },
    {
      step: '3',
      title: 'Inspect the response',
      detail: 'Use the city view, ripple playback, and decision brief to explain the impact quickly.',
    },
  ];

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.step}
          className="rounded-[26px] border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_55px_rgba(2,6,23,0.28)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
              {item.step}
            </span>
            <p className="font-display text-lg font-semibold text-white">{item.title}</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</p>
        </div>
      ))}
    </section>
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
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Live Feed</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">What is changing first</h2>
      </div>

      <div className="space-y-3">
        {consequences.map((entry) => (
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
  const [workspaceTab, setWorkspaceTab] = useState('city');
  const [insightTab, setInsightTab] = useState('brief');
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
      setActiveZone(null);
      setWorkspaceTab('city');
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
    void applyScenario(controls);
  }

  function handleReset() {
    alertTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    alertTimers.current.clear();

    const defaultScenario = metadata?.default_scenario || FALLBACK_SCENARIO;
    setControls(defaultScenario);
    setActiveZone(null);
    setAlerts([]);
    setWorkspaceTab('city');
    setInsightTab('brief');
    void applyScenario(defaultScenario);
  }

  function handleDemo() {
    setControls(DEMO_SCENARIO);
    setWorkspaceTab('city');
    setInsightTab('brief');
    void applyScenario(DEMO_SCENARIO);
  }

  const visualMetrics = buildVisualMetrics(simulation);
  const zoneStates = buildZoneStates(simulation);
  const personas = buildPersonaImpacts(simulation, zoneStates);
  const actionPlan = buildActionPlan(simulation);
  const governanceFrame = buildGovernanceFrame(simulation);
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
      ? 'The scenario has been submitted. CivitasX is waiting for the city response.'
      : requestState === 'error'
        ? 'Check the FastAPI server and try again.'
        : lastResponseAt
          ? `Last backend response at ${new Date(lastResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : 'Waiting for the first backend response.';

  return (
    <div className="relative min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <AlertSystem alerts={alerts} onDismiss={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))} />

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1680px] flex-col gap-5">
        <Header
          controls={controls}
          metrics={visualMetrics}
          requestLabel={requestLabel}
          requestDetail={requestDetail}
          requestState={requestState}
          selectedCity={selectedCity}
          simulation={simulation}
        />

        {simulation ? (
          <ConflictBanner conflicts={simulation.conflicts} recommendation={simulation.agents?.advisor?.recommendation} />
        ) : null}

        <WorkflowStrip />

        <main className="grid flex-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          <div className="space-y-4 xl:max-h-[calc(100vh-170px)] xl:overflow-y-auto xl:pr-1">
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
            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Simulation Workspace</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-white">Watch the city or inspect the ripple</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Use the 3D city for spatial impact, the district map for zone stress, and the ripple view for the
                    agent chain reaction.
                  </p>
                </div>

                <SegmentedTabs
                  items={[
                    { key: 'city', label: '3D City' },
                    { key: 'map', label: 'District Map' },
                    { key: 'ripple', label: 'Ripple Flow' },
                  ]}
                  activeKey={workspaceTab}
                  onChange={setWorkspaceTab}
                />
              </div>
            </section>

            {workspaceTab === 'ripple' ? (
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
            ) : (
              <>
                <div className="relative h-[620px] min-h-[620px] lg:h-[720px] lg:min-h-[720px] xl:h-[calc(100vh-270px)] xl:min-h-[680px] xl:overflow-hidden">
                  <City3D
                    zoneStates={zoneStates}
                    metrics={visualMetrics}
                    activeZoneId={activeZone}
                    pulseZoneIds={pulseZoneIds}
                    playbackStage={activePlaybackStage}
                    onSelectZone={(zone) => setActiveZone(zone.id)}
                    showOverlay={workspaceTab === 'map'}
                    overlayClosable={workspaceTab === 'map'}
                    onCloseOverlay={() => setWorkspaceTab('city')}
                  />
                  <ZonePopup zone={selectedZone} onClose={() => setActiveZone(null)} />
                </div>

                <PlaybackStrip
                  playbackStages={playbackStages}
                  activeStageIndex={activePlaybackIndex}
                  playbackRunning={playbackRunning}
                  onRestartPlayback={(index = 0) => {
                    setActivePlaybackIndex(index);
                    setPlaybackRunning(true);
                  }}
                  onTogglePlayback={() => setPlaybackRunning((current) => !current)}
                />
              </>
            )}
          </div>

          <div className="space-y-4 xl:max-h-[calc(100vh-170px)] xl:overflow-y-auto xl:pr-1">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Decision Briefing</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-white">Read the outcome without hunting for it</h2>
                </div>

                <SegmentedTabs
                  items={[
                    { key: 'brief', label: 'Brief' },
                    { key: 'agents', label: 'Agents' },
                    { key: 'people', label: 'People' },
                  ]}
                  activeKey={insightTab}
                  onChange={setInsightTab}
                />
              </div>
            </section>

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
          </div>
        </main>
      </div>
    </div>
  );
}
