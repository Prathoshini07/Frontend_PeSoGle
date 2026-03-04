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

3. Create a `.env` file in the root directory:
```bash
echo "EXPO_PUBLIC_API_URL=http://localhost:8080" > .env
```

4. Install dependencies:

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

- **Mobile Testing (Expo Go)**: The app automatically detects your computer's local IP address to connect to the backend. Ensure your phone and computer are on the **same Wi-Fi network**.
- If the automatic detection fails, you can manually set the API URL in the `.env` file:
  ```bash
  EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_IP>:8080
  ```
- Use tunnel mode if necessary: `bun run start -- --tunnel`
- Clear cache: `bunx expo start --clear`

## Resources

- Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/docs/getting-started
