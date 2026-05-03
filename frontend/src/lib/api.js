function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }

  return '';
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()).replace(/\/$/, '');

function getRequestUrl(path) {
  if (!API_BASE_URL) {
    throw new Error(
      'Backend URL is not configured. Set VITE_API_BASE_URL to your Hugging Face Space URL before deploying the frontend.',
    );
  }

  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const { timeoutMs = 15000, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(getRequestUrl(path), {
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      signal: controller.signal,
      ...fetchOptions,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check the backend and try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timerId);
  }

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

export function loadLiveContext(city) {
  const params = new URLSearchParams({ city });
  return request(`/context/live?${params.toString()}`, {
    timeoutMs: 7000,
  });
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
