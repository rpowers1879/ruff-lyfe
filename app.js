const { useState, useEffect, useCallback, useRef } = React;

// ============================================
// BRAND COLORS
// ============================================
const BRAND = {
  red: "#D42027", redDark: "#B01A20", redLight: "#FF4C52",
  cream: "#FFF8F0", white: "#FFFFFF", warmGray: "#F5F0EB",
  darkText: "#2D1A1A", medText: "#5C3A3A", lightText: "#8C6A6A",
  accent: "#FF6B6B", green: "#34A853", greenLight: "#E8F5E9",
};

// ============================================
// STORAGE - localStorage for PWA persistence
// ============================================
const storage = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
};

const useStorage = (key, defaultValue) => {
  const [data, setData] = useState(() => {
    const saved = storage.get(key);
    return saved !== null ? saved : defaultValue;
  });

  const save = useCallback((newData) => {
    const value = typeof newData === 'function' ? newData(data) : newData;
    setData(value);
    storage.set(key, value);
  }, [key, data]);

  return [data, save];
};

// ============================================
// PUSH NOTIFICATION HELPERS
// ============================================
const notificationHelper = {
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  },

  async sendLocal(title, body, options = {}) {
    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            vibrate: [100, 50, 100],
            ...options,
          });
          return;
        }
      }
      // Fallback to basic notification
      new Notification(title, { body, icon: '/icon-192x192.png' });
    }
  }
};

// ============================================
// EMAIL NOTIFICATION HELPER (EmailJS → Outlook)
// ============================================
const emailNotifier = {
  _scriptLoaded: false,

  async loadScript() {
    if (this._scriptLoaded) return true;
    return new Promise((resolve) => {
      if (window.emailjs) { this._scriptLoaded = true; resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.onload = () => { this._scriptLoaded = true; resolve(true); };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  },

  _buildTemplateParams(booking, settings) {
    const dates = (booking.dates || []).map(d =>
      new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    ).join(", ");

    return {
      service_name: booking.serviceName || "N/A",
      booking_dates: dates,
      pet_name: booking.petName || "N/A",
      pet_breed: booking.petBreed || "Not specified",
      pet_count: String(booking.petCount || 1),
      client_name: booking.ownerName || "N/A",
      client_phone: booking.ownerPhone || "N/A",
      client_email: booking.ownerEmail || "N/A",
      notes: booking.notes || "None",
      total_estimate: (booking.totalEstimate || 0).toFixed(2),
      price_per_day: String(booking.pricePerDay || 0),
      num_days: String((booking.dates || []).length),
      owner_phone: settings.phone || "",
      owner_email: settings.email || "",
      submitted_at: new Date().toLocaleString(),
    };
  },

  async sendBookingNotification(booking, settings) {
    const ejs = settings.emailjs;
    if (!ejs || !ejs.enabled || !ejs.serviceId || !ejs.publicKey) return false;
    if (!ejs.ownerTemplateId && !ejs.clientTemplateId) return false;

    const loaded = await this.loadScript();
    if (!loaded || !window.emailjs) return false;

    const params = this._buildTemplateParams(booking, settings);

    // Email #1: Notify the owner
    if (ejs.ownerTemplateId) {
      try {
        await window.emailjs.send(ejs.serviceId, ejs.ownerTemplateId, params, ejs.publicKey);
        console.log("Owner notification sent!");
      } catch (err) { console.error("Owner email failed:", err); }
    }

    // Email #2: Confirm to the client (only if they gave an email)
    if (ejs.clientTemplateId && booking.ownerEmail) {
      try {
        await window.emailjs.send(ejs.serviceId, ejs.clientTemplateId, params, ejs.publicKey);
        console.log("Client confirmation sent!");
      } catch (err) { console.error("Client email failed:", err); }
    }

    return true;
  },

  async sendStatusUpdate(booking, status, settings) {
    const ejs = settings.emailjs;
    if (!ejs || !ejs.enabled || !ejs.serviceId || !ejs.publicKey) return false;

    const templateId = status === "confirmed" ? ejs.confirmTemplateId : ejs.declineTemplateId;
    if (!templateId || !booking.ownerEmail) return false;

    const loaded = await this.loadScript();
    if (!loaded || !window.emailjs) return false;

    const dates = (booking.dates || []).map(d =>
      new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    ).join(", ");

    try {
      await window.emailjs.send(ejs.serviceId, templateId, {
        status: status,
        service_name: booking.serviceName || "N/A",
        booking_dates: dates,
        pet_name: booking.petName || "N/A",
        pet_breed: booking.petBreed || "Not specified",
        pet_count: String(booking.petCount || 1),
        client_name: booking.ownerName || "N/A",
        client_email: booking.ownerEmail || "",
        total_estimate: (booking.totalEstimate || 0).toFixed(2),
        owner_phone: settings.phone || "",
        owner_email: settings.email || "",
        owner_name: settings.ownerName || "Ruff Lyfe Pet Services",
        venmo: settings.venmo || "",
        zelle: settings.zelle || "",
      }, ejs.publicKey);
      console.log(`${status} email sent to client!`);
      return true;
    } catch (err) {
      console.error(`${status} email failed:`, err);
      return false;
    }
  },

  async sendTest(settings) {
    const ejs = settings.emailjs;
    if (!ejs || !ejs.serviceId || !ejs.publicKey) return false;
    if (!ejs.ownerTemplateId && !ejs.clientTemplateId) return false;

    const loaded = await this.loadScript();
    if (!loaded || !window.emailjs) return false;

    const testParams = {
      service_name: "Boarding (at my home)",
      booking_dates: "Mon, Mar 10, Tue, Mar 11, Wed, Mar 12",
      pet_name: "Barkley (Test)",
      pet_breed: "Golden Retriever",
      pet_count: "2",
      client_name: "Jane Smith",
      client_phone: "(555) 123-4567",
      client_email: settings.email || "test@example.com",
      notes: "Loves belly rubs, needs medication at 8am",
      total_estimate: "135.00",
      price_per_day: "45",
      num_days: "3",
      owner_phone: settings.phone || "(555) 000-0000",
      owner_email: settings.email || "test@example.com",
      submitted_at: new Date().toLocaleString(),
    };

    try {
      // Test owner template
      if (ejs.ownerTemplateId) {
        await window.emailjs.send(ejs.serviceId, ejs.ownerTemplateId, testParams, ejs.publicKey);
      }
      // Test client template (sends to owner's email for testing)
      if (ejs.clientTemplateId) {
        await window.emailjs.send(ejs.serviceId, ejs.clientTemplateId, testParams, ejs.publicKey);
      }
      return true;
    } catch (err) {
      console.error("Test email failed:", err);
      return false;
    }
  }
};
// ============================================
const PawIcon = ({ size = 20, color = BRAND.red }) => (
  React.createElement('svg', { width: size, height: size, viewBox: "0 0 24 24", fill: color },
    React.createElement('path', { d: "M12 18.5c-2.5 0-4.5-1.5-4.5-3.5 0-1.5 1.5-3.5 3-5 .5-.5 1-.8 1.5-.8s1 .3 1.5.8c1.5 1.5 3 3.5 3 5 0 2-2 3.5-4.5 3.5z" }),
    React.createElement('circle', { cx: 7, cy: 8, r: 2.2 }),
    React.createElement('circle', { cx: 17, cy: 8, r: 2.2 }),
    React.createElement('circle', { cx: 4, cy: 12.5, r: 2 }),
    React.createElement('circle', { cx: 20, cy: 12.5, r: 2 })
  )
);

const CalendarIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ShopIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5z"/><line x1="3" y1="7" x2="21" y2="7"/><path d="M16 11a4 4 0 01-8 0"/>
  </svg>
);

const PhoneIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const SettingsIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const HomeIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CheckIcon = ({ size = 18, color = BRAND.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
);

const XIcon = ({ size = 18, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const ChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
);

const ChevronRight = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
);

const BellIcon = ({ size = 20, color = BRAND.red }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

// ============================================
// DEFAULT DATA
// ============================================
const DEFAULT_SETTINGS = {
  maxPetsAtHome: 10,       // Track 1: boarding + day care share this pool (husband manages)
  maxHouseVisitsPerDay: 6, // Track 2: day house visits she can do
  maxOvernightsPerNight: 1,// Track 2: overnight stays (1 house at a time)
  bufferDays: 1,
  services: [
    { id: "boarding", name: "Boarding (at my home)", price: 45, enabled: true, description: "Your pup stays at my place with 24/7 care, walks, and lots of love.", type: "athome" },
    { id: "housesitting", name: "House Sitting (at your home)", price: 55, priceOvernight: 75, enabled: true, description: "I come to your home so your pet stays in their comfort zone. Day visits or overnight stays available!", type: "housesit" },
    { id: "daycare", name: "Doggy Day Care", price: 30, enabled: true, description: "Drop off in the morning, pick up in the evening. Fun guaranteed!", type: "athome" },
    { id: "walkvisit", name: "Drop-In Visit / Walk", price: 20, enabled: true, description: "A 30-minute check-in, walk, and potty break.", type: "visit" },
  ],
  blockedDates: [],
  businessHours: { start: "08:00", end: "20:00" },
  ownerName: "Ruff Lyfe Pet Services",
  phone: "", email: "", venmo: "", zelle: "",
  about: "We treat your fur babies like family! Whether your pup is hanging at our place or we're coming to yours, every pet gets personalized attention, belly rubs, and the best care around.",
  notificationsEnabled: false,
  adminPin: "1234",
  emailjs: {
    serviceId: "",
    ownerTemplateId: "",
    clientTemplateId: "",
    confirmTemplateId: "",
    declineTemplateId: "",
    publicKey: "",
    enabled: false,
  },
};

const DEFAULT_PRODUCTS = [
  {
    id: "boop-butter-1", name: "Boop Butter", price: 12.99,
    description: "All-natural, soothing nose balm for dry or cracked snoots. Made with shea butter, coconut oil, and vitamin E. Safe if licked!",
    inStock: true,
    paypalLink: "", // She sets this in Admin → Products
  },
];

// ============================================
// SHARED COMPONENTS
// ============================================
const Badge = ({ children, color = BRAND.red, bg }) => (
  <span style={{
    background: bg || `${color}15`, color, padding: "4px 12px", borderRadius: 20,
    fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    display: "inline-flex", alignItems: "center", gap: 4,
  }}>{children}</span>
);

const Button = ({ children, onClick, variant = "primary", size = "md", disabled, style: s = {} }) => {
  const base = {
    fontFamily: "'Lilita One', cursive", border: "none",
    cursor: disabled ? "not-allowed" : "pointer", borderRadius: 12,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.2s ease", opacity: disabled ? 0.5 : 1, letterSpacing: "0.5px",
  };
  const sizes = { sm: { padding: "8px 16px", fontSize: 13 }, md: { padding: "12px 24px", fontSize: 15 }, lg: { padding: "16px 32px", fontSize: 17 } };
  const variants = {
    primary: { background: BRAND.red, color: BRAND.white, boxShadow: "0 4px 15px rgba(212,32,39,0.3)" },
    secondary: { background: BRAND.warmGray, color: BRAND.darkText },
    outline: { background: "transparent", color: BRAND.red, border: `2px solid ${BRAND.red}` },
    ghost: { background: "transparent", color: BRAND.red },
    success: { background: BRAND.green, color: BRAND.white, boxShadow: "0 4px 15px rgba(52,168,83,0.3)" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...s }}>{children}</button>;
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: BRAND.white, borderRadius: 16, padding: 24,
    boxShadow: "0 2px 12px rgba(45,26,26,0.06)", border: `1px solid rgba(212,32,39,0.08)`,
    cursor: onClick ? "pointer" : "default", transition: "all 0.2s ease", ...style,
  }}>{children}</div>
);

const Input = ({ label, style: s, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: BRAND.medText, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid rgba(212,32,39,0.15)`,
      fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: BRAND.darkText,
      outline: "none", boxSizing: "border-box", WebkitAppearance: "none", ...s,
    }} />
  </div>
);

const TextArea = ({ label, style: s, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: BRAND.medText, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
    <textarea {...props} style={{
      width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid rgba(212,32,39,0.15)`,
      fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: BRAND.darkText,
      outline: "none", boxSizing: "border-box", minHeight: 100, resize: "vertical", ...s,
    }} />
  </div>
);

const Select = ({ label, options, style: s, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: BRAND.medText, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid rgba(212,32,39,0.15)`,
      fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: BRAND.darkText,
      outline: "none", boxSizing: "border-box", background: BRAND.white, ...s,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ============================================
// NOTIFICATION BANNER
// ============================================
const NotificationBanner = ({ notifications, onDismiss }) => {
  if (!notifications.length) return null;
  const latest = notifications[notifications.length - 1];
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: latest.type === "success" ? BRAND.green : BRAND.red,
      color: BRAND.white, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
      animation: "slideDown 0.3s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BellIcon size={18} color={BRAND.white} />
        <span>{latest.message}</span>
      </div>
      <button onClick={() => onDismiss(latest.id)} style={{
        background: "rgba(255,255,255,0.2)", border: "none", color: BRAND.white,
        borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13,
      }}>OK</button>
    </div>
  );
};

// ============================================
// SCHEDULING ENGINE - Two independent tracks
// ============================================
// Track 1 ("athome"): Boarding + Day Care → share maxPetsAtHome (husband manages)
// Track 2 ("housesit"): Day visits + Overnights → she goes out
//   - Day visits: up to maxHouseVisitsPerDay
//   - Overnights: up to maxOvernightsPerNight (typically 1)
//   - Day visits and overnights DON'T block each other
// "visit" (drop-in walks): lightweight, no capacity limits
// Tracks are 100% independent — boarding doesn't affect house sits and vice versa

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const getScheduleMap = (bookings, settings) => {
  const map = {};
  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");

  const emptyDay = () => ({
    athomePets: 0,       // boarding + daycare pet count
    houseVisits: 0,      // house sit day visits
    overnights: 0,       // house sit overnight stays
    visits: 0,           // drop-in visits (no limit)
    bookingIds: [],
    isOvernightBuffer: false,
  });

  activeBookings.forEach(b => {
    const svc = settings.services.find(s => s.id === b.service);
    const type = svc?.type || "athome";
    const subType = b.houseSitType || "day"; // "day" or "overnight"

    (b.dates || []).forEach(date => {
      if (!map[date]) map[date] = emptyDay();
      map[date].bookingIds.push(b.id);

      if (type === "athome") {
        map[date].athomePets += (b.petCount || 1);
      } else if (type === "housesit") {
        if (subType === "overnight") {
          map[date].overnights += 1;
        } else {
          map[date].houseVisits += 1;
        }
      } else if (type === "visit") {
        map[date].visits += 1;
      }
    });

    // Buffer days around overnight house sits
    const bufferDays = settings.bufferDays || 0;
    if (bufferDays > 0 && type === "housesit" && subType === "overnight" && b.dates?.length > 0) {
      const sorted = [...b.dates].sort();
      for (let i = 1; i <= bufferDays; i++) {
        [addDays(sorted[0], -i), addDays(sorted[sorted.length - 1], i)].forEach(bufDate => {
          if (!map[bufDate]) map[bufDate] = emptyDay();
          map[bufDate].isOvernightBuffer = true;
        });
      }
    }
  });

  return map;
};

const getDateAvailability = (dateStr, serviceType, subType, scheduleMap, settings) => {
  const day = scheduleMap[dateStr];
  const maxPets = settings.maxPetsAtHome || 10;
  const maxVisits = settings.maxHouseVisitsPerDay || 6;
  const maxOvernights = settings.maxOvernightsPerNight || 1;

  if (!day) {
    // Empty day — fully available for anything
    if (serviceType === "athome") return { available: true, spotsLeft: maxPets, reason: null };
    if (serviceType === "housesit" && subType === "overnight") return { available: true, spotsLeft: maxOvernights, reason: null };
    if (serviceType === "housesit") return { available: true, spotsLeft: maxVisits, reason: null };
    return { available: true, spotsLeft: 99, reason: null }; // visits
  }

  // Track 1: At-home (boarding + daycare) — only checks athomePets
  if (serviceType === "athome") {
    const spotsLeft = maxPets - day.athomePets;
    if (spotsLeft <= 0) return { available: false, spotsLeft: 0, reason: "At max pet capacity" };
    return { available: true, spotsLeft, reason: null };
  }

  // Track 2: House sitting
  if (serviceType === "housesit") {
    if (subType === "overnight") {
      // Check overnight buffer
      if (day.isOvernightBuffer && day.overnights === 0) {
        return { available: false, spotsLeft: 0, reason: "Buffer day (transition time)" };
      }
      const spotsLeft = maxOvernights - day.overnights;
      if (spotsLeft <= 0) return { available: false, spotsLeft: 0, reason: "Overnight stay already booked" };
      return { available: true, spotsLeft, reason: null };
    } else {
      // Day visit
      const spotsLeft = maxVisits - day.houseVisits;
      if (spotsLeft <= 0) return { available: false, spotsLeft: 0, reason: `Max ${maxVisits} house visits/day reached` };
      return { available: true, spotsLeft, reason: null };
    }
  }

  // Drop-in visits — always available
  return { available: true, spotsLeft: 99, reason: null };
};

// Helper for admin overview
const getBookedPetsPerDay = (bookings) => {
  const counts = {};
  bookings.forEach(b => {
    if (b.status === "confirmed" || b.status === "pending") {
      const svcType = b.service === "boarding" || b.service === "daycare" ? "athome" : "other";
      if (svcType === "athome") {
        (b.dates || []).forEach(date => {
          counts[date] = (counts[date] || 0) + (b.petCount || 1);
        });
      }
    }
  });
  return counts;
};

// ============================================
// CALENDAR
// ============================================
const Calendar = ({ selectedDates, onSelectDate, blockedDates = [], capacityMap = {}, maxCapacity = 0, showCapacity = false, scheduleMap = {}, serviceType = null, subType = "day", settings = null }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Use smart scheduling if serviceType + settings provided
  const useSmartScheduling = serviceType && settings;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: BRAND.red }}><ChevronLeft /></button>
        <span style={{ fontWeight: 700, fontSize: 16, color: BRAND.darkText }}>{monthNames[month]} {year}</span>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: BRAND.red }}><ChevronRight /></button>
      </div>
      {(showCapacity || useSmartScheduling) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 12, fontSize: 11, color: BRAND.lightText, fontWeight: 600, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.green, display: "inline-block" }} /> Open</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: "#E6A817", display: "inline-block" }} /> Filling Up</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.red, display: "inline-block" }} /> Unavailable</span>
          {useSmartScheduling && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: "#9E9E9E", display: "inline-block" }} /> Buffer</span>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: BRAND.lightText, padding: "4px 0" }}>{d}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const blocked = blockedDates.includes(dateStr);
          const selected = selectedDates.includes(dateStr);
          const past = new Date(year, month, d) < today;

          let isUnavailable = false;
          let isAlmostFull = false;
          let isBuffer = false;
          let dotColor = null;
          let titleText = "";
          let spotsLeft = null;

          if (useSmartScheduling && !past && !blocked) {
            const avail = getDateAvailability(dateStr, serviceType, subType, scheduleMap, settings);
            isUnavailable = !avail.available;
            spotsLeft = avail.spotsLeft;
            isBuffer = scheduleMap[dateStr]?.isBuffer && !scheduleMap[dateStr]?.hasHouseSit;
            isAlmostFull = avail.available && serviceType === "athome" && spotsLeft <= (settings.maxPetsAtHome || 10) * 0.3;
            titleText = avail.reason || (avail.available ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : '');

            if (isBuffer && isUnavailable) dotColor = "#9E9E9E";
            else if (isUnavailable) dotColor = BRAND.red;
            else if (isAlmostFull) dotColor = "#E6A817";
            else if (scheduleMap[dateStr]?.petCount > 0) dotColor = BRAND.green;
          } else if (showCapacity && maxCapacity > 0 && !past && !blocked) {
            const booked = capacityMap[dateStr] || 0;
            const isFull = booked >= maxCapacity;
            isUnavailable = isFull;
            isAlmostFull = booked >= maxCapacity * 0.7 && !isFull;
            spotsLeft = maxCapacity - booked;
            titleText = `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`;
            if (isFull) dotColor = BRAND.red;
            else if (isAlmostFull) dotColor = "#E6A817";
            else if (booked > 0) dotColor = BRAND.green;
          }

          const disabled = blocked || past || isUnavailable;

          return (
            <button key={d} onClick={() => !disabled && onSelectDate(dateStr)} title={titleText} style={{
              width: "100%", aspectRatio: "1", borderRadius: 10, border: "none",
              background: selected ? BRAND.red : isUnavailable && !past ? `${BRAND.red}08` : isBuffer && !past ? "#f0f0f0" : blocked ? `${BRAND.red}10` : "transparent",
              color: selected ? BRAND.white : disabled ? BRAND.lightText : BRAND.darkText,
              fontWeight: selected ? 700 : 500, fontSize: 14, cursor: disabled ? "default" : "pointer",
              opacity: past ? 0.3 : 1, position: "relative", fontFamily: "'DM Sans', sans-serif",
            }}>
              {d}
              {dotColor && !past && (
                <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: 3, background: dotColor }} />
              )}
              {blocked && !past && !dotColor && <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: 2, background: BRAND.red }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// HOME PAGE
// ============================================
const HomePage = ({ settings, onNavigate }) => {
  const [fadeIn, setFadeIn] = useState(false);
  useEffect(() => { setTimeout(() => setFadeIn(true), 50); }, []);
  return (
    <div style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease" }}>
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.red} 0%, ${BRAND.redDark} 100%)`,
        borderRadius: 24, padding: "48px 28px", textAlign: "center", marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 15, left: 20, opacity: 0.1, transform: "rotate(-20deg)" }}><PawIcon size={50} color={BRAND.white} /></div>
        <div style={{ position: "absolute", bottom: 20, right: 25, opacity: 0.1, transform: "rotate(15deg)" }}><PawIcon size={40} color={BRAND.white} /></div>

        <img src="/logo.jpg" alt="Ruff Lyfe" style={{ width: 90, height: 90, borderRadius: 18, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }} />

        <h1 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.white, fontSize: 36, margin: "0 0 4px", letterSpacing: 1 }}>Ruff Lyfe</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 20px", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Pet Services</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.9)", fontSize: 16, margin: "0 0 28px", lineHeight: 1.6, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>{settings.about}</p>
        <Button variant="secondary" size="lg" onClick={() => onNavigate("booking")} style={{ background: BRAND.white, color: BRAND.red, fontFamily: "'Lilita One', cursive" }}>
          <PawIcon size={18} color={BRAND.red} /> Book Now
        </Button>
      </div>

      <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 22, margin: "0 0 16px" }}>Our Services</h2>
      <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        {settings.services.filter(s => s.enabled).map(s => (
          <Card key={s.id} onClick={() => onNavigate("booking")} style={{ padding: 18, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: 0 }}>{s.name}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "4px 0 0" }}>{s.description}</p>
              </div>
              <div style={{ fontFamily: "'Lilita One', cursive", fontSize: 20, color: BRAND.red, whiteSpace: "nowrap", marginLeft: 16 }}>${s.price}<span style={{ fontSize: 12, color: BRAND.lightText }}>/day</span></div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card onClick={() => onNavigate("shop")} style={{ padding: 20, cursor: "pointer", textAlign: "center" }}>
          <ShopIcon size={28} />
          <p style={{ fontFamily: "'Lilita One', cursive", margin: "8px 0 0", color: BRAND.darkText, fontSize: 14 }}>Shop</p>
        </Card>
        <Card onClick={() => onNavigate("contact")} style={{ padding: 20, cursor: "pointer", textAlign: "center" }}>
          <PhoneIcon size={28} />
          <p style={{ fontFamily: "'Lilita One', cursive", margin: "8px 0 0", color: BRAND.darkText, fontSize: 14 }}>Contact</p>
        </Card>
      </div>
    </div>
  );
};

// ============================================
// BOOKING PAGE
// ============================================
const BookingPage = ({ settings, bookings, onBook, notify }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service: settings.services.find(s => s.enabled)?.id || "",
    houseSitType: "day", // "day" or "overnight" (only for housesit)
    dates: [], petName: "", petBreed: "", petCount: 1,
    ownerName: "", ownerPhone: "", ownerEmail: "", notes: "",
  });

  const selectedService = settings.services.find(s => s.id === form.service);
  const serviceType = selectedService?.type || "athome";
  const subType = form.houseSitType;

  // Price: use overnight price if applicable
  const activePrice = (serviceType === "housesit" && subType === "overnight")
    ? (selectedService?.priceOvernight || selectedService?.price || 0)
    : (selectedService?.price || 0);
  const totalEstimate = activePrice * form.dates.length * form.petCount;

  // Smart scheduling
  const scheduleMap = getScheduleMap(bookings, settings);

  // Calculate max pets/spots for selected dates
  const getMaxForDates = (dates) => {
    if (serviceType === "athome") {
      const maxPets = settings.maxPetsAtHome || 10;
      if (dates.length === 0) return maxPets;
      return Math.max(1, Math.min(...dates.map(d => {
        const avail = getDateAvailability(d, serviceType, subType, scheduleMap, settings);
        return avail.spotsLeft;
      })));
    }
    return 1; // house sits and visits are always 1 pet booking at a time
  };
  const maxPetsAllowed = serviceType === "athome" ? getMaxForDates(form.dates) : 1;

  const handleDateSelect = (dateStr) => {
    setForm(prev => {
      const exists = prev.dates.includes(dateStr);
      const newDates = exists ? prev.dates.filter(d => d !== dateStr) : [...prev.dates, dateStr].sort();
      const newMax = serviceType === "athome" ? getMaxForDates(newDates) : 1;
      return { ...prev, dates: newDates, petCount: Math.min(prev.petCount, Math.max(1, newMax)) };
    });
  };

  const handleServiceChange = (serviceId) => {
    setForm(prev => ({ ...prev, service: serviceId, dates: [], petCount: 1, houseSitType: "day" }));
  };

  const handleHouseSitToggle = (type) => {
    setForm(prev => ({ ...prev, houseSitType: type, dates: [] })); // clear dates since availability differs
  };

  const handleSubmit = () => {
    for (const date of form.dates) {
      const avail = getDateAvailability(date, serviceType, subType, scheduleMap, settings);
      if (!avail.available) {
        notify({ type: "error", message: `${new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${avail.reason}` });
        return;
      }
      if (serviceType === "athome" && form.petCount > avail.spotsLeft) {
        notify({ type: "error", message: `Not enough spots on ${new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Only ${avail.spotsLeft} available.` });
        return;
      }
    }

    const serviceName = serviceType === "housesit"
      ? `${selectedService?.name} (${subType === "overnight" ? "Overnight" : "Day Visit"})`
      : selectedService?.name;

    const booking = {
      id: `bk-${Date.now()}`, ...form,
      serviceName, pricePerDay: activePrice,
      totalEstimate, status: "pending", createdAt: new Date().toISOString(),
    };
    onBook(booking);
    notify({ type: "success", message: "Booking request submitted! We'll confirm soon." });
    notificationHelper.sendLocal("New Booking Request!", `${form.petName} - ${serviceName} - ${form.dates.length} days`, { tag: "booking" });
    emailNotifier.sendBookingNotification(booking, settings);
    setStep(4);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 24, margin: "0 0 4px" }}>Book a Stay</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: BRAND.lightText, fontSize: 14, margin: "0 0 24px" }}>
        {step < 4 ? `Step ${step} of 3` : "All done!"}
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? BRAND.red : `${BRAND.red}20`, transition: "background 0.3s" }} />)}
      </div>

      {step === 1 && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Choose Your Service</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {settings.services.filter(s => s.enabled).map(s => (
                <div key={s.id}>
                  <div onClick={() => handleServiceChange(s.id)} style={{
                    padding: 16, borderRadius: s.type === "housesit" && form.service === s.id ? "12px 12px 0 0" : 12, cursor: "pointer",
                    border: `2px solid ${form.service === s.id ? BRAND.red : "rgba(212,32,39,0.1)"}`,
                    borderBottom: s.type === "housesit" && form.service === s.id ? "none" : undefined,
                    background: form.service === s.id ? `${BRAND.red}08` : "transparent",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: BRAND.darkText, fontSize: 14 }}>{s.name}</span>
                      <span style={{ fontFamily: "'Lilita One', cursive", color: BRAND.red, fontSize: 16 }}>
                        {s.type === "housesit" ? `$${s.price}–$${s.priceOvernight || s.price}` : `$${s.price}`}/day
                      </span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "6px 0 0" }}>{s.description}</p>
                  </div>

                  {/* Day / Overnight toggle for house sitting */}
                  {s.type === "housesit" && form.service === s.id && (
                    <div style={{
                      border: `2px solid ${BRAND.red}`, borderTop: "none", borderRadius: "0 0 12px 12px",
                      padding: 14, background: `${BRAND.red}05`,
                    }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: BRAND.medText, margin: "0 0 10px" }}>What type of visit?</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[
                          { id: "day", label: "Day Visit", price: s.price, desc: "Daytime care" },
                          { id: "overnight", label: "Overnight Stay", price: s.priceOvernight || s.price, desc: "Sleep at your home" },
                        ].map(opt => (
                          <div key={opt.id} onClick={() => handleHouseSitToggle(opt.id)} style={{
                            flex: 1, padding: 12, borderRadius: 10, cursor: "pointer", textAlign: "center",
                            border: `2px solid ${form.houseSitType === opt.id ? BRAND.red : "rgba(212,32,39,0.15)"}`,
                            background: form.houseSitType === opt.id ? `${BRAND.red}12` : BRAND.white,
                          }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: form.houseSitType === opt.id ? BRAND.red : BRAND.darkText, display: "block" }}>{opt.label}</span>
                            <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.red, display: "block", margin: "4px 0 2px" }}>${opt.price}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: BRAND.lightText }}>{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Select Dates</h3>
            <Calendar selectedDates={form.dates} onSelectDate={handleDateSelect} blockedDates={settings.blockedDates}
              scheduleMap={scheduleMap} serviceType={serviceType} subType={subType} settings={settings} />
            {form.dates.length > 0 && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: `${BRAND.red}08`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText }}>{form.dates.length} day{form.dates.length > 1 ? "s" : ""} selected</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText }}>
                  {serviceType === "athome" ? `Up to ${maxPetsAllowed} pet${maxPetsAllowed !== 1 ? "s" : ""}` :
                   serviceType === "housesit" ? (subType === "overnight" ? "Overnight stay" : "Day visit") : "Visit"}
                </span>
              </div>
            )}
          </Card>
          <div style={{ marginTop: 20 }}>
            <Button size="lg" onClick={() => setStep(2)} disabled={!form.service || form.dates.length === 0} style={{ width: "100%" }}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Pet Details</h3>
            <Input label="Pet's Name" value={form.petName} onChange={e => setForm(p => ({ ...p, petName: e.target.value }))} placeholder="e.g. Barkley" />
            <Input label="Breed" value={form.petBreed} onChange={e => setForm(p => ({ ...p, petBreed: e.target.value }))} placeholder="e.g. Golden Retriever" />
            {serviceType === "athome" && (
              <Select label={`Number of Pets (max ${maxPetsAllowed} for selected dates)`} value={form.petCount}
                onChange={e => setForm(p => ({ ...p, petCount: parseInt(e.target.value) }))}
                options={Array.from({ length: maxPetsAllowed }, (_, i) => ({ value: i + 1, label: `${i + 1} pet${i > 0 ? "s" : ""}` }))} />
            )}
            <TextArea label="Special Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Allergies, medications, favorite toys..." />
          </Card>
          <Card>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Your Contact Info</h3>
            <Input label="Your Name" value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} placeholder="Full name" />
            <Input label="Phone" value={form.ownerPhone} onChange={e => setForm(p => ({ ...p, ownerPhone: e.target.value }))} placeholder="(555) 555-5555" type="tel" />
            <Input label="Email" value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} placeholder="you@email.com" type="email" />
          </Card>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <Button variant="secondary" size="lg" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
            <Button size="lg" onClick={() => setStep(3)} disabled={!form.petName || !form.ownerName || !form.ownerPhone} style={{ flex: 2 }}>Review Booking</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 20px" }}>Review Your Booking</h3>
            <div style={{ display: "grid", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>
              {[
                ["Service", serviceType === "housesit" ? `${selectedService?.name} (${subType === "overnight" ? "Overnight" : "Day Visit"})` : selectedService?.name],
                ["Dates", form.dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(", ")],
                ["Pet", `${form.petName} (${form.petBreed || "N/A"})`],
                ...(serviceType === "athome" ? [["# of Pets", form.petCount]] : []),
                ["Contact", `${form.ownerName} · ${form.ownerPhone}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, color: BRAND.lightText, fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 14, color: BRAND.darkText, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
              {form.notes && <div><span style={{ fontSize: 13, color: BRAND.lightText, fontWeight: 600 }}>Notes</span><p style={{ fontSize: 13, color: BRAND.medText, margin: "4px 0 0" }}>{form.notes}</p></div>}
            </div>
            <div style={{ marginTop: 20, padding: 16, background: `${BRAND.red}08`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: BRAND.darkText }}>Estimated Total</span>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 24, color: BRAND.red }}>${totalEstimate.toFixed(2)}</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, marginTop: 8 }}>Payment via Venmo or Zelle upon confirmation</p>
          </Card>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" size="lg" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</Button>
            <Button variant="success" size="lg" onClick={handleSubmit} style={{ flex: 2 }}><CheckIcon size={18} color={BRAND.white} /> Submit Request</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: BRAND.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckIcon size={32} color={BRAND.green} />
          </div>
          <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 22, color: BRAND.darkText, margin: "0 0 8px" }}>Request Submitted!</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.lightText, margin: "0 0 24px", lineHeight: 1.6 }}>We'll review your booking and get back to you shortly!</p>
          <Button onClick={() => { setStep(1); setForm(prev => ({ ...prev, dates: [], petName: "", petBreed: "", notes: "", petCount: 1 })); }}>Book Another Stay</Button>
        </Card>
      )}
    </div>
  );
};

// ============================================
// SHOP PAGE
// ============================================
const ShopPage = ({ products, settings }) => {
  return (
    <div>
      <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 24, margin: 0 }}>Shop</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: BRAND.lightText, fontSize: 13, margin: "4px 0 0 0" }}>Goodies for your good boy (or girl)</p>

      <div style={{ marginTop: 24 }}>
        {products.map(product => (
          <Card key={product.id} style={{ marginBottom: 16 }}>
            <div style={{ background: `linear-gradient(135deg, ${BRAND.cream} 0%, ${BRAND.warmGray} 100%)`, borderRadius: 12, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <PawIcon size={48} color={BRAND.red} />
                <p style={{ fontFamily: "'Lilita One', cursive", color: BRAND.red, fontSize: 18, margin: "8px 0 0" }}>{product.name}</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 20, color: BRAND.darkText, margin: 0 }}>{product.name}</h3>
                {product.inStock ? <Badge color={BRAND.green}>In Stock</Badge> : <Badge color={BRAND.lightText}>Out of Stock</Badge>}
              </div>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 24, color: BRAND.red }}>${product.price.toFixed(2)}</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.medText, lineHeight: 1.6, margin: "0 0 16px" }}>{product.description}</p>
            {product.inStock && product.paypalLink ? (
              <a href={product.paypalLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                <Button size="lg" style={{ width: "100%", background: "#0070BA" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z"/></svg>
                  Buy with PayPal
                </Button>
              </a>
            ) : product.inStock ? (
              <div style={{ padding: "12px 16px", background: `${BRAND.red}08`, borderRadius: 12, textAlign: "center" }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, margin: 0 }}>
                  Payment link coming soon! Contact us to order.
                </p>
              </div>
            ) : (
              <Button size="lg" disabled style={{ width: "100%" }}>Out of Stock</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CONTACT PAGE
// ============================================
const ContactPage = ({ settings }) => (
  <div>
    <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 24, margin: "0 0 24px" }}>Get in Touch</h2>
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.darkText, margin: "0 0 16px" }}>About Us</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: BRAND.medText, lineHeight: 1.7, margin: 0 }}>{settings.about}</p>
    </Card>
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.darkText, margin: "0 0 16px" }}>Contact</h3>
      <div style={{ display: "grid", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>
        {settings.phone && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><PhoneIcon size={18} /><a href={`tel:${settings.phone}`} style={{ color: BRAND.red, textDecoration: "none", fontWeight: 600 }}>{settings.phone}</a></div>}
        {settings.email && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 18 }}>✉</span><a href={`mailto:${settings.email}`} style={{ color: BRAND.red, textDecoration: "none", fontWeight: 600 }}>{settings.email}</a></div>}
        {settings.venmo && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 18, fontWeight: 700, color: BRAND.red }}>V</span><span style={{ color: BRAND.medText }}>Venmo: <strong>{settings.venmo}</strong></span></div>}
        {settings.zelle && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 18, fontWeight: 700, color: BRAND.red }}>Z</span><span style={{ color: BRAND.medText }}>Zelle: <strong>{settings.zelle}</strong></span></div>}
        {!settings.phone && !settings.email && <p style={{ color: BRAND.lightText, fontSize: 14 }}>Contact info coming soon! Book through the app in the meantime.</p>}
      </div>
    </Card>
  </div>
);

// ============================================
// ADMIN PAGE (PIN PROTECTED)
// ============================================
const AdminPage = ({ settings, onSaveSettings, bookings, onUpdateBooking, products, onSaveProducts, notify }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState("bookings");
  const [editSettings, setEditSettings] = useState({ ...settings });
  const [editProducts, setEditProducts] = useState([...products]);

  // Sync when settings/products change externally
  useEffect(() => { setEditSettings({ ...settings }); }, [settings]);
  useEffect(() => { setEditProducts([...products]); }, [products]);

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const handlePinSubmit = () => {
    if (pin === settings.adminPin) {
      setAuthenticated(true);
    } else {
      notify({ type: "error", message: "Wrong PIN. Try again." });
      setPin("");
    }
  };

  const saveSettings = () => { onSaveSettings(editSettings); notify({ type: "success", message: "Settings saved!" }); };
  const saveProducts = () => { onSaveProducts(editProducts); notify({ type: "success", message: "Products updated!" }); };

  const enableNotifications = async () => {
    const result = await notificationHelper.requestPermission();
    if (result === "granted") {
      onSaveSettings({ ...editSettings, notificationsEnabled: true });
      setEditSettings(p => ({ ...p, notificationsEnabled: true }));
      notify({ type: "success", message: "Notifications enabled! You'll get alerts for new bookings." });
      notificationHelper.sendLocal("Notifications Active!", "You'll now receive booking alerts.");
    } else {
      notify({ type: "error", message: "Notification permission denied. Enable in your browser settings." });
    }
  };

  if (!authenticated) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <SettingsIcon size={40} color={BRAND.lightText} />
        <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 20, color: BRAND.darkText, margin: "16px 0 8px" }}>Admin Access</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.lightText, margin: "0 0 24px" }}>Enter your PIN to manage your business</p>
        <div style={{ maxWidth: 200, margin: "0 auto" }}>
          <Input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter PIN"
            style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }}
            onKeyDown={e => e.key === "Enter" && handlePinSubmit()} />
          <Button size="lg" onClick={handlePinSubmit} style={{ width: "100%" }}>Enter</Button>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: BRAND.lightText, marginTop: 16 }}>Default PIN: 1234</p>
      </Card>
    );
  }

  const adminTabs = [
    { id: "bookings", label: "Bookings", badge: pendingCount || null },
    { id: "schedule", label: "Schedule" },
    { id: "services", label: "Services" },
    { id: "products", label: "Products" },
    { id: "info", label: "Info" },
    { id: "notifications", label: "Alerts" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 24, margin: 0 }}>Admin</h2>
        <button onClick={() => setAuthenticated(false)} style={{
          background: BRAND.warmGray, border: "none", borderRadius: 8, padding: "6px 14px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: BRAND.medText, cursor: "pointer"
        }}>Lock</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {adminTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            background: tab === t.id ? BRAND.red : BRAND.warmGray,
            color: tab === t.id ? BRAND.white : BRAND.medText,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.badge && <span style={{ background: tab === t.id ? BRAND.white : BRAND.red, color: tab === t.id ? BRAND.red : BRAND.white, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* BOOKINGS */}
      {tab === "bookings" && (
        <div>
          {bookings.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <PawIcon size={40} color={BRAND.lightText} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: BRAND.lightText, marginTop: 12 }}>No booking requests yet</p>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(booking => (
                <Card key={booking.id} style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, margin: 0, color: BRAND.darkText }}>{booking.petName} ({booking.petBreed || "N/A"})</h4>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "4px 0 0" }}>{booking.ownerName} · {booking.ownerPhone}</p>
                    </div>
                    <Badge color={booking.status === "confirmed" ? BRAND.green : booking.status === "declined" ? BRAND.red : "#E6A817"} bg={booking.status === "confirmed" ? BRAND.greenLight : booking.status === "declined" ? `${BRAND.red}10` : "#FFF3CD"}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, marginBottom: 12 }}>
                    <div><strong>Service:</strong> {booking.serviceName}</div>
                    <div><strong>Dates:</strong> {booking.dates?.map(d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(", ")}</div>
                    <div><strong>Pets:</strong> {booking.petCount} · <strong>Est:</strong> ${booking.totalEstimate?.toFixed(2)}</div>
                    {booking.notes && <div><strong>Notes:</strong> {booking.notes}</div>}
                    {booking.ownerEmail && <div><strong>Email:</strong> {booking.ownerEmail}</div>}
                  </div>
                  {booking.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="success" size="sm" onClick={async () => {
                        onUpdateBooking(booking.id, "confirmed");
                        notify({ type: "success", message: `Confirmed ${booking.petName}!` });
                        if (booking.ownerEmail) {
                          const sent = await emailNotifier.sendStatusUpdate(booking, "confirmed", settings);
                          if (sent) notify({ type: "success", message: `Confirmation email sent to ${booking.ownerName}!` });
                        }
                      }}><CheckIcon size={14} color={BRAND.white} /> Confirm</Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        onUpdateBooking(booking.id, "declined");
                        notify({ type: "error", message: `Declined ${booking.petName}` });
                        if (booking.ownerEmail) {
                          await emailNotifier.sendStatusUpdate(booking, "declined", settings);
                        }
                      }}><XIcon size={14} /> Decline</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE */}
      {tab === "schedule" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 8px" }}>At-Home Capacity Overview</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>
              Boarding + Day Care pets. Max: <strong>{editSettings.maxPetsAtHome} pets/day</strong>
            </p>
            <Calendar selectedDates={[]} onSelectDate={() => {}} blockedDates={editSettings.blockedDates}
              capacityMap={getBookedPetsPerDay(bookings)} maxCapacity={editSettings.maxPetsAtHome} showCapacity={true} />
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 8px" }}>Block Off Dates</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>Tap dates to block/unblock. Customers can't book blocked dates.</p>
            <Calendar selectedDates={editSettings.blockedDates} onSelectDate={(dateStr) => {
              const blocked = editSettings.blockedDates;
              const updated = blocked.includes(dateStr) ? blocked.filter(d => d !== dateStr) : [...blocked, dateStr];
              setEditSettings(prev => ({ ...prev, blockedDates: updated }));
            }} blockedDates={[]} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "12px 0 0" }}>{editSettings.blockedDates.length} date{editSettings.blockedDates.length !== 1 ? "s" : ""} blocked</p>
          </Card>

          <Card style={{ marginBottom: 16, background: `${BRAND.red}05` }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 4px" }}>🏠 At-Home Limits</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "0 0 16px" }}>Boarding + Day Care share this limit (husband manages at home)</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, fontWeight: 600, minWidth: 130 }}>Max Pets at Home</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxPetsAtHome: Math.max(1, p.maxPetsAtHome - 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 28, color: BRAND.red, minWidth: 30, textAlign: "center" }}>{editSettings.maxPetsAtHome}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxPetsAtHome: Math.min(20, p.maxPetsAtHome + 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>
          </Card>

          <Card style={{ marginBottom: 16, background: `${BRAND.red}05` }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 4px" }}>🚗 House Sitting Limits</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "0 0 16px" }}>These run independently from at-home bookings</p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, fontWeight: 600, minWidth: 130 }}>Day Visits / Day</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxHouseVisitsPerDay: Math.max(1, (p.maxHouseVisitsPerDay || 6) - 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 28, color: BRAND.red, minWidth: 30, textAlign: "center" }}>{editSettings.maxHouseVisitsPerDay || 6}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxHouseVisitsPerDay: Math.min(15, (p.maxHouseVisitsPerDay || 6) + 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, fontWeight: 600, minWidth: 130 }}>Overnights / Night</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxOvernightsPerNight: Math.max(1, (p.maxOvernightsPerNight || 1) - 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 28, color: BRAND.red, minWidth: 30, textAlign: "center" }}>{editSettings.maxOvernightsPerNight || 1}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxOvernightsPerNight: Math.min(5, (p.maxOvernightsPerNight || 1) + 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, fontWeight: 600, minWidth: 130 }}>Buffer Days</span>
              <button onClick={() => setEditSettings(p => ({ ...p, bufferDays: Math.max(0, (p.bufferDays || 0) - 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 28, color: BRAND.red, minWidth: 30, textAlign: "center" }}>{editSettings.bufferDays || 0}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, bufferDays: Math.min(5, (p.bufferDays || 0) + 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 20, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: BRAND.lightText, margin: "8px 0 0" }}>
              {(editSettings.bufferDays || 0) === 0 ? "No buffer — back-to-back overnights allowed" :
               `${editSettings.bufferDays} day${editSettings.bufferDays > 1 ? 's' : ''} blocked before & after overnight stays`}
            </p>
          </Card>

          <Card style={{ marginBottom: 16, background: `${BRAND.red}05` }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 12px" }}>How It Works</h3>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, lineHeight: 1.8 }}>
              <div>🏠 <strong>Boarding + Day Care</strong> share the at-home pet limit</div>
              <div>🚗 <strong>House Sitting</strong> runs independently (husband watches home dogs)</div>
              <div>☀️ <strong>Day Visits</strong> don't block <strong>Overnight Stays</strong></div>
              <div>🌙 <strong>Overnights</strong> get buffer days for travel/cleanup</div>
              <div>🐕 <strong>Drop-In Visits</strong> — always available, no limits</div>
            </div>
          </Card>
          <Button size="lg" onClick={saveSettings} style={{ width: "100%" }}>Save Schedule</Button>
        </div>
      )}

      {/* SERVICES */}
      {tab === "services" && (
        <div>
          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            {editSettings.services.map((s, idx) => (
              <Card key={s.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, margin: 0, color: BRAND.darkText, fontSize: 14 }}>{s.name}</h4>
                  <button onClick={() => {
                    const updated = [...editSettings.services]; updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                    setEditSettings(p => ({ ...p, services: updated }));
                  }} style={{ padding: "4px 14px", borderRadius: 16, border: "none", cursor: "pointer", background: s.enabled ? BRAND.greenLight : BRAND.warmGray, color: s.enabled ? BRAND.green : BRAND.lightText, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12 }}>
                    {s.enabled ? "Active" : "Off"}
                  </button>
                </div>
                <Input label="Price/day ($)" type="number" value={s.price} onChange={e => {
                  const updated = [...editSettings.services]; updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                  setEditSettings(p => ({ ...p, services: updated }));
                }} />
                {s.type === "housesit" && (
                  <Input label="Overnight Price/night ($)" type="number" value={s.priceOvernight || ""} onChange={e => {
                    const updated = [...editSettings.services]; updated[idx] = { ...updated[idx], priceOvernight: parseFloat(e.target.value) || 0 };
                    setEditSettings(p => ({ ...p, services: updated }));
                  }} />
                )}
                <TextArea label="Description" value={s.description} onChange={e => {
                  const updated = [...editSettings.services]; updated[idx] = { ...updated[idx], description: e.target.value };
                  setEditSettings(p => ({ ...p, services: updated }));
                }} style={{ minHeight: 60 }} />
              </Card>
            ))}
          </div>
          <Button size="lg" onClick={saveSettings} style={{ width: "100%" }}>Save Services</Button>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "products" && (
        <div>
          {editProducts.map((p, idx) => (
            <Card key={p.id} style={{ marginBottom: 16 }}>
              <Input label="Name" value={p.name} onChange={e => { const u = [...editProducts]; u[idx] = { ...u[idx], name: e.target.value }; setEditProducts(u); }} />
              <Input label="Price ($)" type="number" step="0.01" value={p.price} onChange={e => { const u = [...editProducts]; u[idx] = { ...u[idx], price: parseFloat(e.target.value) || 0 }; setEditProducts(u); }} />
              <TextArea label="Description" value={p.description} onChange={e => { const u = [...editProducts]; u[idx] = { ...u[idx], description: e.target.value }; setEditProducts(u); }} />
              <Input label="PayPal Checkout Link" value={p.paypalLink || ""} onChange={e => { const u = [...editProducts]; u[idx] = { ...u[idx], paypalLink: e.target.value }; setEditProducts(u); }} placeholder="https://www.paypal.com/ncp/payment/..." />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: BRAND.lightText, margin: "-10px 0 12px 0" }}>
                Create a PayPal.Me link or PayPal checkout button at paypal.com/buttons and paste the URL here
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText }}>In Stock</span>
                <button onClick={() => { const u = [...editProducts]; u[idx] = { ...u[idx], inStock: !u[idx].inStock }; setEditProducts(u); }} style={{
                  padding: "4px 14px", borderRadius: 16, border: "none", cursor: "pointer",
                  background: p.inStock ? BRAND.greenLight : BRAND.warmGray,
                  color: p.inStock ? BRAND.green : BRAND.lightText,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
                }}>{p.inStock ? "Yes" : "No"}</button>
              </div>
            </Card>
          ))}
          <Button size="lg" onClick={saveProducts} style={{ width: "100%" }}>Save Products</Button>
        </div>
      )}

      {/* BUSINESS INFO */}
      {tab === "info" && (
        <div>
          <Card>
            <Input label="Business Name" value={editSettings.ownerName} onChange={e => setEditSettings(p => ({ ...p, ownerName: e.target.value }))} />
            <Input label="Phone" value={editSettings.phone} onChange={e => setEditSettings(p => ({ ...p, phone: e.target.value }))} />
            <Input label="Email" value={editSettings.email} onChange={e => setEditSettings(p => ({ ...p, email: e.target.value }))} />
            <Input label="Venmo Handle" value={editSettings.venmo} onChange={e => setEditSettings(p => ({ ...p, venmo: e.target.value }))} placeholder="@username" />
            <Input label="Zelle" value={editSettings.zelle} onChange={e => setEditSettings(p => ({ ...p, zelle: e.target.value }))} />
            <TextArea label="About / Bio" value={editSettings.about} onChange={e => setEditSettings(p => ({ ...p, about: e.target.value }))} />
            <Input label="Admin PIN" value={editSettings.adminPin} onChange={e => setEditSettings(p => ({ ...p, adminPin: e.target.value }))} type="password" />
          </Card>
          <Button size="lg" onClick={saveSettings} style={{ width: "100%", marginTop: 16 }}>Save Info</Button>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab === "notifications" && (
        <div>
          {/* EMAIL NOTIFICATIONS - PRIMARY */}
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.darkText, margin: "0 0 4px" }}>Email Notifications</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>
              Get notified via Outlook when someone books. Your client gets a confirmation too!
            </p>

            {editSettings.emailjs?.enabled ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Badge color={BRAND.green}>Email Alerts Active</Badge>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, marginBottom: 16, lineHeight: 1.6 }}>
                  <div>✅ <strong>Your notification:</strong> {editSettings.emailjs?.ownerTemplateId ? "Connected" : "Not set"}</div>
                  <div>✅ <strong>Client confirmation:</strong> {editSettings.emailjs?.clientTemplateId ? "Connected" : "Not set"}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={async () => {
                  notify({ type: "success", message: "Sending test emails..." });
                  const ok = await emailNotifier.sendTest(editSettings);
                  if (ok) notify({ type: "success", message: "Test emails sent! Check your Outlook." });
                  else notify({ type: "error", message: "Failed to send. Check your settings." });
                }} style={{ width: "100%", marginBottom: 12 }}>
                  Send Test Emails
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditSettings(p => ({ ...p, emailjs: { ...p.emailjs, enabled: false } }));
                }} style={{ width: "100%" }}>
                  Edit Settings
                </Button>
              </div>
            ) : (
              <div>
                <div style={{
                  background: BRAND.warmGray, borderRadius: 12, padding: 16, marginBottom: 16,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, lineHeight: 1.7,
                }}>
                  <strong style={{ color: BRAND.darkText }}>Quick Setup (5 min):</strong><br />
                  1. Go to <strong>emailjs.com</strong> → Create free account (200 emails/mo free)<br />
                  2. <strong>"Email Services"</strong> → Add New → Choose <strong>Outlook</strong> → Connect<br />
                  3. <strong>"Email Templates"</strong> → Create <strong>2 templates</strong>:<br />
                  <div style={{ paddingLeft: 16, margin: "6px 0" }}>
                    <strong>Template A</strong> — Your notification (booking details to you)<br />
                    <strong>Template B</strong> — Client confirmation (receipt to customer)
                  </div>
                  4. See the <strong>EMAILJS_SETUP.md</strong> file for ready-to-paste HTML templates<br />
                  5. Paste the 4 IDs below!
                </div>

                <Input label="Service ID" value={editSettings.emailjs?.serviceId || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), serviceId: e.target.value } }))}
                  placeholder="e.g. service_abc123" />
                <Input label="Owner Notification Template ID" value={editSettings.emailjs?.ownerTemplateId || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), ownerTemplateId: e.target.value } }))}
                  placeholder="e.g. template_owner789" />
                <Input label="Client Confirmation Template ID" value={editSettings.emailjs?.clientTemplateId || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), clientTemplateId: e.target.value } }))}
                  placeholder="e.g. template_client456 (optional)" />
                <Input label="Booking Confirmed Template ID" value={editSettings.emailjs?.confirmTemplateId || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), confirmTemplateId: e.target.value } }))}
                  placeholder="e.g. template_confirm123 (optional)" />
                <Input label="Booking Declined Template ID" value={editSettings.emailjs?.declineTemplateId || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), declineTemplateId: e.target.value } }))}
                  placeholder="e.g. template_decline456 (optional)" />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: BRAND.lightText, margin: "-10px 0 12px" }}>
                  Confirm/decline templates email the client when you approve or reject their booking
                </p>
                <Input label="Public Key" value={editSettings.emailjs?.publicKey || ""}
                  onChange={e => setEditSettings(p => ({ ...p, emailjs: { ...(p.emailjs || {}), publicKey: e.target.value } }))}
                  placeholder="e.g. AbCdEfGhIjKlMn" />

                <Button size="lg" onClick={async () => {
                  const ejs = editSettings.emailjs || {};
                  if (!ejs.serviceId || !ejs.ownerTemplateId || !ejs.publicKey) {
                    notify({ type: "error", message: "Please fill in Service ID, Owner Template ID, and Public Key." });
                    return;
                  }
                  notify({ type: "success", message: "Testing connection..." });
                  const ok = await emailNotifier.sendTest(editSettings);
                  if (ok) {
                    const updated = { ...editSettings, emailjs: { ...ejs, enabled: true } };
                    setEditSettings(updated);
                    onSaveSettings(updated);
                    notify({ type: "success", message: "Email alerts active! Check your Outlook for test emails." });
                  } else {
                    notify({ type: "error", message: "Connection failed. Double-check your IDs." });
                  }
                }} style={{ width: "100%" }}>
                  Test & Enable Email Alerts
                </Button>
              </div>
            )}
          </Card>

          {/* BROWSER PUSH - SECONDARY */}
          <Card>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.darkText, margin: "0 0 4px" }}>Browser Notifications</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>
              Also get pop-up alerts when you have the app open in your browser.
            </p>
            {editSettings.notificationsEnabled ? (
              <Badge color={BRAND.green}>Browser Alerts Active</Badge>
            ) : (
              <Button variant="outline" size="md" onClick={enableNotifications} style={{ width: "100%" }}>
                <BellIcon size={18} /> Enable Browser Alerts
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => notificationHelper.sendLocal("Test Notification", "If you see this, browser notifications are working!")} style={{ width: "100%", marginTop: 12 }}>
              Test Browser Alert
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
function RuffLyfeApp() {
  const [page, setPage] = useState("home");
  const [settings, saveSettings] = useStorage("rufflyfe-settings", DEFAULT_SETTINGS);
  const [bookings, saveBookings] = useStorage("rufflyfe-bookings", []);
  const [products, saveProducts] = useStorage("rufflyfe-products", DEFAULT_PRODUCTS);
  const [notifications, setNotifications] = useState([]);

  const notify = (n) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...n, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== id)), 4000);
  };

  const handleBook = (booking) => saveBookings([...bookings, booking]);
  const handleUpdateBooking = (id, status) => saveBookings(bookings.map(b => b.id === id ? { ...b, status } : b));

  const navItems = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "booking", icon: CalendarIcon, label: "Book" },
    { id: "shop", icon: ShopIcon, label: "Shop" },
    { id: "contact", icon: PhoneIcon, label: "Contact" },
    { id: "admin", icon: SettingsIcon, label: "Admin" },
  ];

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: BRAND.cream, fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        input:focus, textarea:focus, select:focus { border-color: ${BRAND.red} !important; box-shadow: 0 0 0 3px rgba(212,32,39,0.1) !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <NotificationBanner notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(x => x.id !== id))} />

      {/* Header */}
      <div style={{
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: BRAND.white, borderBottom: `1px solid rgba(212,32,39,0.08)`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("home")}>
          <img src="/icon-96x96.png" alt="Ruff Lyfe" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div>
            <h1 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.red, margin: 0, lineHeight: 1 }}>Ruff Lyfe</h1>
            <span style={{ fontSize: 9, color: BRAND.lightText, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Pet Services</span>
          </div>
        </div>
        {page === "admin" && <Badge color={BRAND.green}>Admin</Badge>}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px 100px" }}>
        {page === "home" && <HomePage settings={settings} onNavigate={setPage} />}
        {page === "booking" && <BookingPage settings={settings} bookings={bookings} onBook={handleBook} notify={notify} />}
        {page === "shop" && <ShopPage products={products} settings={settings} />}
        {page === "contact" && <ContactPage settings={settings} />}
        {page === "admin" && <AdminPage settings={settings} onSaveSettings={saveSettings} bookings={bookings} onUpdateBooking={handleUpdateBooking} products={products} onSaveProducts={saveProducts} notify={notify} />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: BRAND.white,
        borderTop: `1px solid rgba(212,32,39,0.08)`,
        display: "flex", justifyContent: "space-around", padding: "8px 0 max(12px, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.04)", zIndex: 100,
      }}>
        {navItems.map(item => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "4px 12px", position: "relative",
            }}>
              {active && <div style={{ position: "absolute", top: -8, width: 24, height: 3, borderRadius: 2, background: BRAND.red }} />}
              <Icon size={22} color={active ? BRAND.red : BRAND.lightText} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: active ? BRAND.red : BRAND.lightText }}>{item.label}</span>
              {item.id === "admin" && pendingCount > 0 && (
                <div style={{ position: "absolute", top: 2, right: 6, width: 8, height: 8, borderRadius: 4, background: BRAND.red }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(RuffLyfeApp));
