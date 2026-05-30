# Developer Portal

A calm, beautiful command center for developers who want their GitHub work, package ecosystem, security signals, and delivery activity in one place.

Developer Portal turns scattered engineering signals into a focused workspace: repositories, pull requests, CI/CD runs, advisories, releases, commits, npm package context, contribution history, and profile data, all wrapped in a GNOME-inspired interface that feels light enough for daily use.

## What It Does

- **GitHub-first dashboard** with repositories, followers, stars, and contribution activity.
- **Repository deep dives** for commits, pull requests, releases, workflows, branches, topics, files, and security advisories.
- **NPM package intelligence** surfaced from repository metadata and package APIs.
- **Developer activity views** for inbox, issues, pull requests, following, CI/CD, insights, advisory, profile, and apps.
- **Installable PWA experience** with runtime caching for GitHub, npm, Bundlephobia, and static assets.
- **Personalized appearance** with theme, accent color, and optional glass effects.
- **Local-first persistence** through IndexedDB and TanStack data primitives.
- **App monitoring hooks** for performance, network, events, and web vitals.

## The Shape Of The App

Developer Portal is designed around one simple idea: a developer should not need six tabs to understand what needs attention.

The main dashboard gives you the pulse. Repository pages give you the story. Security, CI/CD, issues, pull requests, and package metadata fill in the parts that usually live in separate tools.

```txt
GitHub account
  -> Dashboard
  -> Repositories
      -> Overview
      -> Commits
      -> Pull Requests
      -> Releases
      -> Workflows
      -> Security
      -> Branches
  -> Advisory / CI/CD / Inbox / Issues / Insights
  -> Local cache + PWA shell
```

## Tech Stack

- **React 19** for the application UI.
- **Vite 8** for development and production builds.
- **TanStack Router** for file-based routing.
- **TanStack Query / DB** for remote data and local collections.
- **Firebase Auth** for GitHub sign-in.
- **@api-hooks/gh** and **gh-api-client** for GitHub data.
- **@api-hooks/npm** and **@baphy/npm** for package intelligence.
- **@gnome-ui** packages for layout, components, charts, and icons.
- **vite-plugin-pwa** for the installable app shell and runtime caching.
- **Vitest** and Testing Library for tests.

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` with the Firebase values used by your app:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Then start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## GitHub Authentication

The app signs in through Firebase using the GitHub provider. The current GitHub scopes are:

- `gist`
- `read:user`
- `notifications`
- `repo`

Those scopes allow the portal to read repository data, profile data, notifications, and private repository information when the signed-in user grants access.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint across the project. |
| `npm run test` | Run Vitest. |
| `npm run test:ui` | Open the Vitest UI. |
| `npm run test:coverage` | Run tests with coverage reporting. |

## Project Map

```txt
src/
  auth/                 Firebase and GitHub sign-in flow
  blocks/github/        Reusable GitHub data blocks
  components/           Shared product and repository UI
  db/                   Local persistence and collection setup
  hooks/                App-specific data hooks
  lib/                  Formatting, settings, metrics, storage helpers
  routes/               TanStack Router pages and layouts
  test/                 Test setup and support files

public/
  icons/                App icons
  wallpapers/           Visual assets
  pwa-*.png             PWA icons

docs/
  architecture-npm-collection.md
```

## Design Notes

Developer Portal aims for an interface that is quiet, readable, and fast to scan. It borrows the best parts of native desktop tooling: clear navigation, compact density, subtle motion, dependable cards, and preference controls that feel like they belong in a real daily workspace.

It should feel less like a report and more like a cockpit: present, useful, and ready when there is something to inspect.

## License

MIT
