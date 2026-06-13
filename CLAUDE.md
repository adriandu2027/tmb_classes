# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Flask)
```bash
cd backend
source venv/bin/activate
python app.py          # starts API on port 5555
python test.py         # run manual test script
```

### Frontend (React)
```bash
cd frontend
yarn start             # dev server on port 3000 (proxies API calls to localhost:5555)
yarn build             # production build
yarn test              # run tests
```

Both must be running simultaneously for the app to function. The frontend's `proxy` field in `package.json` routes all unmatched requests to `http://localhost:5555`.

## Architecture

**Monorepo** with a Python/Flask backend and a React/TypeScript frontend. No database — course data is loaded from `backend/data/courses_2025_spring_cleaned.csv` into a global pandas DataFrame (`df_courses`) at Flask startup.

### Data Flow
1. Backend reads the CSV once on startup; all filtering happens in-memory via pandas
2. Frontend selects a building via dropdown → fires a `fetch()` → backend filters `df_courses` and returns JSON
3. Components render cards from the JSON response

### Backend (`backend/app.py`)
All logic lives in a single file. The key utility functions are:
- `getTime(time_str)` — parses `"HH:MM"` strings into timezone-aware `time` objects (America/Chicago)
- `getCoursesInBuilding(building)` / `getClassToday(building)` — successive filters on `df_courses`
- `getOpenNow(building)` / `getOpenSoon(building)` — room availability logic; return color codes (`red`/`green` and `yellow`) based on a 30-minute buffer
- `getRooms(building)` — combines both; this is what `/open_rooms` calls

### Frontend (`frontend/src/`)
Three routes defined in `App.tsx`:
- `/` — home/nav
- `/class-finder` → `ClassFinderPage/ClassFinder.tsx` — shows classes currently in session at a building
- `/empty-room-searcher` → `EmptyRoomSearcherPage/EmptyRoomSearcher.tsx` — shows room availability with color-coded cards

Both page components follow the same pattern: building dropdown (react-select) → `useEffect` on selection change → `fetch()` to backend → `useState` to render cards.

### Color-Coding Logic (room availability)
- **Green**: room is empty and next class is >30 min away
- **Red**: room is empty but next class starts within 30 min
- **Yellow**: room is currently occupied but becomes free within 30 min
- Time `23:59` is used as a sentinel meaning "no more classes today" → displayed as "Open for the rest of the day"
