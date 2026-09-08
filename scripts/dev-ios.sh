#!/usr/bin/env bash
set -euo pipefail

DEVICE="${DEVICE:-iPhone 17}"
PORT=5173
URL="http://localhost:${PORT}"

booted=$(xcrun simctl list devices booted | grep -F "$DEVICE" || true)
if [ -z "$booted" ]; then
  udid=$(xcrun simctl list devices available | grep -F "$DEVICE" | head -1 | grep -oE '[0-9A-F-]{36}')
  if [ -z "$udid" ]; then
    echo "No se encontró el simulador '$DEVICE'. Usa DEVICE=\"iPhone 17 Pro\" npm run dev:ios, o crea uno desde Xcode." >&2
    exit 1
  fi
  xcrun simctl boot "$udid"
fi

open -a Simulator

npm run dev -- --host localhost --port "$PORT" --strictPort &
DEV_PID=$!
trap 'kill $DEV_PID 2>/dev/null' EXIT INT TERM

echo "Esperando a que el dev server responda en $URL..."
for _ in $(seq 1 60); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

xcrun simctl openurl booted "$URL"
echo "Abierto $URL en el simulador '$DEVICE'."

wait $DEV_PID
