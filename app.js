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
// ICONS
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
  maxPetsAtHome: 4,
  bufferDays: 1, // transition day between house sits or after boarding ends
  services: [
    { id: "boarding", name: "Boarding (at my home)", price: 45, enabled: true, description: "Your pup stays at my place with 24/7 care, walks, and lots of love.", type: "boarding" },
    { id: "housesitting", name: "House Sitting (at your home)", price: 55, enabled: true, description: "I come to your home so your pet stays in their comfort zone.", type: "housesitting" },
    { id: "daycare", name: "Doggy Day Care", price: 30, enabled: true, description: "Drop off in the morning, pick up in the evening. Fun guaranteed!", type: "boarding" },
    { id: "walkvisit", name: "Drop-In Visit / Walk", price: 20, enabled: true, description: "A 30-minute check-in, walk, and potty break.", type: "visit" },
  ],
  blockedDates: [],
  businessHours: { start: "08:00", end: "20:00" },
  ownerName: "Ruff Lyfe Pet Services",
  phone: "", email: "", venmo: "", zelle: "",
  about: "We treat your fur babies like family! Whether your pup is hanging at our place or we're coming to yours, every pet gets personalized attention, belly rubs, and the best care around.",
  notificationsEnabled: false,
  adminPin: "1234",
};

const DEFAULT_PRODUCTS = [
  {
    id: "boop-butter-1", name: "Boop Butter", price: 12.99,
    description: "All-natural, soothing nose balm for dry or cracked snoots. Made with shea butter, coconut oil, and vitamin E. Safe if licked!",
    inStock: true,
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
// SCHEDULING ENGINE - handles conflicts, capacity, and buffers
// ============================================

// Helper: add/subtract days from a date string
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// Get detailed schedule info per day
const getScheduleMap = (bookings, settings) => {
  const map = {}; // dateStr -> { petCount, serviceTypes: Set, bookingIds: [], isBuffer: false, hasHouseSit: false, hasBoarding: false }
  const bufferDays = settings.bufferDays || 0;
  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");

  activeBookings.forEach(b => {
    const serviceConfig = settings.services.find(s => s.id === b.service);
    const serviceType = serviceConfig?.type || "boarding";

    (b.dates || []).forEach(date => {
      if (!map[date]) map[date] = { petCount: 0, serviceTypes: new Set(), bookingIds: [], isBuffer: false, hasHouseSit: false, hasBoarding: false };
      map[date].petCount += (b.petCount || 1);
      map[date].serviceTypes.add(serviceType);
      map[date].bookingIds.push(b.id);
      if (serviceType === "housesitting") map[date].hasHouseSit = true;
      if (serviceType === "boarding" || serviceType === "visit") map[date].hasBoarding = true;
    });

    // Add buffer days around the booking
    if (bufferDays > 0 && b.dates && b.dates.length > 0) {
      const sorted = [...b.dates].sort();
      const firstDate = sorted[0];
      const lastDate = sorted[sorted.length - 1];

      for (let i = 1; i <= bufferDays; i++) {
        const beforeDate = addDays(firstDate, -i);
        const afterDate = addDays(lastDate, i);

        // Buffer BEFORE the booking
        if (!map[beforeDate]) map[beforeDate] = { petCount: 0, serviceTypes: new Set(), bookingIds: [], isBuffer: false, hasHouseSit: false, hasBoarding: false };
        if (serviceType === "housesitting") {
          map[beforeDate].isBuffer = true;
          map[beforeDate].bufferFor = "housesit";
        }

        // Buffer AFTER the booking
        if (!map[afterDate]) map[afterDate] = { petCount: 0, serviceTypes: new Set(), bookingIds: [], isBuffer: false, hasHouseSit: false, hasBoarding: false };
        if (serviceType === "housesitting") {
          map[afterDate].isBuffer = true;
          map[afterDate].bufferFor = "housesit";
        }
      }
    }
  });

  return map;
};

// Check if a date is available for a specific service type
const getDateAvailability = (dateStr, serviceType, scheduleMap, settings) => {
  const day = scheduleMap[dateStr];
  const maxCapacity = settings.maxPetsAtHome || 10;

  // No bookings on this day - fully available
  if (!day) return { available: true, reason: null, spotsLeft: serviceType === "housesitting" ? 1 : maxCapacity };

  // Buffer day from a house sit
  if (day.isBuffer && day.bufferFor === "housesit") {
    if (serviceType === "housesitting") return { available: false, reason: "Buffer day (transition time)", spotsLeft: 0 };
    // Boarding/visits can still happen on buffer days
  }

  // CONFLICT: House sitting blocks everything else (she's away from home)
  if (day.hasHouseSit) {
    return { available: false, reason: "House sitting booked (away from home)", spotsLeft: 0 };
  }

  // CONFLICT: If requesting house sitting but boarding/visits exist
  if (serviceType === "housesitting" && (day.hasBoarding || day.petCount > 0)) {
    return { available: false, reason: "Already has boarding/visits (can't leave home)", spotsLeft: 0 };
  }

  // House sitting - only 1 at a time
  if (serviceType === "housesitting") {
    return { available: true, reason: null, spotsLeft: 1 };
  }

  // Boarding/daycare - check pet capacity
  const spotsLeft = maxCapacity - day.petCount;
  if (spotsLeft <= 0) return { available: false, reason: "At max capacity", spotsLeft: 0 };

  // Visits are lightweight - always available if no house sit
  if (serviceType === "visit") return { available: true, reason: null, spotsLeft: maxCapacity };

  return { available: true, reason: null, spotsLeft };
};

// Legacy helper for simple pet count (used by admin overview)
const getBookedPetsPerDay = (bookings) => {
  const counts = {};
  bookings.forEach(b => {
    if (b.status === "confirmed" || b.status === "pending") {
      (b.dates || []).forEach(date => {
        counts[date] = (counts[date] || 0) + (b.petCount || 1);
      });
    }
  });
  return counts;
};

// ============================================
// CALENDAR
// ============================================
const Calendar = ({ selectedDates, onSelectDate, blockedDates = [], capacityMap = {}, maxCapacity = 0, showCapacity = false, scheduleMap = {}, serviceType = null, settings = null }) => {
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
            const avail = getDateAvailability(dateStr, serviceType, scheduleMap, settings);
            isUnavailable = !avail.available;
            spotsLeft = avail.spotsLeft;
            isBuffer = scheduleMap[dateStr]?.isBuffer && !scheduleMap[dateStr]?.hasHouseSit;
            isAlmostFull = avail.available && serviceType !== "visit" && serviceType !== "housesitting" && spotsLeft <= (settings.maxPetsAtHome || 10) * 0.3;
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
    dates: [], petName: "", petBreed: "", petCount: 1,
    ownerName: "", ownerPhone: "", ownerEmail: "", notes: "",
  });

  const selectedService = settings.services.find(s => s.id === form.service);
  const serviceType = selectedService?.type || "boarding";
  const totalEstimate = (selectedService?.price || 0) * form.dates.length * form.petCount;

  // Smart scheduling
  const scheduleMap = getScheduleMap(bookings, settings);
  const maxCapacity = settings.maxPetsAtHome || 10;

  // Calculate the minimum spots available across all selected dates for this service type
  const minSpotsOnSelectedDates = form.dates.length > 0
    ? Math.min(...form.dates.map(d => {
        const avail = getDateAvailability(d, serviceType, scheduleMap, settings);
        return avail.spotsLeft;
      }))
    : (serviceType === "housesitting" ? 1 : maxCapacity);
  const maxPetsAllowed = serviceType === "housesitting" ? 1 : Math.max(1, Math.min(minSpotsOnSelectedDates, maxCapacity));

  const handleDateSelect = (dateStr) => {
    setForm(prev => {
      const exists = prev.dates.includes(dateStr);
      const newDates = exists ? prev.dates.filter(d => d !== dateStr) : [...prev.dates, dateStr].sort();
      // Recalculate max pets when dates change
      const newSvcType = settings.services.find(s => s.id === prev.service)?.type || "boarding";
      const newMinSpots = newDates.length > 0
        ? Math.min(...newDates.map(d => getDateAvailability(d, newSvcType, scheduleMap, settings).spotsLeft))
        : (newSvcType === "housesitting" ? 1 : maxCapacity);
      const newMax = newSvcType === "housesitting" ? 1 : Math.max(1, newMinSpots);
      const newPetCount = Math.min(prev.petCount, newMax);
      return { ...prev, dates: newDates, petCount: Math.max(1, newPetCount) };
    });
  };

  // When service changes, clear dates (different availability)
  const handleServiceChange = (serviceId) => {
    setForm(prev => ({ ...prev, service: serviceId, dates: [], petCount: 1 }));
  };

  const handleSubmit = () => {
    // Final conflict check
    const svcType = selectedService?.type || "boarding";
    for (const date of form.dates) {
      const avail = getDateAvailability(date, svcType, scheduleMap, settings);
      if (!avail.available) {
        notify({ type: "error", message: `${new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${avail.reason}` });
        return;
      }
      if (svcType !== "visit" && svcType !== "housesitting" && form.petCount > avail.spotsLeft) {
        notify({ type: "error", message: `Not enough spots on ${new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Only ${avail.spotsLeft} available.` });
        return;
      }
    }
    const booking = {
      id: `bk-${Date.now()}`, ...form,
      serviceName: selectedService?.name, pricePerDay: selectedService?.price,
      totalEstimate, status: "pending", createdAt: new Date().toISOString(),
    };
    onBook(booking);
    notify({ type: "success", message: "Booking request submitted! We'll confirm soon." });
    notificationHelper.sendLocal("New Booking Request!", `${form.petName} - ${selectedService?.name} - ${form.dates.length} days`, { tag: "booking" });
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
                <div key={s.id} onClick={() => handleServiceChange(s.id)} style={{
                  padding: 16, borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${form.service === s.id ? BRAND.red : "rgba(212,32,39,0.1)"}`,
                  background: form.service === s.id ? `${BRAND.red}08` : "transparent",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: BRAND.darkText, fontSize: 14 }}>{s.name}</span>
                    <span style={{ fontFamily: "'Lilita One', cursive", color: BRAND.red, fontSize: 16 }}>${s.price}/day</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "6px 0 0" }}>{s.description}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Select Dates</h3>
            <Calendar selectedDates={form.dates} onSelectDate={handleDateSelect} blockedDates={settings.blockedDates}
              scheduleMap={scheduleMap} serviceType={serviceType} settings={settings} />
            {form.dates.length > 0 && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: `${BRAND.red}08`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText }}>{form.dates.length} day{form.dates.length > 1 ? "s" : ""} selected</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText }}>
                  {serviceType === "housesitting" ? "House sit (exclusive)" : serviceType === "visit" ? "Visit" : `Up to ${maxPetsAllowed} pet${maxPetsAllowed !== 1 ? "s" : ""}`}
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
            <Select label={`Number of Pets (max ${maxPetsAllowed} for selected dates)`} value={form.petCount}
              onChange={e => setForm(p => ({ ...p, petCount: parseInt(e.target.value) }))}
              options={Array.from({ length: maxPetsAllowed }, (_, i) => ({ value: i + 1, label: `${i + 1} pet${i > 0 ? "s" : ""}` }))} />
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
                ["Service", selectedService?.name],
                ["Dates", form.dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(", ")],
                ["Pet", `${form.petName} (${form.petBreed || "N/A"})`],
                ["# of Pets", form.petCount],
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
const ShopPage = ({ products, settings, notify }) => {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", email: "" });
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    notify({ type: "success", message: `${product.name} added to cart!` });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const submitOrder = () => {
    notificationHelper.sendLocal("New Product Order!", `${cart.map(i => `${i.name} x${i.qty}`).join(", ")} - $${cartTotal.toFixed(2)}`, { tag: "order" });
    notify({ type: "success", message: "Order request sent!" });
    setOrderSubmitted(true);
  };

  if (orderSubmitted) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: BRAND.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckIcon size={32} color={BRAND.green} />
        </div>
        <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 22, color: BRAND.darkText, margin: "0 0 8px" }}>Order Sent!</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.lightText, lineHeight: 1.6 }}>We'll send you payment details shortly.</p>
        <Button onClick={() => { setOrderSubmitted(false); setCart([]); setShowCart(false); }} style={{ marginTop: 20 }}>Continue Shopping</Button>
      </Card>
    );
  }

  if (showCart) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.red }}><ChevronLeft size={24} /></button>
          <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 22, margin: 0 }}>Your Cart</h2>
        </div>
        {cart.map(item => (
          <Card key={item.id} style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, margin: 0, color: BRAND.darkText }}>{item.name}</h4>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText }}>${item.price.toFixed(2)} x {item.qty}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.red }}>${(item.price * item.qty).toFixed(2)}</span>
                <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ background: "none", border: "none", cursor: "pointer" }}><XIcon size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
        <div style={{ padding: 16, background: `${BRAND.red}08`, borderRadius: 12, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Total</span>
          <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 24, color: BRAND.red }}>${cartTotal.toFixed(2)}</span>
        </div>
        <Card>
          <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 16px" }}>Contact Info</h3>
          <Input label="Name" value={orderForm.name} onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Phone" value={orderForm.phone} onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "0 0 16px" }}>Payment collected via Venmo/Zelle after confirmation</p>
          <Button size="lg" onClick={submitOrder} disabled={!orderForm.name || !orderForm.phone} style={{ width: "100%" }}>Request Purchase</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Lilita One', cursive", color: BRAND.darkText, fontSize: 24, margin: 0 }}>Shop</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: BRAND.lightText, fontSize: 13, margin: "4px 0 0" }}>Goodies for your good boy (or girl)</p>
        </div>
        {cart.length > 0 && <Button variant="outline" size="sm" onClick={() => setShowCart(true)}>Cart ({cart.reduce((s, i) => s + i.qty, 0)})</Button>}
      </div>
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
          <Button size="md" onClick={() => addToCart(product)} disabled={!product.inStock} style={{ width: "100%" }}>
            <ShopIcon size={16} color={BRAND.white} /> Add to Cart
          </Button>
        </Card>
      ))}
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
                      <Button variant="success" size="sm" onClick={() => {
                        onUpdateBooking(booking.id, "confirmed");
                        notify({ type: "success", message: `Confirmed ${booking.petName}!` });
                      }}><CheckIcon size={14} color={BRAND.white} /> Confirm</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        onUpdateBooking(booking.id, "declined");
                        notify({ type: "error", message: `Declined ${booking.petName}` });
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
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 8px" }}>Daily Capacity Overview</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>
              Colored dots show how booked each day is. Max: <strong>{editSettings.maxPetsAtHome} pets/day</strong>
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
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 8px" }}>Max Pets Per Day</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>When this limit is reached, the day auto-blocks for new customers.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setEditSettings(p => ({ ...p, maxPetsAtHome: Math.max(1, p.maxPetsAtHome - 1) }))} style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 22, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 36, color: BRAND.red, minWidth: 40, textAlign: "center" }}>{editSettings.maxPetsAtHome}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, maxPetsAtHome: Math.min(20, p.maxPetsAtHome + 1) }))} style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 22, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 8px" }}>Buffer Days</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.lightText, margin: "0 0 16px" }}>
              Transition time before and after house sits. Gives you time to travel, clean up, and reset.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setEditSettings(p => ({ ...p, bufferDays: Math.max(0, (p.bufferDays || 0) - 1) }))} style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 22, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>−</button>
              <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 36, color: BRAND.red, minWidth: 40, textAlign: "center" }}>{editSettings.bufferDays || 0}</span>
              <button onClick={() => setEditSettings(p => ({ ...p, bufferDays: Math.min(5, (p.bufferDays || 0) + 1) }))} style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${BRAND.red}`, background: "transparent", color: BRAND.red, fontSize: 22, cursor: "pointer", fontFamily: "'Lilita One', cursive" }}>+</button>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.lightText, margin: "12px 0 0" }}>
              {(editSettings.bufferDays || 0) === 0 ? "No buffer — back-to-back bookings allowed" :
               `${editSettings.bufferDays} day${editSettings.bufferDays > 1 ? 's' : ''} blocked before & after each house sit`}
            </p>
          </Card>
          <Card style={{ marginBottom: 16, background: `${BRAND.red}05` }}>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: BRAND.darkText, margin: "0 0 12px" }}>Smart Scheduling Rules</h3>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.medText, lineHeight: 1.8 }}>
              <div>✅ <strong>Boarding + Day Care</strong> — can overlap (up to max pets)</div>
              <div>✅ <strong>Drop-In Visits</strong> — always available alongside boarding</div>
              <div>🚫 <strong>House Sitting</strong> — blocks all other services (you're away)</div>
              <div>🚫 <strong>Boarding blocks House Sitting</strong> — can't leave pets at home</div>
              <div>⏳ <strong>Buffer days</strong> — auto-blocked around house sits</div>
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
          <Card>
            <h3 style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: BRAND.darkText, margin: "0 0 12px" }}>Push Notifications</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.medText, lineHeight: 1.6, margin: "0 0 20px" }}>
              Get notified on your phone when new booking requests or product orders come in.
            </p>
            {editSettings.notificationsEnabled ? (
              <Badge color={BRAND.green}>Notifications Active</Badge>
            ) : (
              <Button size="lg" onClick={enableNotifications} style={{ width: "100%" }}>
                <BellIcon size={18} color={BRAND.white} /> Enable Notifications
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => notificationHelper.sendLocal("Test Notification", "If you see this, notifications are working!")} style={{ width: "100%", marginTop: 12 }}>
              Send Test Notification
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
        {page === "shop" && <ShopPage products={products} settings={settings} notify={notify} />}
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
