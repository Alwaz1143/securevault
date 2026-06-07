# SecureVault — Encrypted Password Manager

SecureVault is a full-stack encrypted password manager designed with a zero-knowledge-inspired approach using client-side encryption.

The goal of this project is to demonstrate secure full-stack development, authentication, database-backed application design, client-side encryption, password security tooling, and security-aware UX.

> Security wording: SecureVault is designed with a zero-knowledge approach using client-side encryption. It is not claimed to be a production-ready or perfect zero-knowledge password manager.

---

## Features

- User authentication with Clerk
- Protected dashboard routes
- Master password based vault unlock
- PBKDF2 key derivation using Web Crypto API
- AES-GCM client-side encryption and decryption
- Encrypted vault CRUD
- Master password verifier
- PostgreSQL database with Prisma ORM
- Password generator
- Password strength checker
- HaveIBeenPwned breach checker using k-anonymity
- Audit logs for security events
- Auto-lock after inactivity
- Security-focused dashboard

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Context API
- Web Crypto API

### Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Neon Database
- Clerk Auth

### Security Tools / APIs

- AES-GCM encryption
- PBKDF2 key derivation
- HaveIBeenPwned Pwned Passwords API

---

## Security Architecture

SecureVault separates authentication from vault encryption.

```text
Clerk Authentication
        ↓
User logs in
        ↓
User enters master password
        ↓
Browser derives encryption key using PBKDF2
        ↓
Vault item is encrypted using AES-GCM in the browser
        ↓
Only ciphertext and IV are sent to the backend
        ↓
PostgreSQL stores encrypted vault data
        ↓
When viewing vault items, encrypted data is fetched and decrypted locally
````

---

## Authentication vs Vault Encryption

Authentication answers:

```text
Who is the user?
```

Vault encryption answers:

```text
Can this user decrypt their vault?
```

SecureVault uses Clerk for authentication. Clerk manages signup, login, logout, sessions, and protected routes.

The master password is separate from Clerk login. It is used only in the browser to derive the encryption key for vault data.

The backend does not receive or store:

```text
master password
raw encryption key
plaintext vault password
decrypted vault data
```

---

## What Gets Stored in the Database

SecureVault stores app-specific user metadata, encrypted vault records, and audit logs.

Example vault item storage:

```text
id
userId
encryptedData
iv
createdAt
updatedAt
```

The database does not store:

```text
website title in plaintext
username in plaintext
password in plaintext
notes in plaintext
master password
encryption key
```

---

## Encryption Flow

When a user saves a vault item:

```text
Plain vault item
        ↓
JSON.stringify()
        ↓
AES-GCM encryption in browser
        ↓
ciphertext + IV
        ↓
API request
        ↓
PostgreSQL
```

When a user views a vault item:

```text
Encrypted vault item from database
        ↓
browser receives ciphertext + IV
        ↓
AES-GCM decrypts using in-memory CryptoKey
        ↓
plaintext shown only while vault is unlocked
```

---

## Key Derivation

SecureVault uses PBKDF2 through the Web Crypto API.

```text
master password + salt
        ↓
PBKDF2
        ↓
AES-GCM CryptoKey
```

The salt is stored in the database because it is not secret. Its purpose is to make derived keys unique even if two users choose the same master password.

The derived key is kept only in browser memory while the vault is unlocked.

---

## Master Password Verifier

SecureVault includes a master password verifier.

The verifier is an encrypted known value. When the user enters a master password, the browser derives a key and attempts to decrypt the verifier.

If decryption fails, the app rejects the master password.

This helps prevent the app from unlocking with any random password.

---

## HaveIBeenPwned Breach Check

SecureVault uses the HaveIBeenPwned Pwned Passwords range API.

The app does not send the full password to HaveIBeenPwned.

Flow:

```text
password
        ↓
SHA-1 hash in browser
        ↓
send first 5 hash characters only
        ↓
receive matching hash suffixes
        ↓
compare locally in browser
```

This technique is called k-anonymity.

The breach checker tells whether the exact password appears in known breach datasets. It does not guarantee that a password is perfect or impossible to guess.

---

## Audit Logs

SecureVault records important security events such as:

* Vault unlocked
* Vault locked
* Vault item created
* Vault item updated
* Vault item deleted
* Breach check performed

Audit logs intentionally do not store:

```text
master password
vault password
decrypted title
decrypted username
decrypted notes
full password hash
plaintext breach-check password
```

---

## Auto-Lock

SecureVault automatically locks the vault after inactivity.

When the vault locks:

```text
in-memory CryptoKey is removed from React state
vault UI returns to locked state
master password is required again
```

This reduces the risk of leaving decrypted vault access open in the browser.

JavaScript cannot guarantee perfect memory wiping, so the accurate claim is:

```text
SecureVault clears app-level access to the in-memory key.
```

Not:

```text
SecureVault perfectly wipes memory.
```

---

## Project Structure

```text
securevault/
│
├── app/
│   ├── dashboard/
│   ├── vault/
│   ├── tools/
│   ├── audit-logs/
│   ├── settings/
│   └── api/
│       ├── vault/
│       ├── user/security/
│       ├── audit-logs/
│       ├── dashboard/
│       └── health/db/
│
├── components/
│   ├── DashboardShell.tsx
│   ├── MasterPasswordUnlock.tsx
│   ├── VaultManager.tsx
│   ├── PasswordGeneratorPanel.tsx
│   ├── PasswordStrengthChecker.tsx
│   ├── PasswordBreachChecker.tsx
│   ├── AuditLogsTimeline.tsx
│   └── AutoLockSettings.tsx
│
├── contexts/
│   └── VaultContext.tsx
│
├── lib/
│   ├── crypto.ts
│   ├── prisma.ts
│   ├── current-user.ts
│   ├── audit.ts
│   ├── hibp.ts
│   ├── passwordGenerator.ts
│   └── passwordStrength.ts
│
├── prisma/
│   └── schema.prisma
│
└── README.md
```

---

## Environment Variables

Create `.env`:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

Never commit `.env` or `.env.local`.

---

## Getting Started

Install dependencies:

```bash
npm install
```

Run Prisma migration:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Prisma Commands

Validate schema:

```bash
npx prisma validate
```

Create migration:

```bash
npx prisma migrate dev --name migration_name
```

Generate client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Security Rules Followed

* Plaintext vault passwords are not stored
* Master password is not stored
* Master password is not sent to backend
* Encryption happens before API request
* Decryption happens only in browser
* Backend stores ciphertext and IV
* Sensitive values are not logged
* HIBP check does not send full password
* Auto-lock clears app-level access to the vault key
* Environment secrets are kept out of Git

---

## Current Limitations

SecureVault is an educational and portfolio project. It is not a production-ready password manager.

Known limitations:

* No secure account recovery flow
* No encrypted vault export/import yet
* No master password change and re-encryption flow yet
* No browser extension
* No passkey support yet
* No TOTP 2FA yet
* No formal penetration testing
* No independent security audit
* JavaScript cannot guarantee perfect memory wiping
* Client device compromise can still expose decrypted data

---

## Future Improvements

* TOTP two-factor authentication
* Passkey support
* Argon2 key derivation
* Encrypted vault export/import
* Master password change with full vault re-encryption
* Secure vault sharing using public-key cryptography
* Browser extension
* Recovery codes
* Device/session management
* Security testing checklist
* Deployment with HTTPS

---


> ## Disclaimer
> SecureVault is a portfolio and learning project designed to demonstrate secure application architecture concepts. It should not be used as a real production password manager without professional security review, hardened deployment, and extensive testing.

