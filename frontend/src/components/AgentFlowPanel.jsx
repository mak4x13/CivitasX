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

export default function AgentFlowPanel({ network, headline }) {
  if (!network) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <p className="text-sm text-slate-300">Run a scenario to visualize the agent dependency flow.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Agentic Flow</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">Cause-and-effect network</h2>
        <p className="mt-2 text-sm text-slate-400">
          Highlighted links show the strongest propagation path through the city model.
        </p>
        {headline ? <p className="mt-2 text-sm text-slate-300">{headline}</p> : null}
      </div>

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
            return (
              <g key={`${edge.source}-${edge.target}`}>
                <path
                  d={path}
                  className={edge.highlighted ? 'flow-edge-active' : ''}
                  stroke="url(#flowStroke)"
                  strokeOpacity={edge.highlighted ? 0.95 : 0.36}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={edge.highlighted ? '4 3' : '0'}
                />
                <text
                  x={(NODE_LAYOUT[edge.source].x + NODE_LAYOUT[edge.target].x) / 2}
                  y={(NODE_LAYOUT[edge.source].y + NODE_LAYOUT[edge.target].y) / 2 - 2}
                  fill="rgba(226,232,240,0.75)"
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

          return (
            <div
              key={node.id}
              className={`absolute w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-gradient-to-br px-3 py-3 shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl ${nodeColor(node.risk)}`}
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
          Agent influence is live from the backend `agent_network` payload.
        </div>
      </div>
    </section>
  );
}
