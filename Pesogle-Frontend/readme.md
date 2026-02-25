# Pesogle Frontend

Pesogle Frontend is the Expo + React Native TypeScript client for the Pesogle app.

## Project Overview

- Platform: iOS, Android, and Web (via Expo)
- Framework: Expo Router, React Native, TypeScript

## Requirements

- Node.js (LTS)
- Bun (or npm / yarn)
- Expo CLI or EAS CLI for native builds

## Getting Started

1. Clone the repository:

```bash
git clone <YOUR_GIT_URL>
cd Pesogle-Frontend
```

2. Install dependencies:

```bash
bun i
# or: npm install
```

3. Run in development:

```bash
# Start dev server
bun run start

# Web preview
bun run start-web

# iOS simulator
bun run start -- --ios
```

## Useful Scripts

- `start` — start development server
- `start-web` — run web preview
- `build` — build production bundle (use EAS for native builds)

## Project Structure

High-level layout:

```
app/                # App screens (Expo Router)
assets/             # Static assets (images, icons)
components/         # Reusable UI components
constants/          # Theme and constants
services/           # API and business logic services
package.json        # Dependencies and scripts
tsconfig.json       # TypeScript configuration
```

## Contributing

Contributions are welcome. Open an issue or submit a pull request and follow the existing code style.

## Troubleshooting

- If the app does not load on your device, ensure your computer and device are on the same network.
- Use tunnel mode if necessary: `bun run start -- --tunnel`
- Clear cache: `bunx expo start --clear`

## Resources

- Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/docs/getting-started
