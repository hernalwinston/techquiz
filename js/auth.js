// ============================================================
// AUTHENTICATION MODULE (Supabase)
// ============================================================
const Auth = {
  currentUser: null,
  isAdmin: false,

  init() {
    return new Promise((resolve) => {
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          this.currentUser = session.user;
          this.checkAdminStatus(session.user.id).then(() => resolve(session.user));
        } else {
          this.currentUser = null;
          this.isAdmin = false;
          resolve(null);
        }
      }).catch(err => {
        console.error('Auth init error:', err);
        this.currentUser = null;
        this.isAdmin = false;
        resolve(null);
      });
    });
  },

  // ---- ADMIN: Register (via setup-admin.html) ----
  async registerAdmin(email, password, displayName) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user created");

      const { error: adminError } = await supabaseClient.from("admins").insert({
        id: data.user.id,
        email: email,
        display_name: displayName,
        role: "admin"
      });
      if (adminError) throw adminError;

      if (!data.session) {
        const { error: signInErr } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (signInErr) console.warn("Auto sign-in note:", signInErr.message);
      }

      this.currentUser = data.user;
      this.isAdmin = true;
      return { success: true, uid: data.user.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ---- ADMIN: Login ----
  async loginAdmin(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) throw error;

      const { data: adminRow, error: adminErr } = await supabaseClient
        .from("admins")
        .select("id, display_name, email")
        .eq("id", data.user.id)
        .maybeSingle();

      if (adminErr) throw adminErr;
      if (!adminRow) {
        await supabaseClient.auth.signOut();
        return { success: false, error: "This account is not an admin. Go to setup-admin.html first." };
      }

      this.currentUser = data.user;
      this.isAdmin = true;
      return { success: true, uid: data.user.id, admin: adminRow };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ---- STUDENT: Register ----
  async registerStudent(name, yearSection) {
    try {
      const email = "student_" + Date.now() + "@quizbattle.app";
      const password = "QB_" + Date.now() + "!";

      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { name: name } }
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user created");

      const { error: profileErr } = await supabaseClient.from("user_profiles").upsert({
        id: data.user.id,
        name: name,
        year_section: yearSection,
        is_guest: false,
        total_points: 0,
        games_played: 0
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (profileErr) console.warn("Profile note:", profileErr.message);

      localStorage.setItem("qb_credentials", JSON.stringify({ email, password }));
      localStorage.setItem("qb_profile", JSON.stringify({
        id: data.user.id,
        name: name,
        yearSection: yearSection
      }));

      if (!data.session) {
        const { error: signInErr } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (signInErr) console.warn("Auto sign-in note:", signInErr.message);
      }

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        this.currentUser = session.user;
      } else {
        this.currentUser = data.user;
      }
      this.isAdmin = false;

      return { success: true, uid: data.user.id, email, password };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ---- STUDENT: Login using stored credentials ----
  async loginStudent() {
    try {
      const creds = JSON.parse(localStorage.getItem("qb_credentials"));
      if (!creds) return { success: false, error: "No saved account. Please register first." };

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });
      if (error) throw error;

      this.currentUser = data.user;
      this.isAdmin = false;
      return { success: true, uid: data.user.id };
    } catch (error) {
      localStorage.removeItem("qb_credentials");
      localStorage.removeItem("qb_profile");
      return { success: false, error: error.message };
    }
  },

  // ---- GUEST: Quick join ----
  async guestLogin(name) {
    try {
      const email = "guest_" + Date.now() + "@quizbattle.app";
      const password = "Guest_" + Date.now() + "!";

      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { name: name } }
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user created");

      const { error: profileErr } = await supabaseClient.from("user_profiles").upsert({
        id: data.user.id,
        name: name,
        is_guest: true,
        total_points: 0,
        games_played: 0
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (profileErr) console.warn("Profile note:", profileErr.message);

      if (!data.session) {
        const { error: signInErr } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (signInErr) console.warn("Auto sign-in note:", signInErr.message);
      }

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        this.currentUser = session.user;
      } else {
        this.currentUser = data.user;
      }
      this.isAdmin = false;

      return { success: true, uid: data.user.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async checkAdminStatus(uid) {
    try {
      const { data } = await supabaseClient
        .from("admins")
        .select("id")
        .eq("id", uid)
        .maybeSingle();
      this.isAdmin = !!data;
      return !!data;
    } catch {
      this.isAdmin = false;
      return false;
    }
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.currentUser = null;
    this.isAdmin = false;
    localStorage.removeItem("qb_credentials");
    localStorage.removeItem("qb_profile");
  }
};
