# SecureVault

SecureVault is an encrypted password manager designed with a zero-knowledge approach using client-side encryption.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Clerk Auth
- Prisma
- PostgreSQL
- Web Crypto API

## Security Goal

The server should never store plaintext vault passwords or the user's master password.

## MVP Features

- Authentication
- Master password unlock flow
- Client-side encryption
- Encrypted vault CRUD
- Password generator
- Password strength checker
- Breach check
- Audit logs
- Auto-lock