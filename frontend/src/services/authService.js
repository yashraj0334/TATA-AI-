// Authentication service — frontend-only demo implementation.
// No backend connectivity. Session state is stored in localStorage.

const defaultUser = { name: 'Legal Reviewer', role: 'Reviewer', initials: 'LR' };

const SESSION_KEY = 'ldi_session';

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default {
  async login(email, password) {
    // Frontend-only demo: accept any non-empty email/password.
    const user = {
      ...defaultUser,
      email,
      token: 'demo-token',
      loginAt: new Date().toISOString(),
    };
    setSession(user);
    return user;
  },

  async signup(name, email, password) {
    // Frontend-only demo: create a local user.
    const user = {
      name,
      email,
      role: 'Legal Counsel',
      initials: name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      token: 'demo-token',
      loginAt: new Date().toISOString(),
    };
    setSession(user);
    return user;
  },

  async logout() {
    // Frontend-only demo: clear local session.
    clearSession();
  },

  async forgotPassword(email) {
    // Frontend-only demo: simulate success.
    return { success: true, email };
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },
};
