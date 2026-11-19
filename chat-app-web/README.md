# NearbyChat Web

A modern React front-end for the **NearbyChat** application — discover people near you and chat in real time with text and voice messages.

## Tech Stack

- **React 18** + TypeScript (strict) + **Vite**
- **React Router v6** — client-side routing
- **TanStack Query** — server state management
- **Zustand** — auth & UI state
- **socket.io-client** — real-time messaging
- **Axios** — HTTP client
- **react-hook-form + zod** — form validation
- **Tailwind CSS** — styling (light & dark mode)

## Setup

```bash
# Install dependencies
npm install

# Create .env (already provided with defaults)
cp .env.example .env   # or just use the existing .env

# Start dev server
npm run dev
```

## Environment Variables

| Variable          | Default                        | Description                  |
| ----------------- | ------------------------------ | ---------------------------- |
| `VITE_API_URL`    | `http://localhost:3000/api`    | Backend REST API base URL    |
| `VITE_SOCKET_URL` | `http://localhost:3000`        | Socket.io server URL         |

## Testing with Two Users

1. Start the backend (`npm run start:dev` in the backend folder).
2. Start this frontend (`npm run dev`).
3. Open **http://localhost:5173** in a **normal browser window** and register **User A**.
4. Open **http://localhost:5173** in an **incognito/private window** and register **User B**.
5. Verify both emails (check Mailtrap or your mail provider).
6. Log in with both users.
7. Allow location access on both windows.
8. User A should see User B on the Nearby page (and vice versa, if within the configured radius).
9. Click **Message** to start chatting — messages appear in real time!

## Build

```bash
npm run build
```

The production bundle is output to `dist/`.

## Project Structure

```
src/
├── api/          # Axios instance + per-resource API modules
├── components/   # Shared UI components (Layout, Modal, AudioPlayer, etc.)
├── hooks/        # Custom hooks (geolocation, socket, intersection, audio)
├── lib/          # Shared singletons (QueryClient)
├── pages/        # Route-level page components
├── socket/       # Socket.io connection manager
├── store/        # Zustand stores (auth, toast, theme)
├── types/        # TypeScript interfaces for all API responses
└── utils/        # Formatting helpers, error extraction
```
