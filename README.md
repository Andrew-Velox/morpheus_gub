# Office Energy Monitor Backend

Hackathon backend for a real-time office lights/fans monitoring system with a Discord bot.

## Implemented Backend Features

- Single in-memory source of truth shared by REST APIs, realtime streams, and Discord bot.
- 15 simulated devices across 3 rooms:
  - Drawing Room: 2 fans, 3 lights
  - Work Room 1: 2 fans, 3 lights
  - Work Room 2: 2 fans, 3 lights
- Live power calculation in watts, accumulated kWh, and estimated BDT cost.
- Active alert engine:
  - After-hours devices ON outside office hours
  - Whole-room continuous usage for more than 2 hours
  - Stable alert keys to avoid duplicate alert spam
- Realtime updates through both:
  - SSE: `GET /api/stream`
  - Native WebSocket: `ws://localhost:4000/ws`
- Discord commands:
  - `!status`
  - `!room <name>`
  - `!usage`
- Optional Groq formatting for bot replies. If Groq is not configured, the bot uses deterministic backend-based templates.
- Demo simulator endpoints for toggling devices, forcing room state, ingesting Arduino-style room JSON, setting demo time, and resetting the simulation.
- Swagger docs at `http://localhost:4000/docs`.

## Run Backend

```bash
cd backend
npm install
npm run start:server
```

For development:

```bash
cd backend
npm run dev
```

`npm run dev` starts the backend server. It starts the Discord bot only when `DISCORD_TOKEN` is configured.

## Environment Variables

Create `backend/.env`:

```env
PORT=4000
CORS_ORIGIN=*
OFFICE_TIMEZONE=Asia/Dhaka
OFFICE_OPEN=9
OFFICE_CLOSE=17
TARIFF_BDT_PER_KWH=12
FAN_WATTS=60
LIGHT_WATTS=15
DISCORD_TOKEN=
DISCORD_ALERT_CHANNEL_ID=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

## Main API

- `GET /api/health`
- `GET /api/devices`
- `GET /api/status`
- `GET /api/status/by-room`
- `GET /api/rooms/:roomId`
- `GET /api/room/:name`
- `GET /api/usage`
- `GET /api/alerts`
- `GET /api/snapshot`
- `GET /api/stream`

## Demo API

- `POST /api/simulator/toggle/:deviceId`
- `POST /api/simulator/room/:roomId`
- `POST /api/simulator/ingest`
- `POST /api/ingest/arduino`
- `POST /api/simulator/time`
- `POST /api/simulator/reset`

Example after-hours demo:

```bash
curl -X POST http://localhost:4000/api/simulator/time \
  -H "Content-Type: application/json" \
  -d "{\"currentTime\":\"2026-07-03T22:00:00+06:00\"}"
```

Example continuous room alert demo:

```bash
curl -X POST http://localhost:4000/api/simulator/room/work_room_1 \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"ON\",\"onSinceHoursAgo\":3}"
```

## Test

```bash
cd backend
npm test
```

## Not Implemented In This Pass

- Frontend dashboard UI is not changed, per request.
- Persistent database storage is not added; the hackathon backend uses in-memory state for simple setup.
- Physical hardware integration is not added; the backend is ready for simulated monitoring and can be extended to ESP32/relay sensor input later.
