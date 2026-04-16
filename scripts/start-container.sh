#!/bin/sh
set -eu

BACKEND_PORT="${PORT:-26032}"
FRONTEND_PORT="${FRONTEND_PORT:-26031}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT}}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"

cleanup() {
  kill "${backend_pid}" "${frontend_pid}" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

PORT="${FRONTEND_PORT}" \
HOSTNAME="0.0.0.0" \
BACKEND_URL="${BACKEND_URL}" \
npm run start --workspace=frontend &
frontend_pid=$!

PORT="${BACKEND_PORT}" \
FRONTEND_URL="${FRONTEND_URL}" \
npm run start --workspace=backend &
backend_pid=$!

wait "${backend_pid}" "${frontend_pid}"
