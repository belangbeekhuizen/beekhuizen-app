import { useState, useEffect, useRef } from "react";

const LOGO_SRC = "/logo.png";
const ICON_SRC = "/icon-192.png";

const APP_NAME = "Buurtapp Beekhuizen";
const APP_SLOGAN = "Samen maken we Beekhuizen mooier";
const APP_INITIATIVE = "Een initiatief van Belang Beekhuizen";

/**
 * Lichtgewicht storage-adapter die dezelfde API nabootst als window.storage
 * binnen Claude-artifacts, maar lokaal in de browser opslaat (localStorage).
 *
 * BELANGRIJK: dit is PER TOESTEL/BROWSER, niet gedeeld tussen bewoners.
 * Wil je dat berichten, DMs en het ledenoverzicht door alle bewoners
 * gezien worden, dan moet je dit vervangen door een echte backend zoals
 * Supabase (gratis te starten op supabase.com) of Firebase. Vervang dan
 * de functies hieronder door echte API/database-calls; de rest van de
 * app blijft ongewijzigd werken zolang de functienamen hetzelfde blijven.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

window.storage = {
  async get(key) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_storage?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await res.json();
    if (!data.length) throw new Error("Key not found: " + key);
    return { key, value: data[0].value, shared: true };
  },

  async set(key, value) {
    await fetch(`${SUPABASE_URL}/rest/v1/app_storage`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ key, value }),
    });
    return { key, value, shared: true };
  },

  async delete(key) {
    await fetch(`${SUPABASE_URL}/rest/v1/app_storage?key=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    return { key, deleted: true, shared: true };
  },

  async list(prefix) {
    return { keys: [], prefix, shared: true };
  },
};

const TOEGANGSCODE = "BEEKHUIZEN2026";
const BEHEERCODE = "BESTUUR2026";

const CATEGORIES = [
  { id: "all", label: "Alles", icon: "🌲" },
  { id: "hulp", label: "Hulp gevraagd", icon: "🤝" },
  { id: "ruilen", label: "Ruilen & Weggeven", icon: "🎁" },
  { id: "melding", label: "Meldingen", icon: "⚠️" },
  { id: "belangbeekhuizen", label: "Belang Beekhuizen", icon: "🌳" },
  { id: "activiteit", label: "Activiteiten", icon: "🎉" },
  { id: "info", label: "Info & Tips", icon: "💡" },
];
const STRATEN = [
  "Hele buurt",
  "Beekhuizenseweg", "Pinkenbergseweg", "Den Bruijl", "Van Tienhovenlaan", "Thijsselaan", "Beukenlaan 2", "Stalen Enk", "Alteveerselaan"]
  
const categoryMeta = {
  hulp:             { bg: "#FFF3E0", badge: "#C86A1E", label: "Hulp gevraagd" },
  ruilen:           { bg: "#E8F5E9", badge: "#3A7050", label: "Ruilen & Weggeven" },
  melding:          { bg: "#FFF8E1", badge: "#B07A1A", label: "Melding" },
  belangbeekhuizen: { bg: "#E6EDE7", badge: "#1E5B3A", label: "Belang Beekhuizen" },
  activiteit:       { bg: "#EDE7F6", badge: "#5A4A8E", label: "Activiteit" },
  info:             { bg: "#E3F2FD", badge: "#1E5A90", label: "Info & Tips" },
};

const SEED_POSTS = [
  {
    id: "seed-1",
    author: "Anita Verschoor",
    straat: "Beekhuizenseweg",
    avatar: "A",
    avatarColor: "#3A7050",
    category: "info",
    title: "Ree gespot met kalf 🦌",
    body: "Vanochtend vroeg bij het bospad achter Buitenplaats Beekhuizen een ree met jong kalf gezien. Prachtig! Houd je hond wel aangelijnd in dat deel van het bos, ze zijn erg schuw.",
    time: "1 uur geleden",
    likes: 18,
    comments: [
      { author: "Kees M.", text: "Wat mooi! Welk pad precies?", time: "45 min geleden" },
      { author: "Anita V.", text: "Het pad vlak na de houten brug, links het bos in.", time: "30 min geleden" }
    ],
    liked: false,
  },
  {
    id: "seed-2",
    author: "Belang Beekhuizen",
    straat: "Van Tienhovenlaan",
    avatar: "BB",
    avatarColor: "#1E5B3A",
    category: "belangbeekhuizen",
    title: "Bezwaar Buitenplaats Beekhuizen – update",
    body: "Zoals velen weten loopt er een bezwaarprocedure tegen de verklaring van geen bezwaar voor de uitbreiding op Buitenplaats Beekhuizen. De inspraaktermijn loopt nog. Wie wil meedenken of meehelpen, laat het weten. We zijn sterker samen.",
    time: "gisteren",
    likes: 34,
    comments: [
      { author: "Lien B.", text: "Ik doe mee! Stuur me maar een berichtje.", time: "gisteren" },
      { author: "Frank O.", text: "Heb al gereageerd bij de gemeente. Goed dat dit zo opgepakt wordt.", time: "gisteren" }
    ],
    liked: false,
  },
  {
    id: "seed-3",
    author: "Margreet Kuipers",
    straat: "Pinkenbergseweg",
    avatar: "M",
    avatarColor: "#C86A1E",
    category: "ruilen",
    title: "Appels te weg! Kom ze halen",
    body: "Onze appelboom geeft dit jaar meer dan we op kunnen. Zakken à 3 kg staan bij de oprit. Gratis mee te nemen, graag voor zondag weg.",
    time: "2 dagen geleden",
    likes: 9,
    comments: [],
    liked: false,
  },
  {
    id: "seed-4",
    author: "Johan Smeets",
    straat: "Thijsselaan",
    avatar: "J",
    avatarColor: "#1E5A90",
    category: "melding",
    title: "Omgevallen boom blokkeert bospad",
    body: "Na de storm van gisteravond ligt er een flinke beuk dwars over het pad richting de Posbank. Gemeente gemeld, maar voor nu even omrijden via de Beekhuizenseweg.",
    time: "2 dagen geleden",
    likes: 11,
    comments: [
      { author: "Sandra H.", text: "Bedankt voor de melding! Goed om te weten.", time: "2 dagen geleden" }
    ],
    liked: false,
  },
  {
    id: "seed-5",
    author: "Belang Beekhuizen",
    straat: "Den Bruijl",
    avatar: "BB",
    avatarColor: "#1E5B3A",
    category: "belangbeekhuizen",
    title: "Welkom op de buurtapp van Beekhuizen!",
    body: "Deze app is een initiatief van Belang Beekhuizen en is er voor en door bewoners van onze wijk. Hier delen we meldingen, vragen we hulp, organiseren we activiteiten en houden we elkaar op de hoogte van wat er speelt — zoals de Buitenplaats Beekhuizen-procedure. Doe mee!",
    time: "3 dagen geleden",
    likes: 27,
    comments: [
      { author: "Tom de B.", text: "Mooi initiatief, goed dat dit er nu is!", time: "3 dagen geleden" }
    ],
    liked: false,
  },
];

const POSTS_KEY = "beekhuizen:posts";
const SESSION_KEY = "beekhuizen:session";
const PROFILE_KEY = "beekhuizen_profile";
const USERS_KEY = "beekhuizen:users";
const DMS_KEY = "beekhuizen:dms";

function timeAgoLabel() { return "zojuist"; }

function dmThreadId(a, b) {
  return [a, b].sort().join("__");
}

export default function BeekhuizenApp() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [form, setForm] = useState({ title: "", body: "", category: "info", straat: "Hele buurt" });
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [installHint, setInstallHint] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Navigation: "buurt" | "meldingen" | "berichten" | "profiel" | "beheer"
  const [activeTab, setActiveTab] = useState("buurt");

  // Auth state
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null); // { naam, email, straat, huisnummer }
  const [loginStep, setLoginStep] = useState("code"); // code -> details
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loginForm, setLoginForm] = useState({ naam: "", email: "", straat: "Beekhuizenseweg", huisnummer: "" });
  const [loginError, setLoginError] = useState("");

  // Directory of known users (for starting DMs)
  const [allUsers, setAllUsers] = useState([]);

  // DM state
  const [dmThreads, setDmThreads] = useState({}); // threadId -> [{from, text, time}]
  const [activeThreadWith, setActiveThreadWith] = useState(null); // user object
  const [dmInput, setDmInput] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const dmEndRef = useRef(null);

  // Admin state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminCodeError, setAdminCodeError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Splashscreen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    // Try to set the page title and icon so "Add to Home Screen" picks up
    // Beekhuizen branding instead of default Claude branding.
    try {
      document.title = APP_NAME;

      const setIconLink = (rel, sizes) => {
        let link = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ""}`);
        if (!link) {
          link = document.createElement("link");
          link.rel = rel;
          if (sizes) link.sizes = sizes;
          document.head.appendChild(link);
        }
        link.href = ICON_SRC;
      };

      setIconLink("apple-touch-icon");
      setIconLink("icon");
      setIconLink("shortcut icon");

      let titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (!titleMeta) {
        titleMeta = document.createElement("meta");
        titleMeta.name = "apple-mobile-web-app-title";
        document.head.appendChild(titleMeta);
      }
      titleMeta.content = APP_NAME;

      let capableMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!capableMeta) {
        capableMeta = document.createElement("meta");
        capableMeta.name = "apple-mobile-web-app-capable";
        document.head.appendChild(capableMeta);
      }
      capableMeta.content = "yes";
    } catch (e) {
      // running in an environment where document head can't be modified - ignore
    }

    async function checkSession() {
      try {
        const result = await window.storage.get(SESSION_KEY, false);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setUser(parsed);
        }
      } catch (e) {
        // no session yet
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  // Load shared posts + register user + load directory + load DMs once logged in
  useEffect(() => {
    if (!user) return;

    async function loadAll() {
      // posts
      try {
        const result = await window.storage.get(POSTS_KEY, true);
        if (result && result.value) {
          setPosts(JSON.parse(result.value));
        } else {
          await window.storage.set(POSTS_KEY, JSON.stringify(SEED_POSTS), true);
          setPosts(SEED_POSTS);
        }
      } catch (e) {
        try {
          await window.storage.set(POSTS_KEY, JSON.stringify(SEED_POSTS), true);
          setPosts(SEED_POSTS);
        } catch (e2) {
          setStorageError(true);
          setPosts(SEED_POSTS);
        }
      }

      // user directory - register self, load all
      try {
        let directory = [];
        try {
          const res = await window.storage.get(USERS_KEY, true);
          if (res && res.value) directory = JSON.parse(res.value);
        } catch (e) { directory = []; }
        const exists = directory.find(u => u.email === user.email);
        if (!exists) {
          directory.push({ naam: user.naam, email: user.email, straat: user.straat });
          await window.storage.set(USERS_KEY, JSON.stringify(directory), true);
        }
        setAllUsers(directory);
      } catch (e) {
        // directory unavailable, DMs will be limited but app still works
      }

      // DM threads
      try {
        const res = await window.storage.get(DMS_KEY, true);
        if (res && res.value) {
          setDmThreads(JSON.parse(res.value));
        } else {
          setDmThreads({});
        }
      } catch (e) {
        setDmThreads({});
      }

      setLoading(false);
    }
    loadAll();
  }, [user]);

  // Poll DM threads while berichten tab open (lightweight refresh)
  useEffect(() => {
    if (!user || activeTab !== "berichten") return;
    const interval = setInterval(async () => {
      try {
        const res = await window.storage.get(DMS_KEY, true);
        if (res && res.value) setDmThreads(JSON.parse(res.value));
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  useEffect(() => {
    if (dmEndRef.current) {
      dmEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThreadWith, dmThreads]);

  function handleCodeSubmit() {
    if (codeInput.trim().toUpperCase() === TOEGANGSCODE) {
      setCodeError("");
      setLoginStep("details");
    } else {
      setCodeError("Onjuiste toegangscode. Deze staat in de nieuwsbrief of flyer van Belang Beekhuizen.");
    }
  }

  async function handleLoginSubmit() {
    if (!loginForm.naam.trim() || !loginForm.email.trim() || !loginForm.huisnummer.trim()) {
      setLoginError("Vul je naam, e-mailadres en huisnummer in.");
      return;
    }
    if (!loginForm.email.includes("@") || !loginForm.email.includes(".")) {
      setLoginError("Vul een geldig e-mailadres in.");
      return;
    }
    setLoginError("");
    const sessionUser = { naam: loginForm.naam.trim(), email: loginForm.email.trim().toLowerCase(), straat: loginForm.straat, huisnummer: loginForm.huisnummer.trim() };
    try {
      await window.storage.set(SESSION_KEY, JSON.stringify(sessionUser), false);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(sessionUser));
    } catch (e) {
      // continue anyway
    }
    setUser(sessionUser);
  }

  async function handleLogout() {
    try {
      await window.storage.delete(SESSION_KEY, false);
    } catch (e) {}
    setUser(null);
    setIsAdmin(false);
    setLoginStep("code");
    setCodeInput("");
    const savedProfile = localStorage.getItem(PROFILE_KEY);
if (savedProfile) {
  setLoginForm(JSON.parse(savedProfile));
} else {
  setLoginForm({ naam: "", email: "", straat: "Beekhuizenseweg", huisnummer: "" });
  }

  async function savePosts(updated) {
    setPosts(updated);
    try {
      await window.storage.set(POSTS_KEY, JSON.stringify(updated), true);
    } catch (e) {
      setStorageError(true);
    }
  }

  const filtered = activeCategory === "all" ? posts : posts.filter(p => p.category === activeCategory);

  function showNotif(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function toggleLike(id) {
    const updated = posts.map(p => p.id !== id ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 });
    savePosts(updated);
  }

  function addComment(postId) {
    const text = newComment[postId]?.trim();
    if (!text) return;
    const updated = posts.map(p => p.id !== postId ? p : {
      ...p, comments: [...p.comments, { author: user.naam, text, time: "zojuist" }]
    });
    savePosts(updated);
    setNewComment({ ...newComment, [postId]: "" });
  }

  async function submitPost() {
    if (!form.title.trim() || !form.body.trim()) { showNotif("Vul een titel en bericht in."); return; }
    setAiLoading(true);
    const authorName = user.naam;

    let aiText = "Bericht geplaatst!";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Je bent de vriendelijke assistent van de buurtapp voor Beekhuizen bij Velp (Gelderland), een initiatief van Belang Beekhuizen. Een bewoner plaatst dit bericht:

Titel: ${form.title}
Bericht: ${form.body}
Categorie: ${form.category}
Straat: ${form.straat}

Geef een korte, hartelijke reactie (1-2 zinnen, informeel, Nederlands) als buurtapp-bevestiging. Verwijs af en toe subtiel naar het bijzondere karakter van Beekhuizen: het bos, de natuur, de betrokken buurt. Geen opmaak, gewoon platte tekst.`
          }]
        })
      });
      const data = await response.json();
      aiText = data.content?.[0]?.text || aiText;
    } catch (e) {
      // fall back silently
    }

    const newPost = {
      id: "post-" + Date.now(), author: authorName, straat: form.straat,
      avatar: authorName.charAt(0).toUpperCase(), avatarColor: "#1E5B3A", category: form.category,
      title: form.title, body: form.body, time: "zojuist",
      likes: 0, comments: [], liked: false,
    };
    const updated = [newPost, ...posts];
    await savePosts(updated);
    setForm({ title: "", body: "", category: "info", straat: "Beekhuizenseweg" });
    setShowForm(false);
    showNotif("✅ " + aiText);
    setAiLoading(false);
  }

  async function deletePost(postId) {
    const updated = posts.filter(p => p.id !== postId);
    await savePosts(updated);
    showNotif("Bericht verwijderd.");
  }

  // --- DM functions ---
  async function sendDm(toUser) {
    const text = dmInput.trim();
    if (!text || !toUser) return;
    const threadId = dmThreadId(user.email, toUser.email);
    const updated = { ...dmThreads };
    if (!updated[threadId]) updated[threadId] = [];
    updated[threadId] = [...updated[threadId], { from: user.email, text, time: "zojuist", ts: Date.now() }];
    setDmThreads(updated);
    setDmInput("");
    try {
      await window.storage.set(DMS_KEY, JSON.stringify(updated), true);
    } catch (e) {
      showNotif("Bericht kon niet worden opgeslagen.");
    }
  }

  function getThreadMessages(otherUser) {
    if (!otherUser) return [];
    const threadId = dmThreadId(user.email, otherUser.email);
    return dmThreads[threadId] || [];
  }

  function getThreadPartners() {
    // find all users I've exchanged messages with
    const myEmail = user.email;
    const partners = new Map();
    Object.keys(dmThreads).forEach(threadId => {
      const [a, b] = threadId.split("__");
      if (a === myEmail || b === myEmail) {
        const otherEmail = a === myEmail ? b : a;
        const otherUserObj = allUsers.find(u => u.email === otherEmail);
        if (otherUserObj) {
          const msgs = dmThreads[threadId];
          const lastMsg = msgs[msgs.length - 1];
          partners.set(otherEmail, { user: otherUserObj, lastMsg });
        }
      }
    });
    return Array.from(partners.values()).sort((a, b) => (b.lastMsg?.ts || 0) - (a.lastMsg?.ts || 0));
  }

  // --- Admin functions ---
  function handleAdminCodeSubmit() {
    if (adminCodeInput.trim().toUpperCase() === BEHEERCODE) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminCodeError("");
      setActiveTab("beheer");
    } else {
      setAdminCodeError("Onjuiste beheercode.");
    }
  }

  const meta = (cat) => categoryMeta[cat] || { bg: "#F5F5F5", badge: "#888", label: cat };

  // --- Stats for admin panel ---
  function computeStats() {
    const totalPosts = posts.length;
    const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const perCategory = {};
    CATEGORIES.filter(c => c.id !== "all").forEach(c => perCategory[c.id] = 0);
    posts.forEach(p => { perCategory[p.category] = (perCategory[p.category] || 0) + 1; });
    const perStraat = {};
    posts.forEach(p => { perStraat[p.straat] = (perStraat[p.straat] || 0) + 1; });
    return { totalPosts, totalComments, totalLikes, perCategory, perStraat, totalUsers: allUsers.length };
  }

  // --- Loading screen while checking session ---
  if (checkingSession) {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F8FAF8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={ICON_SRC} alt="Beekhuizen" style={{ width: 56, height: 56, borderRadius: 14 }} />
      </div>
    );
  }

  // --- Login / access screen ---
  if (!user) {
    return (
      <div style={{ fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif", background: "linear-gradient(180deg, #1E5B3A 0%, #2E7D4F 100%)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 14, width: 84, height: 84, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
          <img src={ICON_SRC} alt="Buurtapp Beekhuizen" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ color: "white", fontSize: 22, fontWeight: 800, marginBottom: 2, textAlign: "center" }}>{APP_NAME}</div>
        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: 6, textAlign: "center" }}>{APP_SLOGAN}</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 28, textAlign: "center" }}>{APP_INITIATIVE}</div>

        <div style={{ background: "white", borderRadius: 18, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
          {loginStep === "code" && (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1E5B3A", marginBottom: 6 }}>Wijktoegangscode</div>
              <div style={{ fontSize: 13, color: "#777", marginBottom: 16, lineHeight: 1.5 }}>
                Deze app is alleen voor bewoners van Beekhuizen. Voer de toegangscode in die je via de nieuwsbrief of flyer van Belang Beekhuizen hebt ontvangen.
              </div>
              <input
                placeholder="Toegangscode"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 16, boxSizing: "border-box", marginBottom: 10, textAlign: "center", letterSpacing: 1, textTransform: "uppercase" }}
              />
              {codeError && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 10 }}>{codeError}</div>}
              <button onClick={handleCodeSubmit}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1E5B3A", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Doorgaan
              </button>
            </>
          )}

          {loginStep === "details" && (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1E5B3A", marginBottom: 6 }}>Jouw gegevens</div>
              <div style={{ fontSize: 13, color: "#777", marginBottom: 16, lineHeight: 1.5 }}>
                Je straat en huisnummer zijn nodig voor bewonerscontrole. Je e-mailadres en huisnummer worden niet gedeeld.
              </div>
              <input
                placeholder="Naam"
                value={loginForm.naam}
                onChange={e => setLoginForm({ ...loginForm, naam: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 10 }}
              />
              <input
                placeholder="E-mailadres"
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 10 }}
              />
              <select
                value={loginForm.straat}
                onChange={e => setLoginForm({ ...loginForm, straat: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 10 }}
              >
                {STRATEN.map(s => <option key={s}>{s}</option>)}
              </select>
              <input
                placeholder="Huisnummer"
                value={loginForm.huisnummer}
                onChange={e => setLoginForm({ ...loginForm, huisnummer: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 10 }}
              />
              {loginError && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 10 }}>{loginError}</div>}
              <button onClick={handleLoginSubmit}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1E5B3A", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Naar de buurtapp
              </button>
              <div onClick={() => setLoginStep("code")} style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#999", cursor: "pointer" }}>
                ← Terug
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const stats = isAdmin ? computeStats() : null;
  const threadPartners = getThreadPartners();

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F8FAF8", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E5B3A 0%, #2E7D4F 100%)", color: "white", padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "white", borderRadius: 12, padding: 5, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src={ICON_SRC} alt="Buurtapp Beekhuizen" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, opacity: 0.75, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Hallo, {user.naam}</div>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5 }}>{APP_NAME}</div>
            </div>
          </div>
          {activeTab === "buurt" && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ background: "#6FB96F", color: "#143423", border: "none", borderRadius: 22, padding: "9px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              + Bericht
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{ background: "#1E5B3A", color: "white", padding: "10px 20px", fontSize: 13, textAlign: "center" }}>
          {notification}
        </div>
      )}

      {storageError && (
        <div style={{ background: "#FFF3E0", color: "#A05A1E", padding: "8px 20px", fontSize: 12, textAlign: "center" }}>
          ⚠️ Berichten worden nu lokaal bewaard (gedeelde opslag niet beschikbaar)
        </div>
      )}

      {/* ===================== TAB: BUURT ===================== */}
      {activeTab === "buurt" && (
        <>
          <div style={{ padding: "16px 20px 10px", background: "#F8FAF8" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1E5B3A", marginBottom: 2 }}>👋 Hallo, {user.naam}</div>
            <div style={{ fontSize: 14, color: "#5F6B61" }}>{APP_SLOGAN}</div>
          </div>
          {!installHint && (
            <div onClick={() => setInstallHint(true)} style={{ background: "#FFFCF0", borderBottom: "1px solid #F0E6C8", padding: "10px 20px", fontSize: 12, color: "#7A6420", textAlign: "center", cursor: "pointer" }}>
              📲 Tip: zet deze app op je beginscherm — tik hier voor uitleg
            </div>
          )}
          {installHint && (
            <div style={{ background: "#FFFCF0", borderBottom: "1px solid #F0E6C8", padding: "12px 20px", fontSize: 12, color: "#7A6420", lineHeight: 1.6 }}>
              <b>iPhone:</b> tik op het deelicoon (vierkant met pijl) onderin Safari, kies "Zet op beginscherm".<br/>
              <b>Android:</b> tik op de drie puntjes rechtsboven in Chrome, kies "App installeren" of "Toevoegen aan startscherm".
              <div onClick={() => setInstallHint(false)} style={{ marginTop: 6, fontWeight: 700, cursor: "pointer" }}>Sluiten ✕</div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", background: "#F5F1E8", fontSize: 12, color: "#6B5D3F" }}>
            <span>Ingelogd als <b>{user.naam}</b> · {user.straat}</span>
            <span onClick={handleLogout} style={{ cursor: "pointer", textDecoration: "underline" }}>Uitloggen</span>
          </div>

          {showForm && (
            <div style={{ background: "white", margin: 16, borderRadius: 18, padding: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1E5B3A" }}>Nieuw bericht in Beekhuizen</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Straat / buurtdeel</label>
                <select value={form.straat} onChange={e => setForm({ ...form, straat: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14 }}>
                  {STRATEN.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Categorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14 }}>
                  {CATEGORIES.filter(c => c.id !== "all").map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <input placeholder="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 15, marginBottom: 10, boxSizing: "border-box" }} />
              <textarea placeholder="Wat wil je delen met de buurt?" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                rows={4} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, resize: "none", boxSizing: "border-box", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #ddd", background: "white", fontSize: 14, cursor: "pointer", color: "#555" }}>
                  Annuleren
                </button>
                <button onClick={submitPost} disabled={aiLoading}
                  style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: aiLoading ? "#aaa" : "#1E5B3A", color: "white", fontWeight: 700, fontSize: 14, cursor: aiLoading ? "not-allowed" : "pointer" }}>
                  {aiLoading ? "Plaatsen..." : "Plaatsen"}
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto", padding: "12px 16px 4px", display: "flex", gap: 8, scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                style={{
                  whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: "none",
                  background: activeCategory === c.id ? "#1E5B3A" : "white",
                  color: activeCategory === c.id ? "white" : "#444",
                  fontWeight: activeCategory === c.id ? 700 : 400,
                  fontSize: 13, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "12px 16px 100px" }}>
            {loading && (
              <div style={{ textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 14 }}>Berichten laden...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 15 }}>
                Nog geen berichten in deze categorie.
              </div>
            )}
            {!loading && filtered.map(post => {
              const m = meta(post.category);
              const isExpanded = expandedPost === post.id;
              return (
                <div key={post.id} style={{ background: "white", borderRadius: 18, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                  <div style={{ padding: "14px 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: post.avatarColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
                        {post.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{post.author}</div>
                        <div style={{ fontSize: 11, color: "#999" }}>{post.straat} · {post.time}</div>
                      </div>
                      <div style={{ background: m.bg, color: m.badge, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, whiteSpace: "nowrap" }}>
                        {m.label}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "#111" }}>{post.title}</div>
                    <div style={{ fontSize: 14, color: "#333", lineHeight: 1.55, marginBottom: 12 }}>{post.body}</div>
                  </div>

                  <div style={{ display: "flex", borderTop: "1px solid #F2F2F2", padding: "10px 16px", gap: 4 }}>
                    <button onClick={() => toggleLike(post.id)}
                      style={{ border: "none", background: post.liked ? "#E8F5E9" : "none", cursor: "pointer", fontSize: 13, color: post.liked ? "#2E7D4F" : "#888", fontWeight: post.liked ? 700 : 400, display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8 }}>
                      👍 {post.likes}
                    </button>
                    <button onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8 }}>
                      💬 {post.comments.length} reactie{post.comments.length !== 1 ? "s" : ""}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #F2F2F2", padding: "12px 16px" }}>
                      {post.comments.map((c, i) => (
                        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < post.comments.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{c.author} <span style={{ color: "#bbb", fontWeight: 400 }}>· {c.time}</span></div>
                          <div style={{ fontSize: 13, color: "#444", marginTop: 3 }}>{c.text}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input placeholder="Reageer..." value={newComment[post.id] || ""}
                          onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && addComment(post.id)}
                          style={{ flex: 1, padding: "8px 14px", borderRadius: 20, border: "1.5px solid #ddd", fontSize: 13 }} />
                        <button onClick={() => addComment(post.id)}
                          style={{ background: "#1E5B3A", color: "white", border: "none", borderRadius: 20, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                          Stuur
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <img src={LOGO_SRC} alt="Buurtapp Beekhuizen" style={{ width: 90, opacity: 0.95, marginBottom: 4, borderRadius: 20 }} />
                <div style={{ color: "#999", fontSize: 11 }}>Buurtapp Beekhuizen · {APP_INITIATIVE}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== TAB: MELDINGEN ===================== */}
      {activeTab === "meldingen" && (
        <div style={{ padding: "16px 16px 100px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1E5B3A", marginBottom: 4 }}>Meldingen</div>
          <div style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Actuele meldingen uit de wijk.</div>
          {posts.filter(p => p.category === "melding").length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", marginTop: 40, fontSize: 14 }}>Geen actuele meldingen.</div>
          )}
          {posts.filter(p => p.category === "melding").map(post => (
            <div key={post.id} style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 4 }}>⚠️ {post.title}</div>
              <div style={{ fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 1.5 }}>{post.body}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{post.straat} · {post.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== TAB: BERICHTEN (DM) ===================== */}
      {activeTab === "berichten" && !activeThreadWith && (
        <div style={{ padding: "16px 16px 100px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1E5B3A" }}>Berichten</div>
              <div style={{ fontSize: 13, color: "#777" }}>Privégesprekken met buurtgenoten</div>
            </div>
            <button onClick={() => setShowNewDm(true)}
              style={{ background: "#1E5B3A", color: "white", border: "none", borderRadius: 18, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Nieuw
            </button>
          </div>

          {showNewDm && (
            <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5B3A", marginBottom: 10 }}>Kies een buurtgenoot</div>
              {allUsers.filter(u => u.email !== user.email).length === 0 && (
                <div style={{ fontSize: 12, color: "#999" }}>Nog geen andere bewoners geregistreerd.</div>
              )}
              {allUsers.filter(u => u.email !== user.email).map(u => (
                <div key={u.email} onClick={() => { setActiveThreadWith(u); setShowNewDm(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1E5B3A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {u.naam.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{u.naam}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{u.straat}</div>
                  </div>
                </div>
              ))}
              <div onClick={() => setShowNewDm(false)} style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#999", cursor: "pointer" }}>Annuleren</div>
            </div>
          )}

          {threadPartners.length === 0 && !showNewDm && (
            <div style={{ textAlign: "center", color: "#aaa", marginTop: 40, fontSize: 14, lineHeight: 1.6 }}>
              Nog geen gesprekken.<br/>Tik op "+ Nieuw" om een buurtgenoot een privébericht te sturen.
            </div>
          )}

          {threadPartners.map(({ user: u, lastMsg }) => (
            <div key={u.email} onClick={() => setActiveThreadWith(u)}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 14, padding: 12, marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1E5B3A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {u.naam.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{u.naam}</div>
                <div style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {lastMsg?.from === user.email ? "Jij: " : ""}{lastMsg?.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "berichten" && activeThreadWith && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 78px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "white", borderBottom: "1px solid #eee" }}>
            <div onClick={() => setActiveThreadWith(null)} style={{ cursor: "pointer", fontSize: 18, color: "#1E5B3A" }}>←</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E5B3A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {activeThreadWith.naam.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{activeThreadWith.naam}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{activeThreadWith.straat}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", background: "#F8FAF8" }}>
            {getThreadMessages(activeThreadWith).length === 0 && (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 30 }}>
                Nog geen berichten. Stuur de eerste!
              </div>
            )}
            {getThreadMessages(activeThreadWith).map((m, i) => {
              const isMine = m.from === user.email;
              return (
                <div key={i} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{
                    maxWidth: "75%", padding: "9px 13px", borderRadius: 16,
                    background: isMine ? "#1E5B3A" : "white",
                    color: isMine ? "white" : "#222",
                    fontSize: 14, lineHeight: 1.4,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={dmEndRef} />
          </div>

          <div style={{ display: "flex", gap: 8, padding: "10px 16px", background: "white", borderTop: "1px solid #eee" }}>
            <input
              placeholder="Typ een bericht..."
              value={dmInput}
              onChange={e => setDmInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendDm(activeThreadWith)}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #ddd", fontSize: 14 }}
            />
            <button onClick={() => sendDm(activeThreadWith)}
              style={{ background: "#1E5B3A", color: "white", border: "none", borderRadius: 20, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Stuur
            </button>
          </div>
        </div>
      )}

      {/* ===================== TAB: PROFIEL ===================== */}
      {activeTab === "profiel" && (
        <div style={{ padding: "16px 16px 100px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: 24, textAlign: "center", marginBottom: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1E5B3A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 26, margin: "0 auto 12px" }}>
              {user.naam.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#222" }}>{user.naam}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{user.straat} {user.huisnummer || ""}</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{user.email}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Adresgegevens zijn alleen bedoeld voor bewonerscontrole.</div>
          </div>



          <div style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1E5B3A", marginBottom: 8 }}>🔔 Pushberichten</div>
            <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>Bewoners kunnen straks zelf kiezen welke pushberichten zij willen ontvangen, zoals reacties, activiteiten, hulpvragen, vermiste huisdieren en verdachte situaties.</div>
          </div>

          <div onClick={handleLogout} style={{ background: "white", borderRadius: 14, padding: 16, textAlign: "center", color: "#C0392B", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            Uitloggen
          </div>

          {!isAdmin && (
            <div onClick={() => setShowAdminLogin(true)} style={{ background: "white", borderRadius: 14, padding: 16, textAlign: "center", color: "#1E5B3A", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              🔐 Bestuur / beheer
            </div>
          )}
          {isAdmin && (
            <div onClick={() => setActiveTab("beheer")} style={{ background: "#1E5B3A", borderRadius: 14, padding: 16, textAlign: "center", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              📊 Naar beheerpaneel
            </div>
          )}

          {showAdminLogin && !isAdmin && (
            <div style={{ background: "white", borderRadius: 14, padding: 18, marginTop: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5B3A", marginBottom: 8 }}>Beheercode</div>
              <input
                placeholder="Beheercode"
                value={adminCodeInput}
                onChange={e => setAdminCodeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdminCodeSubmit()}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 8, textAlign: "center" }}
              />
              {adminCodeError && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 8 }}>{adminCodeError}</div>}
              <button onClick={handleAdminCodeSubmit}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#1E5B3A", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Bevestigen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: BEHEER (admin only) ===================== */}
      {activeTab === "beheer" && isAdmin && (
        <div style={{ padding: "16px 16px 100px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1E5B3A", marginBottom: 4 }}>Beheerpaneel</div>
          <div style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Alleen zichtbaar voor bestuursleden.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Berichten", value: stats.totalPosts },
              { label: "Reacties", value: stats.totalComments },
              { label: "Likes", value: stats.totalLikes },
              { label: "Geregistreerde leden", value: stats.totalUsers },
            ].map(s => (
              <div key={s.label} style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1E5B3A" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5B3A", marginBottom: 10 }}>Berichten per categorie</div>
            {CATEGORIES.filter(c => c.id !== "all").map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444", padding: "5px 0", borderBottom: "1px solid #F5F5F5" }}>
                <span>{c.icon} {c.label}</span>
                <span style={{ fontWeight: 700 }}>{stats.perCategory[c.id] || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5B3A", marginBottom: 10 }}>Berichten per straat</div>
            {Object.keys(stats.perStraat).length === 0 && <div style={{ fontSize: 12, color: "#999" }}>Nog geen data.</div>}
            {Object.entries(stats.perStraat).map(([straat, count]) => (
              <div key={straat} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444", padding: "5px 0", borderBottom: "1px solid #F5F5F5" }}>
                <span>{straat}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5B3A", marginBottom: 10 }}>Berichten beheren</div>
          {posts.map(post => (
            <div key={post.id} style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{post.title}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{post.author} · {post.straat} · {meta(post.category).label}</div>
                </div>
                <button onClick={() => deletePost(post.id)}
                  style={{ background: "#FFF0F0", color: "#C0392B", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  Verwijderen
                </button>
              </div>
            </div>
          ))}

          <div onClick={() => { setIsAdmin(false); setActiveTab("profiel"); }} style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#999", cursor: "pointer" }}>
            Beheermodus verlaten
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "white", borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-around", padding: "10px 0 18px" }}>
        {[
          { icon: "🌲", label: "Buurt", tab: "buurt" },
          { icon: "🔔", label: "Meldingen", tab: "meldingen" },
          { icon: "✉️", label: "Berichten", tab: "berichten" },
          { icon: "👤", label: "Profiel", tab: "profiel" },
        ].map(item => (
          <div key={item.label} onClick={() => { setActiveTab(item.tab); if (item.tab !== "berichten") setActiveThreadWith(null); }}
            style={{ textAlign: "center", cursor: "pointer", color: activeTab === item.tab ? "#1E5B3A" : "#888" }}>
            <div style={{ fontSize: 22, position: "relative", display: "inline-block" }}>{item.icon}{(item.tab === "meldingen" && posts.filter(p => p.category === "melding").length > 0) ? <span style={{ position: "absolute", top: -6, right: -10, background: "#D64545", color: "white", borderRadius: 999, minWidth: 16, height: 16, padding: "0 4px", fontSize: 10, lineHeight: "16px", fontWeight: 800 }}>{posts.filter(p => p.category === "melding").length}</span> : null}</div>
            <div style={{ fontSize: 10, marginTop: 2, fontWeight: activeTab === item.tab ? 700 : 400 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

