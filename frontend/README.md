# Kalema Frontend

This frontend is a Next.js application for the Kalema party game platform.

## Role In The System

The frontend renders the game UI and connects to Socket.IO from the browser.

In production Docker, it is not exposed directly to the public internet. The backend is the single public entrypoint and proxies page requests to this frontend process inside the same container.

Request flow:

```text
Browser -> Backend public port -> Frontend pages
Browser -> Backend public port -> Backend Socket.IO
```

## Local Development

Run the frontend and backend separately:

```bash
# from repo root
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:26032`.

## Production Container

In the production image, the frontend runs on an internal port only:

```text
Frontend process: 127.0.0.1:26031
Backend process:  0.0.0.0:26032
Public access:    port 26032 only
```

The backend proxies normal page requests to the frontend process.

## Environment

Typical frontend variables:

```env
NEXT_PUBLIC_BACKEND_URL=
PORT=26032
HOSTNAME=0.0.0.0
```

Leave `NEXT_PUBLIC_BACKEND_URL` empty unless you need to force the browser to connect to a different backend origin.
