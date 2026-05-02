import { ZONE_LAYOUTS } from '../data/zoneLayout';

export const FALLBACK_SCENARIO = {
  city: 'Islamabad',
  scenario_type: 'transport_restriction',
  fuel_price_increase_pct: 0,
  bus_routes_closed: 0,
  road_closure_level: 'none',
  police_presence: 'low',
  internet_shutdown: 'off',
  public_transport_support: 'normal',
  announcement_quality: 'neutral',
  duration_days: 1,
  exam_day: false,
  event_day: false,
};

export const DEMO_SCENARIO = {
  city: 'Islamabad',
  scenario_type: 'transport_restriction',
  fuel_price_increase_pct: 18,
  bus_routes_closed: 5,
  road_closure_level: 'major',
  police_presence: 'medium',
  internet_shutdown: 'partial',
  public_transport_support: 'low',
  announcement_quality: 'poor',
  duration_days: 2,
  exam_day: false,
  event_day: false,
};

const STATUS_TO_BAND = {
  stable: 'stable',
  stressed: 'warning',
  disrupted: 'tense',
  critical: 'critical',
};

const INDICATOR_LABELS = {
  road_closure: 'Route restrictions',
  economic_risk: 'Economic stress',
  student_disruption: 'Education strain',
  internet_dependency: 'Connectivity dependency',
  protest_risk: 'Protest pressure',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function titleize(value) {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMetricDelta(value, invert = false) {
  const effective = invert ? -value : value;
  const prefix = effective > 0 ? '+' : '';
  return `${prefix}${effective}`;
}

export function buildVisualMetrics(simulation) {
  if (!simulation) {
    return {
      stabilityScore: 0,
      mobility: 0,
      economicImpact: 0,
      educationContinuity: 0,
      digitalRisk: 0,
      sentiment: 0,
      protestRisk: 0,
      trafficLevel: 0,
      policePressure: 0,
    };
  }

  const scores = simulation.scores;
  const trafficLevel = clamp(100 - scores.mobility, 0, 100);
  const policePressure = clamp(
    Math.round(
      scores.protest_probability * 0.58 +
        (100 - scores.public_sentiment) * 0.28 +
        scores.commute_disruption * 0.24,
    ),
    0,
    100,
  );

  return {
    stabilityScore: scores.city_stability,
    mobility: scores.mobility,
    economicImpact: scores.economic_impact,
    educationContinuity: scores.education_continuity,
    digitalRisk: scores.internet_dependency_risk,
    sentiment: scores.public_sentiment,
    protestRisk: scores.protest_probability,
    trafficLevel,
    policePressure,
  };
}

export function buildZoneStates(simulation) {
  if (!simulation) {
    return [];
  }

  const visualMetrics = buildVisualMetrics(simulation);

  return simulation.zone_impacts.map((zone, index) => {
    const layout = ZONE_LAYOUTS[zone.zone_id] || Object.values(ZONE_LAYOUTS)[index];
    const stabilityScore = clamp(100 - zone.risk_score, 0, 100);
    const displayTrafficPressure = clamp(
      Math.round(visualMetrics.trafficLevel * layout.trafficWeight + zone.risk_score * 0.35),
      0,
      100,
    );
    const displayProtestPressure = clamp(
      Math.round(visualMetrics.protestRisk * layout.protestWeight + zone.risk_score * 0.2),
      0,
      100,
    );
    const displayPolicePressure = clamp(
      Math.round(visualMetrics.policePressure * layout.policeWeight + zone.risk_score * 0.16),
      0,
      100,
    );

    return {
      ...layout,
      name: zone.label,
      stabilityScore,
      riskBand: STATUS_TO_BAND[zone.status] || 'warning',
      issues: zone.indicators.length
        ? zone.indicators.map((indicator) => INDICATOR_LABELS[indicator] || titleize(indicator))
        : ['Operating normally'],
      summary: zone.summary,
      backendStatus: zone.status,
      protestMarkers: clamp(Math.round(displayProtestPressure / 18), 0, 6),
      policeMarkers: clamp(Math.round(displayPolicePressure / 16), 0, 6),
      trafficMarkers: clamp(Math.round(displayTrafficPressure / 14), 0, 7),
      displayTrafficPressure,
      displayProtestPressure,
      displayPolicePressure,
    };
  });
}

export function buildConsequenceFeed(simulation) {
  if (!simulation) {
    return ['The simulator is ready. Apply a decision to start the live city response.'];
  }

  const feed = [
    ...simulation.main_risks,
    ...simulation.conflicts,
  ];

  if (simulation.agents?.advisor?.recommendation) {
    feed.push(`Advisor action: ${simulation.agents.advisor.recommendation}`);
  }

  if (simulation.comparison?.headline) {
    feed.push(simulation.comparison.headline);
  }

  return [...new Set(feed)].slice(0, 8);
}

export function buildAlertItems(simulation) {
  if (!simulation) {
    return [];
  }

  const alerts = [];
  const scores = simulation.scores;

  if (scores.protest_probability >= 60) {
    alerts.push({ message: 'Protest risk is rising across sensitive zones.', tone: 'critical' });
  }

  if (scores.internet_dependency_risk >= 60) {
    alerts.push({ message: 'Digital fallback is under pressure.', tone: 'warning' });
  }

  if (scores.mobility <= 45) {
    alerts.push({ message: 'Mobility has dropped into a disrupted range.', tone: 'warning' });
  }

  if (simulation.conflicts.length > 0) {
    alerts.push({ message: simulation.conflicts[0], tone: 'critical' });
  }

  if (scores.city_stability >= 65 && alerts.length === 0) {
    alerts.push({ message: 'Scenario applied with manageable disruption.', tone: 'info' });
  }

  return alerts.slice(0, 5);
}
