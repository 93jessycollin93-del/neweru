// ---------------------------------------------------------------------------
// base44-compat.js — a drop-in replacement for the Base44 SDK client.
//
// This is the keystone of the migration. All 1,026 call sites in the app go
// through the single `base44` object exported from src/api/base44Client.js.
// This module re-exposes the EXACT same interface Base44 provided —
//   base44.entities.<Name>.{list,filter,create,bulkCreate,update,delete,read,get,subscribe}
//   base44.auth.{me,updateMe,login...,logout,isAuthenticated,...}
//   base44.functions.invoke(name, payload)
//   base44.integrations.Core.{InvokeLLM, UploadFile}
//   base44.asServiceRole.entities.<Name>...
// — but backed by our own Postgres (via supabase-js). Swap base44Client.js to
// import from here and the entire frontend keeps working, untouched.
//
// Method signatures mirror Base44's:
//   Entity.list(sort?, limit?, skip?)              -> Promise<record[]>
//   Entity.filter(criteria, sort?, limit?, skip?)  -> Promise<record[]>
//   Entity.get(id) / Entity.read(id)               -> Promise<record>
//   Entity.create(data)                            -> Promise<record>
//   Entity.bulkCreate(data[])                      -> Promise<record[]>
//   Entity.update(id, data)                        -> Promise<record>
//   Entity.delete(id)                              -> Promise<void>
//   Entity.subscribe(cb)                           -> unsubscribe()
//   sort is a string: 'field' (asc) or '-field' (desc), same as Base44.
// ---------------------------------------------------------------------------

// Entity name (PascalCase) -> table name (snake_case). MUST match the mapping
// used by generate-schema.mjs so entity ⇄ table stays consistent.
function toSnake(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

// Apply a Base44-style sort string to a supabase query builder.
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const col = desc ? sort.slice(1) : sort;
  return query.order(col, { ascending: !desc });
}

// Apply a Base44-style filter criteria object. Base44 supports plain equality
// and a small operator set; we translate the common ones. Extend as needed.
function applyCriteria(query, criteria = {}) {
  for (const [key, val] of Object.entries(criteria)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('$in' in val) query = query.in(key, val.$in);
      else if ('$gt' in val) query = query.gt(key, val.$gt);
      else if ('$gte' in val) query = query.gte(key, val.$gte);
      else if ('$lt' in val) query = query.lt(key, val.$lt);
      else if ('$lte' in val) query = query.lte(key, val.$lte);
      else if ('$ne' in val) query = query.neq(key, val.$ne);
      else if ('$contains' in val) query = query.contains(key, val.$contains);
      else query = query.eq(key, val);
    } else if (Array.isArray(val)) {
      query = query.in(key, val);
    } else {
      query = query.eq(key, val);
    }
  }
  return query;
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || String(error));
  return data;
}

// Build the entities proxy. `db` is a supabase-js client (anon or service role).
function makeEntities(db) {
  const cache = new Map();
  return new Proxy({}, {
    get(_t, entityName) {
      if (typeof entityName !== 'string') return undefined;
      if (cache.has(entityName)) return cache.get(entityName);
      const table = toSnake(entityName);

      const api = {
        async list(sort, limit, skip = 0) {
          let q = db.from(table).select('*');
          q = applySort(q, sort);
          if (limit) q = q.range(skip, skip + limit - 1);
          return unwrap(await q) || [];
        },
        async filter(criteria, sort, limit, skip = 0) {
          let q = db.from(table).select('*');
          q = applyCriteria(q, criteria);
          q = applySort(q, sort);
          if (limit) q = q.range(skip, skip + limit - 1);
          return unwrap(await q) || [];
        },
        async get(id) {
          return unwrap(await db.from(table).select('*').eq('id', id).single());
        },
        async read(id) { return api.get(id); },
        async create(data) {
          return unwrap(await db.from(table).insert(data).select().single());
        },
        async bulkCreate(rows) {
          return unwrap(await db.from(table).insert(rows).select()) || [];
        },
        async update(id, data) {
          const patch = { ...data, updated_date: new Date().toISOString() };
          return unwrap(await db.from(table).update(patch).eq('id', id).select().single());
        },
        async delete(id) {
          unwrap(await db.from(table).delete().eq('id', id));
        },
        // Realtime — mirrors Base44's Entity.subscribe(cb). Returns an
        // unsubscribe function. Fires cb on every insert/update/delete.
        subscribe(cb) {
          const channel = db
            .channel(`rt_${table}_${Math.random().toString(36).slice(2)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
              cb({ type: payload.eventType, record: payload.new, old: payload.old });
            })
            .subscribe();
          return () => db.removeChannel(channel);
        },
      };
      cache.set(entityName, api);
      return api;
    },
  });
}

// Auth surface — mirrors base44.auth.*
function makeAuth(db) {
  return {
    async me() {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // Base44's me() returned a merged profile; we surface the auth user plus
      // any app-level `user` row keyed by email.
      const email = user.email;
      const { data: profile } = await db.from('user').select('*').eq('email', email).maybeSingle();
      return { id: user.id, email, ...(profile || {}) };
    },
    async updateMe(patch) {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return unwrap(
        await db.from('user').update({ ...patch, updated_date: new Date().toISOString() })
          .eq('email', user.email).select().single()
      );
    },
    async isAuthenticated() {
      const { data: { session } } = await db.auth.getSession();
      return !!session;
    },
    async loginViaEmailPassword(email, password) {
      return unwrap(await db.auth.signInWithPassword({ email, password }));
    },
    async register(email, password, meta) {
      return unwrap(await db.auth.signUp({ email, password, options: { data: meta } }));
    },
    async loginWithProvider(provider) {
      return unwrap(await db.auth.signInWithOAuth({ provider }));
    },
    async logout() { return db.auth.signOut(); },
    async resetPasswordRequest(email) { return db.auth.resetPasswordForEmail(email); },
    async resetPassword(newPassword) { return db.auth.updateUser({ password: newPassword }); },
    async verifyOtp(email, token) { return unwrap(await db.auth.verifyOtp({ email, token, type: 'email' })); },
    async resendOtp(email) { return db.auth.resend({ type: 'signup', email }); },
    async setToken() { /* handled by supabase session persistence */ },
    redirectToLogin() { window.location.href = '/login'; },
  };
}

// Serverless functions — base44.functions.invoke(name, payload) -> edge function.
function makeFunctions(db) {
  return {
    async invoke(name, payload) {
      const { data, error } = await db.functions.invoke(name, { body: payload });
      if (error) throw new Error(error.message || String(error));
      return { data };
    },
  };
}

// Integrations.Core — InvokeLLM + UploadFile, routed through edge functions /
// storage so no provider keys ever reach the browser.
function makeIntegrations(db) {
  return {
    Core: {
      async InvokeLLM(args) {
        const { data, error } = await db.functions.invoke('invokeLLM', { body: args });
        if (error) throw new Error(error.message || String(error));
        return data;
      },
      async UploadFile({ file }) {
        const path = `uploads/${Date.now()}_${file.name}`;
        const { error } = await db.storage.from('uploads').upload(path, file);
        if (error) throw new Error(error.message);
        const { data } = db.storage.from('uploads').getPublicUrl(path);
        return { file_url: data.publicUrl };
      },
    },
  };
}

/**
 * createClient — construct a Base44-compatible client.
 * @param {object} db          anon supabase-js client (RLS-enforced, browser-safe)
 * @param {object} [serviceDb] service-role supabase-js client (server-only!)
 */
export function createCompatClient(db, serviceDb) {
  const client = {
    entities: makeEntities(db),
    auth: makeAuth(db),
    functions: makeFunctions(db),
    integrations: makeIntegrations(db),
    connectors: {},
  };
  // asServiceRole bypasses RLS — must NEVER run in the browser. Guard hard.
  Object.defineProperty(client, 'asServiceRole', {
    get() {
      if (typeof window !== 'undefined') {
        throw new Error('asServiceRole is server-only and must not run in the browser.');
      }
      if (!serviceDb) throw new Error('No service-role client configured.');
      return { entities: makeEntities(serviceDb), functions: makeFunctions(serviceDb) };
    },
  });
  return client;
}
