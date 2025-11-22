# RecoveryGo

RecoveryGo is an Expo + React Native application that pairs patients with doctors to create, monitor, and adapt physical therapy routines. The app provisions authentication, onboarding, plan creation, progress logging, and AI-assisted routines so injured athletes, seniors, or general users can follow structured recovery plans while sharing progress with medical professionals.

## Feature Highlights

- **Authentication & Onboarding** – Email/password and Google sign-in (`app/index.tsx`) backed by Firebase Auth plus an onboarding flow (`app/onboarding.tsx`) that captures profile metadata and routes users into the patient or doctor tab navigator.
- **Patient Experience** – Dashboards (`app/patient/dashboard.tsx`) surface daily routines, AI/generated plans, invite management, and a progress tracker that persists completion data via `src/utils/dailyLog.ts`. Patients can also review historical progress (`app/patient/progress.tsx`), browse plans, and build routines manually.
- **Doctor Workspace** – Doctors have their own tab experience (`app/doctor`) with quick actions, the ability to invite or approve patients, monitor shared progress, and assign routines or AI plans through `app/doctor/patients.tsx`.
- **AI Generated Plans** – Both account types share the `app/components/AI_Plans/Plans.tsx` experience that calls OpenAI (`EXPO_PUBLIC_OPENAI_API_KEY`) to draft structured programs and persists them to Firestore via `src/utils/generatedPlans.ts`.
- **Manual Builder & Library** – `app/components/routineBuilder.tsx` powers manual plan creation/editing (used by `/patient/manual-builder`, `/doctor/create`, and `/routines/*`). Saved routines can be reused, edited, or assigned to connected users.
- **Doctor ↔ Patient Links** – `src/utils/doctorPatients.ts` models invites, active connections, and progress syncing so that doctors only see patients who accepted their invite and explicitly share progress.

## Tech Stack

- [Expo 54](https://docs.expo.dev/) with Expo Router for navigation and platform tooling.
- React Native 0.81 & React 19 UI runtime with TypeScript everywhere.
- Firebase Auth + Firestore for authentication, plan storage, and patient/doctor relationships (`firebase/firebaseConfig.ts`).
- AsyncStorage for local profile caching and quick reads.
- OpenAI GPT-4o-mini (via REST) for AI plan creation.
- ESLint (`npm run lint`) for static analysis.

## Directory Layout

```
RecoveryGo/
├── app/                      # Expo Router routes and screens
│   ├── index.tsx             # Auth entry screen
│   ├── onboarding.tsx        # Profile & account-type onboarding
│   ├── patient/              # Patient tabs (dashboard, progress, plans, etc.)
│   ├── doctor/               # Doctor tabs (dashboard, patients, plans, etc.)
│   ├── routines/             # Shared routine library/editor routes
│   └── components/           # Shared UI (AI plans, settings, routine builder)
├── firebase/firebaseConfig.ts# Firebase bootstrap pulling EXPO_PUBLIC_* vars
├── src/
│   ├── utils/                # Firestore helpers (daily logs, routines, invites)
│   ├── exercise.ts           # Exercise type shared by builders
│   └── types.ts              # Profile + user type definitions
├── assets/                   # Icons, splash, and branding
├── app.config.ts             # Typed Expo config + env plumbing
├── package.json              # Scripts and dependency manifest
└── README.md
```

## Getting Started

### 1. Requirements

- Node.js 18+ and npm 9+ (aligns with Expo SDK 54 support matrix).
- Expo CLI (bundled with `npx expo` so no global install required).
- Android Studio emulator, iOS Simulator, or the Expo Go mobile app for device testing.

### 2. Install dependencies

```bash
npm install
```

If the repo was cloned onto a new machine remember to trust/accept the Expo postinstall prompts the first time `npm install` runs.

### 3. Configure environment variables

Firebase and OpenAI credentials are injected at build time via Expo public env vars. Create an `.env` file (or use your shell / CI secrets) with:

```bash
# .env
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=0000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:0000000000:web:xxxxxxxxxxxx

# Enables AI plan generation in app/components/AI_Plans/Plans.tsx
EXPO_PUBLIC_OPENAI_API_KEY=sk-********************************
```

- Expo automatically loads `.env` files when the `EXPO_PUBLIC_` prefix is used. Restart `npx expo start` whenever these change.
- `EXPO_PUBLIC_OPENAI_API_KEY` is optional but required for the “Generate & Save” button in the plans screen. Without it, users can still create manual routines.

### 4. Start the development server

```bash
npx expo start
```

Use the CLI QR code for Expo Go, press `a` for Android, `i` for iOS, or `w` for the web preview. Expo will hot-reload TypeScript/TSX files inside `app/` and `src/`.

### 5. Useful npm scripts

| Command           | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `npm run android`| Start Expo bundler and launch the configured Android emulator.          |
| `npm run ios`    | Start Expo bundler and launch iOS Simulator (macOS only).               |
| `npm run web`    | Run the Expo web build for quick layout debugging.                      |
| `npm run lint`   | ESLint using the Expo config; helpful before commits/PRs.               |

## Firebase & Data Model Notes

Firestore collections referenced throughout the app:

- `users` – Populated in `src/utils/userDoc.ts` when a user signs in or completes onboarding. Stores profile metadata, onboarding flag, and doctor/patient type.
- `routines` – Manual routines saved by either account type through `src/utils/userRotuines.ts`.
- `generatedPlans` – AI-authored plans saved via `src/utils/generatedPlans.ts`.
- `dailyLog` – Session documents (`session_<uid>`) and per-day entries used by `src/utils/dailyLog.ts` to track exercise completion/progress bars.
- `patients` – Doctor ↔ patient link/invite docs managed in `src/utils/doctorPatients.ts`, powering invites and plan assignment.

If you use the Firebase Emulator Suite remember to set `FIRESTORE_EMULATOR_HOST` before launching Expo, otherwise the default config will speak to production.

## Development Tips

- **Manual builder shortcuts** – Pass `?draft=<serialized plan>` to `/patient/manual-builder` or `/doctor/create` to prefill the builder from an AI-generated plan (see how `Plans.tsx` handles this).
- **Assigning plans to patients** – A doctor can only assign to linked patients with status `active`. Ensure patient invites are accepted (`app/patient/dashboard.tsx` modal) before testing assignment flows.
- **Daily log consistency** – When editing routines during a live session, use the helper functions in `src/utils/dailyLog.ts` (`startOrReplacePlanSession`, `ensureTodayEntry`, etc.) so the dashboard and progress charts remain in sync.
- **OpenAI errors** – The generator uses the REST API via `fetch`. Missing/invalid API keys or non-2xx responses are surfaced through `Alert.alert`. Check Metro logs for raw responses while debugging.

## Troubleshooting

- **Blank screen after sign-in** – Confirm Firestore has the `users/{uid}` document with `onboarded: true` and the `userType` set; otherwise `app/index.tsx` will keep redirecting to `/onboarding`.
- **AI plan generation stuck** – Verify `EXPO_PUBLIC_OPENAI_API_KEY` is accessible in the Expo runtime (`console.log(process.env.EXPO_PUBLIC_OPENAI_API_KEY)` in `Plans.tsx`) and that the device/emulator has network access.
- **Doctor invite not visible** – Invitations match on either `invitedEmail` or `patientUid`. Make sure the patient account email matches the invited address, or accept the invite from the same authenticated user before re-running.

Happy building! If you add new flows, keep the README in sync so other contributors understand how to run and test their changes.
