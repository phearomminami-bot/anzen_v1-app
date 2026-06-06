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
