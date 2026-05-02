const NODE_LAYOUT = {
  transport: { x: 12, y: 22 },
  economy: { x: 46, y: 18 },
  education: { x: 48, y: 52 },
  internet: { x: 24, y: 60 },
  sentiment: { x: 76, y: 34 },
  protest: { x: 88, y: 58 },
  advisor: { x: 88, y: 12 },
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
    return 'from-rose-500/30 to-rose-950/60 border-rose-300/30';
  }

  if (risk === 'High') {
    return 'from-orange-400/25 to-orange-950/50 border-orange-300/25';
  }

  if (risk === 'Medium-High' || risk === 'Medium') {
    return 'from-amber-400/20 to-slate-950/70 border-amber-300/20';
  }

  return 'from-emerald-400/20 to-slate-950/70 border-emerald-300/20';
}

function isEdgeActive(edge, activeNodeIds) {
  return activeNodeIds.includes(edge.source) || activeNodeIds.includes(edge.target);
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
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <p className="text-sm text-slate-300">Run a scenario to visualize the agent dependency flow.</p>
      </section>
    );
  }

  const activeStage = playbackStages?.[activeStageIndex] || null;
  const activeNodeIds = activeStage?.activeNodeIds || [];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Agentic Flow</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">Cause-and-effect network</h2>
          <p className="mt-2 text-sm text-slate-400">
            Highlighted links show the strongest propagation path through the city model.
          </p>
          {headline ? <p className="mt-2 text-sm text-slate-300">{headline}</p> : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestartPlayback}
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Replay Ripple
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
        <div className="mb-4 rounded-[22px] border border-cyan-400/12 bg-cyan-400/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-cyan-200/80">
                Ripple Playback • Step {activeStageIndex + 1}/{playbackStages.length}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{activeStage.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{activeStage.detail}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {playbackStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => onRestartPlayback(index)}
                className={`rounded-2xl border px-2 py-2 text-left text-xs transition ${
                  index === activeStageIndex
                    ? 'border-cyan-300/30 bg-cyan-400/16 text-cyan-50'
                    : 'border-white/8 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">{stage.title}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative h-[440px] overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#01040c_100%)]">
        <svg viewBox="0 0 100 72" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="flowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          {network.edges.map((edge) => {
            const path = edgePath(edge.source, edge.target);
            const strokeWidth = Math.max(1.2, edge.influence / 18);
            const active = isEdgeActive(edge, activeNodeIds);
            return (
              <g key={`${edge.source}-${edge.target}`}>
                <path
                  d={path}
                  className={active || edge.highlighted ? 'flow-edge-active' : ''}
                  stroke="url(#flowStroke)"
                  strokeOpacity={active ? 0.98 : edge.highlighted ? 0.72 : 0.22}
                  strokeWidth={active ? strokeWidth + 1.2 : strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={active || edge.highlighted ? '4 3' : '0'}
                />
                <text
                  x={(NODE_LAYOUT[edge.source].x + NODE_LAYOUT[edge.target].x) / 2}
                  y={(NODE_LAYOUT[edge.source].y + NODE_LAYOUT[edge.target].y) / 2 - 2}
                  fill={active ? 'rgba(248,250,252,0.95)' : 'rgba(226,232,240,0.55)'}
                  fontSize="2.2"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
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
              className={`absolute w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-gradient-to-br px-3 py-3 shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl transition ${nodeColor(node.risk)} ${
                active ? 'ring-2 ring-cyan-300/45 scale-[1.06]' : 'opacity-80'
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

        <div className="absolute bottom-3 left-3 rounded-2xl border border-white/8 bg-black/35 px-3 py-2 text-xs text-slate-300 backdrop-blur-xl">
          Ripple playback is driven by the backend `agent_network` plus the current scenario response.
        </div>
      </div>
    </section>
  );
}
