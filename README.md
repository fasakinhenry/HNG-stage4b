# WhisperBox 🔐

> End-to-end encrypted messaging app. The server stores only ciphertext — only you can read your messages.

## Tech Stack
- React 19 + Vite 8 + TypeScript 6
- Tailwind CSS v4 (Neumorphic design system, light/dark mode)
- Framer Motion, React Router v7
- **Crypto**: Web Crypto API — no third-party crypto libs

## Quick Start
```bash
npm install
cp .env.example .env
npm run dev
```

## Folder Structure
```
src/
├── components/ui/       # Button, Input, Avatar, Logo, Toast, ThemeToggle
├── components/chat/     # ChatWindow
├── context/             # AuthContext, ThemeContext
├── layouts/             # AuthLayout, ChatLayout
├── lib/                 # api.ts, crypto.ts
├── pages/               # LandingPage, LoginPage, RegisterPage
└── types/               # Shared TS types
```

## Encryption Flow

**Registration**: RSA-OAEP 2048-bit keypair → private key wrapped with PBKDF2-derived AES-KW → sent to server as ciphertext only.

**Login**: Re-derive wrapping key from password → unwrap private key into non-extractable in-memory CryptoKey.

**Send**: Generate ephemeral AES-GCM key per message → encrypt plaintext → RSA-encrypt the AES key for recipient (and for self) → server stores opaque payload.

**Receive**: RSA-decrypt AES key with private key → AES-GCM decrypt ciphertext → render plaintext.

## Key Management
| Key | Storage | Extractable |
|-----|---------|-------------|
| RSA Public Key | Server DB | Yes |
| RSA Private Key (wrapped) | Server DB (AES-KW ciphertext) | N/A |
| RSA Private Key (live) | JS heap CryptoKey only | **No** |
| Per-message AES key | Never stored | Ephemeral only |

## Security Notes
- 250,000 PBKDF2 iterations (SHA-256) for key derivation
- Non-extractable CryptoKey prevents XSS exfiltration
- encryptedKeyForSelf enables sender to read own messages
- Known limits: no forward secrecy, no key rotation, single-device

## Env
```
VITE_API_BASE_URL=https://whisperbox.koyeb.app
```
