# Deployment Guide

This is the fastest stable setup for CivitasX:

- backend on Hugging Face Docker Space
- frontend on Vercel
- frontend calls backend through `VITE_API_BASE_URL`

## 1. Backend on Hugging Face Spaces

Create a new Hugging Face Space:

1. Go to `https://huggingface.co/new-space`
2. Choose:
   - SDK: `Docker`
   - Visibility: your choice
3. Create the Space

In that Space repo, add these files from this project root:

- `app/`
- `Dockerfile`
- `.dockerignore`
- `requirements-prod.txt`

Set the Space `README.md` to the contents of [HF_SPACE_README_TEMPLATE.md](C:/Users/Lenovo/Desktop/CivitasX/HF_SPACE_README_TEMPLATE.md).

### Space environment variables

Set these in the Hugging Face Space settings:

```text
BACKEND_CORS_ORIGINS=*
LIVE_CONTEXT_PROVIDER=fallback
LIVE_CONTEXT_TIMEOUT_SECONDS=3.5
LIVE_CONTEXT_MAX_ITEMS=5
```

Optional:

```text
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
```

### Expected backend URL

Your public backend URL will look like:

```text
https://<your-space-name>.hf.space
```

Test these after the Space is live:

- `https://<your-space-name>.hf.space/health`
- `https://<your-space-name>.hf.space/metadata`

## 2. Frontend on Vercel

Create a Vercel project from this GitHub repo.

Use these settings:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### Vercel environment variable

Add this environment variable in Vercel:

```text
VITE_API_BASE_URL=https://<your-space-name>.hf.space
```

Redeploy after setting it.

## 3. Connect them

The frontend is already wired to use `VITE_API_BASE_URL` in production.

The backend is already wired to allow configurable CORS through:

```text
BACKEND_CORS_ORIGINS
```

For the hackathon setup, keep:

```text
BACKEND_CORS_ORIGINS=*
```

If you want to tighten it later, set it to:

```text
BACKEND_CORS_ORIGINS=https://your-project.vercel.app
```

## 4. Final smoke test

Once both are deployed:

1. Open the Vercel frontend
2. Confirm the dashboard loads cities and metadata
3. Run a simulation
4. Confirm the browser network calls hit:
   - `https://<your-space-name>.hf.space/metadata`
   - `https://<your-space-name>.hf.space/cities`
   - `https://<your-space-name>.hf.space/simulate`

## 5. Common failure points

### Frontend tries to call localhost

Cause:

- `VITE_API_BASE_URL` was not set in Vercel

Fix:

- set `VITE_API_BASE_URL`
- redeploy

### Browser CORS error

Cause:

- backend origin list is too strict

Fix:

- set `BACKEND_CORS_ORIGINS=*` for the demo

### Hugging Face Space builds but app does not open

Cause:

- missing Docker Space README YAML
- wrong port

Fix:

- use [HF_SPACE_README_TEMPLATE.md](C:/Users/Lenovo/Desktop/CivitasX/HF_SPACE_README_TEMPLATE.md)
- keep `app_port: 7860`

### Frontend loads but simulation fails

Cause:

- backend URL is wrong
- Space is sleeping or still building

Fix:

- verify `/health`
- verify the exact `hf.space` URL
