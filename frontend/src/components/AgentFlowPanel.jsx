import { useState } from 'react';

const FLOW_VIEWBOX = {
  width: 100,
  height: 78,
};

const NODE_LAYOUT = {
  transport: { x: 17, y: 25 },
  economy: { x: 45, y: 18 },
  education: { x: 45, y: 60 },
  internet: { x: 24, y: 63 },
  sentiment: { x: 75, y: 32 },
  protest: { x: 87, y: 56 },
  advisor: { x: 87, y: 14 },
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

const STAGE_SHORT_LABELS = {
  input: 'Input',
  transport: 'Transport',
  services: 'Services',
  sentiment: 'Sentiment',
  advisor: 'Advisor',
};

function compactNodeLabel(label) {
  if (label === 'Policy Advisor') {
    return 'Advisor';
  }

  return label.replace(/\s+Agent$/, '');
}

function riskDotTone(risk) {
  if (risk === 'Critical') {
    return 'bg-rose-300';
  }

  if (risk === 'High') {
    return 'bg-orange-300';
  }

  if (risk === 'Medium-High' || risk === 'Medium') {
    return 'bg-amber-300';
  }

  return 'bg-emerald-300';
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

  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const activeStage = playbackStages?.[activeStageIndex] || null;
  const activeNodeIds = activeStage?.activeNodeIds || [];
  const focusNodes = network.nodes.filter((node) => activeNodeIds.includes(node.id));
  const hoveredNode = hoveredNodeId ? network.nodes.find((node) => node.id === hoveredNodeId) || null : null;
  const displayNodes = hoveredNode ? [hoveredNode] : focusNodes.length > 0 ? focusNodes.slice(0, 2) : network.nodes.slice(0, 2);

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl xl:h-[680px]">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-300/75">Ripple Flow</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Agent chain reaction</h2>
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
        <div className="mb-4 overflow-hidden rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 p-3.5 xl:h-[138px]">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-cyan-200/80">
            Step {activeStageIndex + 1} of {playbackStages.length}
          </p>
          <div className="mt-2 flex min-h-[44px] items-start">
            <p className="text-base font-semibold text-white">{activeStage.title}</p>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:flex-nowrap">
            {playbackStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => onRestartPlayback(index)}
                className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition ${
                  index === activeStageIndex
                    ? 'border-cyan-300/30 bg-cyan-400/16 text-cyan-50'
                    : 'border-white/10 bg-black/20 text-slate-300 hover:bg-white/10'
                }`}
              >
                {STAGE_SHORT_LABELS[stage.id] || `Step ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4">
        <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#020617_0%,#01040c_100%)] xl:min-h-0">
          <svg viewBox={`0 0 ${FLOW_VIEWBOX.width} ${FLOW_VIEWBOX.height}`} className="absolute inset-0 h-full w-full">
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
            const hovered = hoveredNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={`absolute w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border bg-gradient-to-br px-2 py-2 text-left shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl transition-[opacity,box-shadow,border-color,background-color] duration-200 ${nodeColor(node.risk)} ${
                  active || hovered ? 'agent-node-active ring-2 ring-cyan-300/45' : 'opacity-85'
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <div className="flex justify-center">
                  <span className={`h-2 w-2 rounded-full ${riskDotTone(node.risk)}`} />
                </div>
                <p className="mt-2 text-center text-[0.82rem] font-semibold leading-4 text-white">{compactNodeLabel(node.label)}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-[156px] rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">How to read this</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LegendPill label="Active path" tone="bg-cyan-300" />
              <LegendPill label="High pressure" tone="bg-rose-300" />
              <LegendPill label="Stable node" tone="bg-emerald-300" />
            </div>
          </div>

          <div className="h-[156px] rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">Currently reacting</p>
            <div className="mt-3 h-[102px] space-y-2 overflow-y-auto pr-1">
              {activeStage ? <p className="text-sm leading-6 text-slate-300">{activeStage.detail}</p> : null}
              {displayNodes.map((node) => (
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
