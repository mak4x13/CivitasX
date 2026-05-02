const NODE_LAYOUT = {
  transport: { x: 12, y: 22 },
  economy: { x: 44, y: 18 },
  education: { x: 44, y: 54 },
  internet: { x: 24, y: 60 },
  sentiment: { x: 74, y: 34 },
  protest: { x: 86, y: 58 },
  advisor: { x: 86, y: 12 },
};

function edgePath(source, target) {
  const start = NODE_LAYOUT[source];
  const end = NODE_LAYOUT[target];

  if (!start || !end) {
    return '';
  }

  const curvature = Math.abs(end.x - start.x) * 0.35;
  return `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${end.x - curvature} ${end.y}, ${end.x} ${end.y}`;
}

function nodeColor(risk) {
  if (risk === 'Critical') {
    return 'from-rose-500/25 to-rose-950/65 border-rose-300/30';
  }

  if (risk === 'High') {
    return 'from-orange-400/22 to-orange-950/55 border-orange-300/28';
  }

  if (risk === 'Medium-High' || risk === 'Medium') {
    return 'from-amber-400/18 to-slate-950/70 border-amber-300/24';
  }

  return 'from-emerald-400/16 to-slate-950/70 border-emerald-300/24';
}

function isEdgeActive(edge, activeNodeIds) {
  return activeNodeIds.includes(edge.source) || activeNodeIds.includes(edge.target);
}

function LegendPill({ label, tone }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {label}
    </div>
  );
}

export default function AgentFlowPanel({
  network,
  headline,
  playbackStages,
  activeStageIndex,
  playbackRunning,
  onRestartPlayback,
  onTogglePlayback,
}) {
  if (!network) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <p className="text-sm text-slate-300">Run a scenario to visualize the agent dependency flow.</p>
      </section>
    );
  }

  const activeStage = playbackStages?.[activeStageIndex] || null;
  const activeNodeIds = activeStage?.activeNodeIds || [];
  const focusNodes = network.nodes.filter((node) => activeNodeIds.includes(node.id));

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Ripple Flow</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Agent chain reaction</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use this view when you need to explain how one policy choice cascades through the city model.
          </p>
          {headline ? <p className="mt-2 text-sm leading-6 text-slate-400">{headline}</p> : null}
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

      {activeStage ? (
        <div className="mb-4 rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-cyan-200/80">
                Step {activeStageIndex + 1} of {playbackStages.length}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{activeStage.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{activeStage.detail}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {playbackStages.map((stage, index) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onRestartPlayback(index)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    index === activeStageIndex
                      ? 'border-cyan-300/30 bg-cyan-400/16 text-cyan-50'
                      : 'border-white/10 bg-black/20 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {stage.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative h-[460px] overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#020617_0%,#01040c_100%)]">
          <svg viewBox="0 0 100 72" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="flowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.78" />
              </linearGradient>
            </defs>

            {network.edges.map((edge) => {
              const path = edgePath(edge.source, edge.target);
              const strokeWidth = Math.max(1.2, edge.influence / 18);
              const active = isEdgeActive(edge, activeNodeIds);
              const emphasize = active || edge.highlighted;

              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <path
                    d={path}
                    className={emphasize ? 'flow-edge-active' : ''}
                    stroke="url(#flowStroke)"
                    strokeOpacity={active ? 0.96 : edge.highlighted ? 0.62 : 0.18}
                    strokeWidth={active ? strokeWidth + 1.1 : strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={emphasize ? '4 3' : '0'}
                  />
                  {emphasize ? (
                    <text
                      x={(NODE_LAYOUT[edge.source].x + NODE_LAYOUT[edge.target].x) / 2}
                      y={(NODE_LAYOUT[edge.source].y + NODE_LAYOUT[edge.target].y) / 2 - 2}
                      fill="rgba(248,250,252,0.92)"
                      fontSize="2.15"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {network.nodes.map((node) => {
            const position = NODE_LAYOUT[node.id];
            if (!position) {
              return null;
            }

            const active = activeNodeIds.includes(node.id);

            return (
              <div
                key={node.id}
                className={`absolute w-28 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border bg-gradient-to-br px-3 py-3 shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl transition ${nodeColor(node.risk)} ${
                  active ? 'scale-[1.05] ring-2 ring-cyan-300/45' : 'opacity-85'
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-slate-300">{node.kind}</p>
                <p className="mt-1 text-sm font-semibold text-white">{node.label}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <span>Activity</span>
                  <span className="font-semibold text-white">{node.activity}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <span>Risk</span>
                  <span className="font-semibold text-white">{node.risk}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">How to read this</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LegendPill label="Active path" tone="bg-cyan-300" />
              <LegendPill label="High pressure" tone="bg-rose-300" />
              <LegendPill label="Stable node" tone="bg-emerald-300" />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Bright links mark the currently replayed ripple. Use this tab to explain causality, not geography.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">Currently reacting</p>
            <div className="mt-3 space-y-2">
              {(focusNodes.length > 0 ? focusNodes : network.nodes.slice(0, 3)).map((node) => (
                <div key={node.id} className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{node.label}</p>
                    <span className="text-xs text-slate-300">{node.risk}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Activity {node.activity} with {node.risk.toLowerCase()} pressure.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
