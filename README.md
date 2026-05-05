# WhisperBox Stage 4B

WhisperBox is a branded, light/dark-ready frontend shell for an end-to-end encrypted messaging product. This first stage focuses on the public landing page, secure auth entry points, and a polished app preview so the project already feels like a real product.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- React Router
- Context-based auth and theme state
- Bun for local development and dependency management

## What’s Included

- Landing page with product branding, trust cues, and messaging-style visuals
- Auth page with sign-in and sign-up tabs, loading states, validation, and demo fallback behavior
- Product preview shell that resembles a real conversation workspace
- Light and dark mode with custom glassmorphism-inspired surfaces
- API-ready auth service pointed at the WhisperBox backend

## Setup

1. Install dependencies with `bun install`.
2. Copy `env.example` to `.env` and set `VITE_API_BASE_URL` if you want to point at the live backend.
3. Run the app with `bun run dev`.
4. Build for production with `bun run build`.

## Environment

Use `env.example` as the template for local configuration:

- `VITE_API_BASE_URL=https://whisperbox.koyeb.app`

## Notes

- Session data is kept in `sessionStorage` rather than `localStorage`.
- Theme preference is stored locally and is safe to persist.
- The UI is intentionally designed to feel calm, secure, and modern in both themes.
- Later stages can plug in the encryption flow, conversation list, and live messaging without reworking the layout foundation.
