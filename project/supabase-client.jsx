// supabase-client.jsx — Supabase auth + client helpers
// Reads credentials from window.__ANZEN_SUPABASE (set in <head>).
// If the library or credentials are missing (offline/demo), everything
// degrades gracefully: window.__sbConfigured() returns false and the app
// falls back to the existing demo login.

(function () {
  const cfg = window.__ANZEN_SUPABASE || {};
  const hasLib   = !!(window.supabase && window.supabase.createClient);
  const hasCreds = cfg.url && cfg.anonKey
    && !/YOUR-/.test(cfg.url) && !/YOUR-/.test(cfg.anonKey);

  if (hasLib && hasCreds) {
    try {
      window.sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
    } catch (e) {
      console.error('[Anzen] Supabase init failed:', e);
    }
  }

  // Is real login available?
  window.__sbConfigured = () => !!window.sb;

  // ── Storage: upload an image/file (data URL) → returns a public URL ──────────
  // Moves big base64 blobs OUT of the synced DB rows, which is what drove the
  // egress overage before. Returns null when not connected or on any failure,
  // so every caller can safely fall back to keeping the base64 it already has.
  window.__sbUploadMedia = async (dataUrl, opts = {}) => {
    if (!window.sb || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const mime = blob.type || 'image/jpeg';
      const ext  = (mime.split('/')[1] || 'bin').split('+')[0].slice(0, 5);
      const safe = String(opts.name || 'f').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'f';
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${opts.folder || 'misc'}/${safe}-${Date.now()}-${rand}.${ext}`;
      const { error } = await window.sb.storage.from('media').upload(path, blob, { contentType: mime, upsert: true });
      if (error) throw error;
      const { data } = window.sb.storage.from('media').getPublicUrl(path);
      return (data && data.publicUrl) || null;
    } catch (e) {
      console.warn('[Anzen] media upload failed (kept inline):', e && e.message);
      return null;
    }
  };

  // One-time migration: find every inline base64 image/file in the dataset,
  // upload each to Storage and replace it with a URL. onProgress({done,total,
  // failed}) fires after every item. Safe to re-run (already-migrated URLs are
  // skipped). Returns { total, done, failed }.
  window.__migrateMediaToStorage = async (onProgress) => {
    if (!window.sb || !window.__sbUploadMedia) throw new Error('not-connected');
    const isB64 = (x) => typeof x === 'string' && x.startsWith('data:');
    const seen = new Set();   // object identity, so two devices/arrays sharing the same row aren't double-processed
    const tasks = [];
    const add = (folder, name, obj, field) => {
      if (!obj || !isB64(obj[field]) || seen.has(obj)) return;
      seen.add(obj);
      tasks.push({ folder, name, get: () => obj[field], set: (u) => { obj[field] = u; } });
    };
    (window.STUDENTS || []).forEach(s => {
      add('avatars', s.id, s, 'photo');
      (s.schoolDocs || []).forEach(d => add('docs', (s.id||'') + '-' + (d.fileName||'doc'), d, 'file'));
    });
    (window.VEHICLES   || []).forEach(v => add('photos',  v.id, v, 'photo'));
    (window.INSTRUCTORS || []).forEach(i => add('avatars', i.id, i, 'photo'));
    (window.STAFF       || []).forEach(p => add('avatars', p.id, p, 'photo'));
    (window.__staffData || []).forEach(p => add('avatars', p.id || 'st', p, 'photo'));
    add('logo', 'logo', (window.__schoolSettings || {}), 'logo');

    const total = tasks.length;
    let done = 0, failed = 0;
    if (onProgress) onProgress({ done, total, failed });
    for (const t of tasks) {
      try {
        const url = await window.__sbUploadMedia(t.get(), { folder: t.folder, name: t.name });
        if (url) { t.set(url); done++; } else failed++;
      } catch (e) { failed++; }
      if (onProgress) onProgress({ done, total, failed });
    }
    if (total > 0 && window.saveAllData) window.saveAllData();   // persist URLs + push
    return { total, done, failed };
  };

  // Load the profile row (role + linked_id) for the current auth user.
  window.__sbLoadProfile = async () => {
    if (!window.sb) return null;
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await window.sb
      .from('profiles')
      .select('role, linked_id, full_name, full_name_en')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('[Anzen] profile load error:', error.message);
      return { role: 'student' }; // safe default
    }
    return data;
  };

  // Sign in with email + password → returns { user, profile }.
  window.__sbSignIn = async (email, password) => {
    if (!window.sb) throw new Error('not-configured');
    const { data, error } = await window.sb.auth.signInWithPassword({
      email: (email || '').trim(),
      password: password || '',
    });
    if (error) throw error;
    const profile = await window.__sbLoadProfile();
    return { user: data.user, profile };
  };

  window.__sbSignOut = async () => {
    if (window.sb) { try { await window.sb.auth.signOut(); } catch (e) {} }
  };

  // Admin creates a login account for an instructor/student.
  // Uses a TEMPORARY client (persistSession:false) so the admin's own session
  // is NOT replaced by the new signup. Links the auth user to the domain record.
  window.__sbCreateUserAccount = async ({ email, password, role, fullName, linkedId }) => {
    if (!window.sb) throw new Error('not-configured');
    const cfg = window.__ANZEN_SUPABASE || {};
    const tmp = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await tmp.auth.signUp({
      email: (email || '').trim(),
      password: password || '',
      options: { data: { role, full_name: fullName, linked_id: linkedId } },
    });
    if (error) throw error;
    const userId = data.user && data.user.id;
    // Link the domain record so RLS (auth_user_id = auth.uid()) lets them in.
    if (userId && linkedId) {
      const table = role === 'instructor' ? 'instructors' : 'students';
      try { await window.sb.from(table).update({ auth_user_id: userId }).eq('id', linkedId); } catch (e) {}
    }
    return { userId, needsConfirm: !data.session };
  };

  // Existing session (for auto-login on reload).
  window.__sbSession = async () => {
    if (!window.sb) return null;
    const { data } = await window.sb.auth.getSession();
    return (data && data.session) || null;
  };
})();
