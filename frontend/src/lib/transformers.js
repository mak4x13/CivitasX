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

function topZonesBy(zoneStates, field, limit = 3) {
  return [...zoneStates]
    .sort((a, b) => (b[field] || 0) - (a[field] || 0))
    .slice(0, limit)
    .map((zone) => zone.id);
}

export function buildPlaybackStages(simulation, zoneStates) {
  if (!simulation) {
    return [];
  }

  const transportZones = topZonesBy(zoneStates, 'displayTrafficPressure');
  const serviceZones = [
    ...new Set([
      ...zoneStates
        .filter((zone) => zone.issues.some((issue) => ['Economic stress', 'Education strain', 'Connectivity dependency'].includes(issue)))
        .slice(0, 4)
        .map((zone) => zone.id),
    ]),
  ];
  const tensionZones = topZonesBy(zoneStates, 'displayProtestPressure');
  const advisorZones = zoneStates
    .filter((zone) => zone.stabilityScore >= 50)
    .slice(0, 3)
    .map((zone) => zone.id);

  return [
    {
      id: 'input',
      title: 'Policy Input Locked',
      detail: `${titleize(simulation.scenario.city)} scenario submitted with ${titleize(simulation.scenario.road_closure_level)} road closures, ${simulation.scenario.bus_routes_closed} bus cuts, and ${titleize(simulation.scenario.internet_shutdown)} internet restrictions.`,
      activeNodeIds: [],
      zoneIds: [],
    },
    {
      id: 'transport',
      title: 'Transport Shock Propagates',
      detail: simulation.agents.transport.summary,
      activeNodeIds: ['transport'],
      zoneIds: transportZones,
    },
    {
      id: 'services',
      title: 'Economy, Education, And Internet React',
      detail: simulation.conflicts[0] || simulation.agents.internet.summary,
      activeNodeIds: ['economy', 'education', 'internet'],
      zoneIds: serviceZones,
    },
    {
      id: 'sentiment',
      title: 'Sentiment And Protest Risk Rise',
      detail: simulation.agents.sentiment.summary,
      activeNodeIds: ['sentiment', 'protest'],
      zoneIds: tensionZones,
    },
    {
      id: 'advisor',
      title: 'Advisor Suggests Safer Rollout',
      detail: simulation.agents.advisor.recommendation,
      activeNodeIds: ['advisor'],
      zoneIds: advisorZones,
    },
  ];
}

function personaStatus(score) {
  if (score >= 80) {
    return 'Critical';
  }

  if (score >= 65) {
    return 'High';
  }

  if (score >= 45) {
    return 'Medium';
  }

  return 'Low';
}

export function buildPersonaImpacts(simulation, zoneStates) {
  if (!simulation) {
    return [];
  }

  const scores = simulation.scores;
  const zoneMap = Object.fromEntries(zoneStates.map((zone) => [zone.id, zone]));
  const personas = [
    {
      id: 'student',
      name: 'Student',
      focus: 'University access',
      score: Math.round(scores.education_disruption * 0.62 + scores.internet_dependency_risk * 0.24 + scores.commute_disruption * 0.14),
      summary: 'Class continuity depends on both transport and digital fallback staying open.',
      zone: zoneMap.uni?.name || 'University Zone',
      driver: simulation.agents.education.recommendation,
    },
    {
      id: 'worker',
      name: 'Daily Wage Worker',
      focus: 'Commute and income',
      score: Math.round(scores.economic_impact * 0.54 + scores.commute_disruption * 0.32 + scores.protest_probability * 0.14),
      summary: 'Missed commutes and restricted market access translate directly into income disruption.',
      zone: zoneMap.market?.name || 'Market Zone',
      driver: simulation.agents.economy.recommendation,
    },
    {
      id: 'freelancer',
      name: 'Freelancer',
      focus: 'Remote work reliability',
      score: Math.round(scores.internet_dependency_risk * 0.72 + scores.economic_impact * 0.18 + (100 - scores.public_sentiment) * 0.1),
      summary: 'Internet restrictions remove the main fallback path when physical movement is constrained.',
      zone: zoneMap.commercial?.name || 'Commercial Zone',
      driver: simulation.agents.internet.recommendation,
    },
    {
      id: 'hospital_admin',
      name: 'Hospital Admin',
      focus: 'Emergency continuity',
      score: Math.round(scores.commute_disruption * 0.38 + scores.protest_probability * 0.22 + (100 - scores.city_stability) * 0.18 + 24),
      summary: 'Emergency services become fragile when road access and public tension rise at the same time.',
      zone: zoneMap.hospital?.name || 'Hospital Zone',
      driver: simulation.agents.transport.recommendation,
    },
  ];

  return personas.map((persona) => ({
    ...persona,
    score: clamp(persona.score, 0, 100),
    status: personaStatus(clamp(persona.score, 0, 100)),
  }));
}

export function buildActionPlan(simulation) {
  if (!simulation) {
    return [];
  }

  const changedFields = simulation.alternative_policy
    ? Object.entries(simulation.alternative_policy)
        .filter(([key, value]) => simulation.scenario[key] !== value)
        .map(([key, value]) => `${titleize(key)} -> ${typeof value === 'boolean' ? (value ? 'On' : 'Off') : titleize(value)}`)
    : [];

  return [
    {
      label: 'Do Now',
      detail: simulation.conflicts[0] || simulation.agents.advisor.recommendation,
    },
    {
      label: 'Next 6 Hours',
      detail: changedFields.length > 0 ? `Apply the safer policy deltas: ${changedFields.slice(0, 3).join(', ')}.` : simulation.agents.transport.recommendation,
    },
    {
      label: 'Next 24 Hours',
      detail: `Monitor mobility (${simulation.scores.mobility}/100), sentiment (${simulation.scores.public_sentiment}/100), and protest risk (${simulation.scores.protest_probability}/100) before scaling restrictions further.`,
    },
  ];
}

export function buildGovernanceFrame(simulation) {
  if (!simulation) {
    return null;
  }

  const conflictPenalty = Math.min(simulation.conflicts.length * 8, 24);
  const stabilityBonus = Math.max(simulation.scores.city_stability - 50, 0) * 0.2;
  const confidenceValue = clamp(Math.round(72 - conflictPenalty + stabilityBonus), 35, 88);
  const confidenceLabel = confidenceValue >= 75 ? 'High directional confidence' : confidenceValue >= 55 ? 'Medium directional confidence' : 'Low directional confidence';

  return {
    confidenceValue,
    confidenceLabel,
    assumptions: [
      'Synthetic city profiles are being used.',
      'Scores are directional, not exact forecasts.',
      'No live civic, telecom, or traffic feeds are connected.',
    ],
    safeguards: [
      'Use as advisory support, not automatic policy execution.',
      'Review impact on vulnerable groups before implementation.',
      'Treat internet restrictions as high-risk when mobility is already constrained.',
    ],
  };
}

export function buildProblemFrame(simulation) {
  if (!simulation) {
    return [];
  }

  return [
    {
      label: 'Mobility Shock',
      value: `${simulation.scores.commute_disruption}/100`,
      detail: 'Road and bus restrictions push pressure into the whole city grid.',
    },
    {
      label: 'Income Exposure',
      value: `${simulation.scores.economic_impact}/100`,
      detail: 'Workers, markets, and business continuity absorb the second-order impact.',
    },
    {
      label: 'Digital Fallback Risk',
      value: `${simulation.scores.internet_dependency_risk}/100`,
      detail: 'If internet is also constrained, the city loses its backup path.',
    },
  ];
}
