# Drop-in backend client

`base44-compat.js` re-exposes the exact Base44 SDK interface, backed by our own
Postgres (via `supabase-js`). Swapping to it frees all 1,026 call sites without
editing any of them.

## How to wire it (when the new backend is live)

1. Install the driver: `npm i @supabase/supabase-js`
2. Replace the body of `src/api/base44Client.js` with:

```js
import { createClient as createSupabase } from '@supabase/supabase-js';
import { createCompatClient } from '../../MIGRATION/backend-client/base44-compat';

const db = createSupabase(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Service-role client is server-only — never ship the service key to the browser.
export const base44 = createCompatClient(db);
```

Everything else in the app keeps importing `{ base44 }` and works unchanged.

## Interface parity

| base44 surface | Backed by |
|---|---|
| `entities.<Name>.list/filter/get/read` | PostgREST select (RLS-enforced) |
| `entities.<Name>.create/bulkCreate/update/delete` | PostgREST writes |
| `entities.<Name>.subscribe(cb)` | Realtime `postgres_changes` |
| `auth.*` | Supabase Auth |
| `functions.invoke(name, payload)` | Edge Functions |
| `integrations.Core.InvokeLLM` | `invokeLLM` edge function (keys server-side) |
| `integrations.Core.UploadFile` | Storage bucket `uploads` |
| `asServiceRole` | service-role client, **server-only** (throws in browser) |

## Still to port (tracked, not blocking)

- The 65 backend functions in `base44/functions/*/entry.ts` → Edge Functions.
- `integrations.Core.InvokeLLM` needs an `invokeLLM` edge function wrapping the
  model provider.
- `filter()` operator coverage: common ops (`$in/$gt/$gte/$lt/$lte/$ne/$contains`)
  are mapped; add any exotic ones surfaced during testing.
