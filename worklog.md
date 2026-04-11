---
Task ID: 1
Agent: Main Agent
Task: Fix SOS alerts not working between devices and map position issues

Work Log:
- Read and analyzed all key files: page.tsx, map-view.tsx, offline-api.ts, mock-data.ts, store.ts
- Identified SOS root cause: SOS activation only set local React state, never called any API to persist the alert
- Identified `/api/alerts` GET endpoint bug: returned static mockAlerts from mock-data.ts, never saw new alerts
- Identified `/api/alert` POST bug: didn't accept lat/lng from request body
- Identified `/api/sos` POST bug: only returned success, didn't create an alert in the store

SOS Fixes Applied:
1. Created `handleSOSActivate` callback that: activates SOS overlay + gets geolocation + calls `/api/alert` POST with category "sos", priority "critical", lat/lng coordinates
2. Added SOS polling mechanism (every 5 seconds) that checks `/api/alerts` for new SOS alerts
3. Added incoming SOS notification banner with "Ver en Mapa" button
4. Added SOS alarm sound using Web Audio API (3 short - 3 long - 3 short beep pattern)
5. Updated `/api/alerts/route.ts` to use `getAllAlerts()` from store instead of static mockAlerts
6. Updated `/api/alert/route.ts` to accept lat/lng and handle SOS category properly
7. Updated `/api/sos/route.ts` to actually create an alert in the shared store
8. Updated `offline-api.ts` handleAlert to support GET method and save SOS data to localStorage
9. Added special SOS visual treatment in alert cards (red pulse, SOS badge)
10. Made TopBar notification badge dynamic (count of active alerts)

Map Position Fixes:
1. Enhanced towers loading to merge API data with localStorage saved positions
2. Added triple fallback: localStorage positions → API positions → default mock positions
3. Offline-api tower GET handler ensures saved positions are always respected

Stage Summary:
- SOS now persists alerts to the shared store (web) and localStorage (offline)
- Other devices polling `/api/alerts` every 5 seconds will detect new SOS alerts
- Incoming SOS shows notification banner with alarm sound
- SOS alerts show on map with pulsing red marker
- Map positions are protected with multiple fallback layers
- All source files pass ESLint with no errors
