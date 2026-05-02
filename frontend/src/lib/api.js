const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function loadBootstrap() {
  return Promise.all([request('/metadata'), request('/cities')]).then(([metadata, cities]) => ({
    metadata,
    cities,
  }));
}

export function simulateScenario(scenario, { useLLM = true } = {}) {
  const params = new URLSearchParams({
    use_llm: String(useLLM),
  });

  return request(`/simulate?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(scenario),
  });
}

export function compareScenarios(current, proposed, { useLLM = true } = {}) {
  const params = new URLSearchParams({
    use_llm: String(useLLM),
  });

  return request(`/compare?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify({
      current,
      proposed,
    }),
  });
}

export { API_BASE_URL };
