# Backend Migration — recovered blueprints & replication contract

This folder captures everything needed to rebuild the CYBERNETIC's / ERU
backend on infrastructure you control, so the app no longer depends on Base44's
hosted backend.

## What's here

- **`entities-full/`** — all **139** entity schemas exported live from the
  Base44 app (`69cd26bdd3ed52f2bb2ce965`), each with its full `properties`,
  `required`, and `rls` (row-level security) rules. **109 of these existed only
  on Base44** and were not in `src/entities/` — they are recovered here.

The backend **functions** (65) already live in the repo at
`base44/functions/*/entry.ts` with full source — nothing to recover there.

## The API contract to replicate

All 1,026 SDK call sites go through the single `base44` client
(`src/api/base44Client.js`). Reimplementing that one object against a new
backend frees the whole app without touching call sites. Surface actually used:

| Namespace | Uses | Methods |
|---|---|---|
| `entities.<Name>` | 800 | `list, filter, create, bulkCreate, update, delete, read, get, subscribe` |
| `auth` | 97 | `me, updateMe, login (email/otp/oauth), register, logout, isAuthenticated, verifyOtp, resendOtp, resetPassword, resetPasswordRequest, setToken, redirectToLogin` |
| `functions` | 58 | `invoke(name, payload)` |
| `integrations.Core` | 51 | `InvokeLLM` (41), `UploadFile` (10) |
| `asServiceRole` | 19 | privileged entity access — **server-side only** |
| `connectors` | 4 | external connector access |

## Mapping to a self-hosted stack (Supabase-shaped)

- entities → Postgres tables; `list/filter/get/read` → PostgREST selects;
  `create/bulkCreate/update/delete` → writes; `subscribe` → Realtime.
- `rls` blocks → native Postgres RLS policies (near 1:1).
- `auth.*` → Supabase Auth.
- `functions.invoke` → Edge Functions (port `base44/functions/*/entry.ts`).
- `integrations.Core.InvokeLLM` → edge function calling the model provider.
- `integrations.Core.UploadFile` → Storage bucket.
- `asServiceRole` → service-role client, **only** inside edge functions, never
  shipped to the browser.

The rebuild swaps `src/api/base44Client.js` for a drop-in client exposing this
exact interface. Nothing else in the frontend changes.
