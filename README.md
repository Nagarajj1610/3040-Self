# 3040 Self

A mobile-friendly, carbon-tracking companion application designed to help users understand, monitor, and lower their personal transport carbon footprint. Rather than just offering sterile calculators, the app brings the environmental impact to life using a mood-reactive, pure CSS mascot companion whose emotional state shifts based on the user's rolling 3-day carbon average. It also utilizes Gemini to provide personalized educational tips after each trip log.

## 🔗 Links
- Live app: https://self-3040-303550323430.us-central1.run.app
- Problem statement mapping: see [PROBLEM_STATEMENT.md](file:///PROBLEM_STATEMENT.md)

## 📋 What This App Does
- User logs a trip (from, to, transport mode, distance)
- App calculates real carbon impact using fixed, published emission coefficients
- A companion character's mood reflects the user's rolling carbon trend (3-day average)
- Gemini generates a personalized educational fact card after each trip
- User can view trip history and track logging streaks

## 🏗️ Tech Stack
- React — frontend framework, chosen for component-based UI
- Firebase Auth — handles user sign-in via email link (Magic Link), no custom password storage needed
- Firestore — stores trip data, scoped per user
- Gemini API — generates the per-trip fact card, called client-side with a restricted API key
- Cloud Run — hosts the deployed app container

## 🚀 Running This Locally
1. Clone the repo: `git clone https://github.com/Nagarajj1610/3040-Self.git`
2. Navigate into it: `cd 3040-Self`
3. Install dependencies: `npm install`
4. Copy the environment template: `cp .env.example .env`
5. Fill in your own values in `.env` (see Environment Variables below — never use someone else's real keys)
6. Start the dev server: `npm run dev`
7. Open the URL shown in your terminal (typically `http://localhost:5173`)

## 🔑 Environment Variables

| Variable | What it's for | Where to get it |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project connection | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Application ID | Firebase Console → Project Settings |
| `VITE_GEMINI_API_KEY` | Gemini fact-card generation | Google AI Studio / Cloud Console, restricted by HTTP referrer |

## 🔒 Security Notes
- The Gemini API key is restricted to this app's domain via HTTP referrer restriction in Google Cloud Console — it cannot be used from any other website even if someone finds it in the client bundle.
- Firestore security rules restrict every read/write to the authenticated user's own data — no user can read another user's trips.
- No password is ever stored — authentication is handled entirely by Firebase Auth via email link.

## 🧪 Testing
- Run tests: `npm test`
- Carbon calculation logic and streak calculation are unit tested, since these are pure functions with deterministic expected outputs.

## 📁 Project Structure
```
src/
├── components/     # UI components (forms, mascot, cards)
├── context/        # Auth context
├── lib/
│   ├── carbonMath.js   # deterministic CO2 calculation, pure function
│   └── gemini.js       # Gemini API call wrapper
├── pages/          # the 4 main app pages (Dashboard, LogTrip, History, Streaks)
├── utils/
│   ├── carbonMath.js   # unit tested carbon calculator
│   └── streakCalc.js   # unit tested streak calculation
└── firebase.js     # Firebase initialization and config
```

## 🙋 Known Limitations / Out of Scope
- Trip distance is entered manually rather than auto-calculated via Maps, to avoid an additional API integration risk within the build timeline.
- Voice input/output and an end-of-day reflection feature were considered but deferred to keep the core experience fully verified and working.

## 📄 License
Not yet licensed — all rights reserved by the author pending challenge submission requirements.
