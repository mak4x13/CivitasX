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
    description: 'Increase education sensitivity',
  },
  {
    key: 'event_day',
    label: 'Event Day',
    description: 'Increase public gathering pressure',
  },
];

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-[0.68rem] uppercase tracking-[0.26em] text-cyan-300/75">{eyebrow}</p> : null}
      <h2 className="mt-2 font-display text-xl font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p> : null}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block rounded-[22px] border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 hover:bg-white/[0.06]">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
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

function SliderField({ label, value, min, max, step, suffix, onChange }) {
  return (
    <label className="block rounded-[22px] border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 hover:bg-white/[0.06]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <span className="rounded-full border border-cyan-400/18 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
      />
    </label>
  );
}

function ToggleField({ label, value, description, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-[22px] border px-3 py-3 text-left transition ${
        value
          ? 'border-emerald-400/20 bg-emerald-500/10'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          value ? 'bg-emerald-300 text-slate-950' : 'border border-white/10 bg-black/20 text-slate-300'
        }`}
      >
        {value ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function ActionButton({ label, onClick, disabled, tone = 'secondary' }) {
  const classes =
    tone === 'primary'
      ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
      : tone === 'accent'
        ? 'border border-orange-400/20 bg-orange-400/10 text-orange-100 hover:bg-orange-400/20'
        : 'border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[22px] px-4 py-3 text-sm font-semibold transition ${classes} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {label}
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

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <SectionTitle
        eyebrow="Scenario Builder"
        title="Define the policy decision"
        subtitle="Keep the left side for inputs only. Submit a scenario, then use the center and right panels to explain the result."
      />

      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active city profile</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{citySummary || 'Waiting for city metadata from the backend.'}</p>
        <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
          Summary mode: {generatedBy === 'groq' ? 'Groq SDK' : 'Rule-based fallback'}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <SectionTitle title="Location and policy type" />
          <div className="space-y-3">
            <SelectField
              label="City"
              value={controls.city}
              options={options?.cities || ['Islamabad', 'Lahore', 'Karachi']}
              onChange={(value) => onChange('city', value)}
            />
            <SelectField
              label="Scenario Type"
              value={controls.scenario_type}
              options={options?.scenario_types || ['transport_restriction', 'security_restriction']}
              onChange={(value) => onChange('scenario_type', value)}
            />
          </div>
        </div>

        <div>
          <SectionTitle title="Restriction settings" />
          <div className="space-y-3">
            <SelectField
              label="Road Closure"
              value={controls.road_closure_level}
              options={options?.road_closure_levels || ['none', 'minor', 'partial', 'major']}
              onChange={(value) => onChange('road_closure_level', value)}
            />
            <SelectField
              label="Internet Shutdown"
              value={controls.internet_shutdown}
              options={options?.internet_shutdown_levels || ['off', 'partial', 'full']}
              onChange={(value) => onChange('internet_shutdown', value)}
            />
            <SelectField
              label="Police Presence"
              value={controls.police_presence}
              options={options?.police_presence_levels || ['low', 'medium', 'high']}
              onChange={(value) => onChange('police_presence', value)}
            />
            {sliderRows.map((row) => (
              <SliderField
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
          </div>
        </div>

        <div>
          <SectionTitle title="Mitigation levers" />
          <div className="space-y-3">
            <SelectField
              label="Transport Support"
              value={controls.public_transport_support}
              options={options?.public_transport_support_levels || ['low', 'normal', 'high']}
              onChange={(value) => onChange('public_transport_support', value)}
            />
            <SelectField
              label="Announcement Quality"
              value={controls.announcement_quality}
              options={options?.announcement_quality_levels || ['poor', 'neutral', 'clear']}
              onChange={(value) => onChange('announcement_quality', value)}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {toggleRows.map((row) => (
                <ToggleField
                  key={row.key}
                  label={row.label}
                  value={controls[row.key]}
                  description={row.description}
                  onChange={(value) => onChange(row.key, value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <ActionButton label={isSending ? 'Simulating...' : 'Run Simulation'} onClick={onApply} disabled={isSending} tone="primary" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <ActionButton label="Reset Scenario" onClick={onReset} />
          <ActionButton label="Run Demo Scenario" onClick={onDemo} tone="accent" />
        </div>
      </div>
    </section>
  );
}
