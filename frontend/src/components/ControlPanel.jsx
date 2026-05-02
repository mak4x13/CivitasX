import { titleize } from '../lib/transformers';

const sliderRows = [
  {
    key: 'fuel_price_increase_pct',
    label: 'Fuel Price Increase',
    min: 0,
    max: 50,
    step: 1,
    suffix: '%',
  },
  {
    key: 'bus_routes_closed',
    label: 'Bus Routes Closed',
    min: 0,
    max: 10,
    step: 1,
    suffix: '',
  },
  {
    key: 'duration_days',
    label: 'Duration',
    min: 1,
    max: 7,
    step: 1,
    suffix: 'd',
  },
];

const toggleRows = [
  {
    key: 'exam_day',
    label: 'Exam Day',
    description: 'Raises education sensitivity',
  },
  {
    key: 'event_day',
    label: 'Event Day',
    description: 'Raises public gathering pressure',
  },
];

function fieldLabel(key) {
  return titleize(key);
}

function ControlSectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-semibold tracking-wide text-slate-50">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, suffix, onChange }) {
  return (
    <label className="block rounded-2xl border border-white/8 bg-slate-950/40 p-3 transition hover:border-cyan-400/30 hover:bg-slate-900/60">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">
          {value}
          {suffix}
        </span>
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <label className="block rounded-2xl border border-white/8 bg-slate-950/40 p-3 transition hover:border-orange-400/30 hover:bg-slate-900/60">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300">
          {titleize(value)}
        </span>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {titleize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({ label, value, description, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
        value
          ? 'border-emerald-400/25 bg-emerald-400/10'
          : 'border-white/8 bg-slate-950/40 hover:border-white/15 hover:bg-slate-900/60'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          value ? 'bg-emerald-300 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300'
        }`}
      >
        {value ? 'On' : 'Off'}
      </span>
    </button>
  );
}

export default function ControlPanel({
  controls,
  options,
  citySummary,
  onChange,
  onApply,
  onReset,
  onDemo,
  requestState,
  generatedBy,
}) {
  const isSending = requestState === 'sending';
  const selectRows = [
    {
      key: 'city',
      label: 'City',
      options: options?.cities || ['Islamabad', 'Lahore', 'Karachi'],
    },
    {
      key: 'scenario_type',
      label: 'Scenario Type',
      options: options?.scenario_types || ['transport_restriction', 'security_restriction'],
    },
    {
      key: 'road_closure_level',
      label: 'Road Closure',
      options: options?.road_closure_levels || ['none', 'minor', 'partial', 'major'],
    },
    {
      key: 'police_presence',
      label: 'Police Presence',
      options: options?.police_presence_levels || ['low', 'medium', 'high'],
    },
    {
      key: 'internet_shutdown',
      label: 'Internet Shutdown',
      options: options?.internet_shutdown_levels || ['off', 'partial', 'full'],
    },
    {
      key: 'public_transport_support',
      label: 'Transport Support',
      options: options?.public_transport_support_levels || ['low', 'normal', 'high'],
    },
    {
      key: 'announcement_quality',
      label: 'Announcement Quality',
      options: options?.announcement_quality_levels || ['poor', 'neutral', 'clear'],
    },
  ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <ControlSectionTitle
        title="Policy Controls"
        subtitle="Configure the scenario, submit it to the backend, and watch the city react."
      />

      <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
        <p className="font-semibold text-slate-100">Active city profile</p>
        <p className="mt-1">{citySummary || 'Waiting for city metadata from the backend.'}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-300/70">
          Summary mode: {generatedBy === 'groq' ? 'Groq SDK' : 'Rule-based fallback'}
        </p>
      </div>

      <div className="space-y-3">
        {selectRows.map((row) => (
          <SelectRow
            key={row.key}
            label={row.label || fieldLabel(row.key)}
            value={controls[row.key]}
            options={row.options}
            onChange={(value) => onChange(row.key, value)}
          />
        ))}

        {sliderRows.map((row) => (
          <SliderRow
            key={row.key}
            label={row.label}
            value={controls[row.key]}
            min={row.min}
            max={row.max}
            step={row.step}
            suffix={row.suffix}
            onChange={(value) => onChange(row.key, value)}
          />
        ))}

        <div className="grid gap-3 sm:grid-cols-2">
          {toggleRows.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              value={controls[row.key]}
              description={row.description}
              onChange={(value) => onChange(row.key, value)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onApply}
          disabled={isSending}
          className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSending ? 'Simulating...' : 'Run Simulation'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
        >
          Reset Scenario
        </button>
        <button
          type="button"
          onClick={onDemo}
          className="rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-300/30 hover:bg-orange-400/20"
        >
          Run Demo Scenario
        </button>
      </div>
    </section>
  );
}
