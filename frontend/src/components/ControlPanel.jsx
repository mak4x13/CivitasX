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
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))] px-4 py-3 pr-12 text-sm font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-cyan-400/50 focus:bg-slate-950"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {titleize(option)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
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
  liveContext,
  liveContextState,
  onRefreshLiveContext,
  onApplyTriggerSuggestion,
  onApply,
  onReset,
  onDemo,
  requestState,
}) {
  const isSending = requestState === 'sending';
  const liveContextMode =
    liveContextState === 'loading'
      ? 'Refreshing trigger'
      : liveContext?.mode === 'rss'
        ? 'Live feed connected'
        : liveContextState === 'error'
          ? 'Context unavailable'
          : 'Using city profile';
  const feedStatusCopy =
    liveContextState === 'loading'
      ? 'Fetching the latest trigger frame from the backend.'
      : liveContext?.mode === 'rss'
        ? 'External headlines are shaping the current trigger frame for this city.'
        : liveContextState === 'error'
          ? 'The backend context request failed. You can still test decisions with the current controls.'
          : 'A profile-based trigger frame is active until a live external feed is enabled.';
  const triggerSummary =
    liveContext?.mode === 'rss'
      ? liveContext?.summary
      : liveContext?.trigger_type
        ? `${liveContext.trigger_type} is the current baseline trigger. Use the decision controls above to test the response before anything is finalized.`
        : 'Waiting for backend context.';

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:p-6">
      <SectionTitle
        eyebrow="Live Trigger -> Candidate Decision"
        title="Draft the government response"
        subtitle="Start from the current trigger, adjust the proposed response in structured controls, then inspect the predicted ripple."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active city profile</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{citySummary || 'Waiting for city metadata from the backend.'}</p>
        </div>

        <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Trigger feed</p>
          <p className="mt-2 text-base font-semibold text-white">{liveContextMode}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{feedStatusCopy}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.35fr_1fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <SectionTitle eyebrow="Candidate Decision" title="Scope and policy type" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <SectionTitle eyebrow="Candidate Decision" title="Core response settings" />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Road Closure"
              value={controls.road_closure_level}
              options={options?.road_closure_levels || ['none', 'minor', 'partial', 'major']}
              onChange={(value) => onChange('road_closure_level', value)}
            />
            <SelectField
              label="Connectivity Restriction"
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

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <SectionTitle eyebrow="Candidate Decision" title="Mitigation levers" />
          <div className="grid gap-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
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

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_300px]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <SectionTitle eyebrow="Current Trigger" title="Live operating context" subtitle="This frames what is happening now. The structured controls above are where you test the response before the decision is released." />
          <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200">
            {triggerSummary}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50">
              Trigger: {liveContext?.trigger_type || 'Pending'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
              Severity: {titleize(liveContext?.severity || 'unknown')}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
              Confidence: {titleize(liveContext?.confidence || 'unknown')}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(liveContext?.affected_systems || []).map((system) => (
              <span key={system} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">
                {system}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            {(liveContext?.items || []).slice(0, 3).map((item) => (
              <div key={`${item.source}-${item.title}`} className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{item.source}</span>
                  {item.published_at ? <span>{new Date(item.published_at).toLocaleString()}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Starting frame</p>
          <p className="mt-2 text-base font-semibold text-white">{liveContextMode}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {liveContext?.signal || 'No backend signal yet.'}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">Suggested scenario seed</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(liveContext?.suggested_scenario || {}).slice(0, 4).map(([key, value]) => (
              <span key={key} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-200">
                {titleize(key)}: {String(value)}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onApplyTriggerSuggestion}
            disabled={!liveContext?.suggested_scenario || liveContextState === 'loading'}
            className="mt-4 w-full rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply Trigger Framing
          </button>
          <button
            type="button"
            onClick={onRefreshLiveContext}
            className="mt-3 w-full rounded-[18px] border border-cyan-300/20 bg-cyan-400/12 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/18"
          >
            Refresh Context
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next step</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Confirm the trigger, adjust the candidate decision, then run the simulation to inspect the predicted ripple.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ActionButton label={isSending ? 'Simulating...' : 'Run Simulation'} onClick={onApply} disabled={isSending} tone="primary" />
          <ActionButton label="Reset Scenario" onClick={onReset} />
          <ActionButton label="Run Demo Scenario" onClick={onDemo} tone="accent" />
        </div>
      </div>
    </section>
  );
}
