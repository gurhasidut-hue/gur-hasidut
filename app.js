/* =========================================================================
   חסידות גור — נתוני האפליקציה
   התוכן נטען בפועל מ-Firestore (ראו loadData למטה). האובייקט DEFAULT_DATA
   כאן משמש כגיבוי: הוא נטען אם אין חיבור לאינטרנט/Firestore, וגם משמש
   לזריעת המסד הנתונים בפעם הראשונה שהוא ריק.
   ========================================================================= */

import { db, doc, getDoc, setDoc } from "./firebase-init.js";

const DEFAULT_DATA = {

  /* ---- זמני תפילות ---- */
  tefillos: [
    {
      group: "ימי חול",
      rows: [
        { name: "שחרית (מנין א')", time: "06:15" },
        { name: "שחרית (מנין ב')", time: "07:30" },
        { name: "מנחה", time: "13:45" },
        { name: "מנחה גדולה", time: "19:15" },
        { name: "ערבית", time: "20:15" }
      ]
    },
    {
      group: "ערב שבת קודש",
      rows: [
        { name: "מנחה וקבלת שבת", time: "כניסת השבת + 5 דק'", note: "השעה משתנה משבוע לשבוע" }
      ]
    },
    {
      group: "שבת קודש",
      rows: [
        { name: "שחרית", time: "08:30" },
        { name: "מנחה", time: "שעה לפני השקיעה" },
        { name: "ערבית ומוצאי שבת", time: "לפי צאת השבת" }
      ]
    },
    {
      group: "ראש חודש",
      rows: [
        { name: "שחרית (עם הלל)", time: "06:00" }
      ]
    }
  ],

  /* ---- שעות קבלת קהל ---- */
  kabbalasKahal: [
    {
      name: "הרב שליט\"א",
      role: "רב הקהילה",
      days: "ימי שני, מ־20:00 עד 22:00",
      location: "בית הרב",
      note: "יש לתאם תור מראש אצל הגבאי",
      phone: ""
    },
    {
      name: "הגבאי",
      role: "גבאות בית המדרש",
      days: "בכל יום, לאחר תפילת ערבית",
      location: "בית המדרש",
      phone: ""
    },
    {
      name: "ועד הקהילה",
      role: "ענייני קהילה כלליים",
      days: "ימי שלישי, 19:00–20:30",
      location: "משרדי הקהילה",
      phone: ""
    },
    {
      name: "קופת חסד",
      role: "הלוואות ותמיכה",
      days: "ימי רביעי, 18:00–19:30",
      location: "משרדי הקהילה",
      phone: ""
    }
  ],

  /* ---- אלפון ----
     category: קטגוריה לסינון (הנהלה / גבאים / חינוך / חסד / נוער וכו') */
  phonebook: [
    { name: "משרד הקהילה", role: "מזכירות ופניות כלליות", category: "הנהלה", phone: "03-0000000" },
    { name: "הגבאי הראשי", role: "גבאות בית המדרש", category: "גבאים", phone: "050-0000000" },
    { name: "קופת חסד", role: "הלוואות ותמיכה כלכלית", category: "חסד", phone: "050-0000001" },
    { name: "ביקור חולים", role: "עזרה וליווי לחולים ומשפחותיהם", category: "חסד", phone: "050-0000002" },
    { name: "מזכירות תלמוד תורה", role: "רישום ובירורים", category: "חינוך", phone: "050-0000003" },
    { name: "רכז נוער", role: "פעילויות נוער", category: "נוער", phone: "050-0000004" },
    { name: "אחראי אולם שמחות", role: "הזמנת אולם לאירועים", category: "הנהלה", phone: "050-0000005" },
    { name: "חברה קדישא", role: "ענייני קבורה", category: "חסד", phone: "050-0000006" }
  ],

  /* ---- חדשות ---- (התאריך הראשון ברשימה מוצג ראשון) */
  news: [
    {
      date: "2026-09-10",
      title: "עדכון זמני תפילות לחודש הקרוב",
      body: "לוח זמני התפילות לחודש הקרוב עודכן. נא לשים לב לשינויים בזמני מנחה בערבי שבת."
    },
    {
      date: "2026-09-01",
      title: "פתיחת האפליקציה החדשה של הקהילה",
      body: "בשמחה אנו משיקים אפליקציה חדשה לקהילה הכוללת זמני תפילות, שעות קבלת קהל, אלפון וחדשות במקום אחד."
    }
  ]
};

/* =========================================================================
   טעינת נתונים מ-Firestore
   ========================================================================= */

let DATA = DEFAULT_DATA;
const SITE_DOC = doc(db, "site", "data");

async function loadData() {
  try {
    const snap = await getDoc(SITE_DOC);
    if (snap.exists()) {
      return snap.data();
    }
    await setDoc(SITE_DOC, DEFAULT_DATA);
    return DEFAULT_DATA;
  } catch (err) {
    console.warn("לא הצלחתי להתחבר ל-Firestore, משתמש בנתוני ברירת מחדל", err);
    return DEFAULT_DATA;
  }
}

/* =========================================================================
   רינדור וממשק
   ========================================================================= */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatPhoneHref(phone) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

function renderTefillos() {
  const el = document.getElementById("tefillos-content");
  el.innerHTML = DATA.tefillos.map((group) => `
    <h2 class="section-title">${escapeHtml(group.group)}</h2>
    <div class="card tefillos-card">
      ${group.rows.map((row) => `
        <div class="tefillos-row">
          <span class="tefillos-name">${escapeHtml(row.name)}</span>
          <span class="tefillos-time">
            ${escapeHtml(row.time)}
            ${row.note ? `<span class="tefillos-note">${escapeHtml(row.note)}</span>` : ""}
          </span>
        </div>
      `).join("")}
    </div>
  `).join("");
}

function renderKabbalasKahal() {
  const el = document.getElementById("kabbalas-kahal-content");
  if (!DATA.kabbalasKahal.length) {
    el.innerHTML = `<div class="empty-state">אין כרגע מידע על שעות קבלת קהל.</div>`;
    return;
  }
  el.innerHTML = DATA.kabbalasKahal.map((item) => `
    <div class="card kk-card">
      <div class="kk-header">
        <div>
          <div class="kk-name">${escapeHtml(item.name)}</div>
          <div class="kk-role">${escapeHtml(item.role)}</div>
        </div>
        ${item.phone ? `<a class="kk-badge" href="${formatPhoneHref(item.phone)}">${escapeHtml(item.phone)}</a>` : ""}
      </div>
      <div class="kk-details">
        <div><span class="kk-label">שעות:</span> ${escapeHtml(item.days)}</div>
        ${item.location ? `<div><span class="kk-label">מיקום:</span> ${escapeHtml(item.location)}</div>` : ""}
        ${item.note ? `<div>${escapeHtml(item.note)}</div>` : ""}
      </div>
    </div>
  `).join("");
}

let activePhonebookCategory = "הכל";

function renderPhonebookFilters() {
  const categories = ["הכל", ...new Set(DATA.phonebook.map((c) => c.category))];
  const el = document.getElementById("phonebook-filters");
  el.innerHTML = categories.map((cat) => `
    <button type="button" class="chip${cat === activePhonebookCategory ? " active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
  `).join("");
  el.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activePhonebookCategory = btn.dataset.category;
      renderPhonebookFilters();
      renderPhonebook();
    });
  });
}

function renderPhonebook() {
  const query = (document.getElementById("phonebook-search").value || "").trim().toLowerCase();
  const el = document.getElementById("phonebook-content");

  const results = DATA.phonebook.filter((c) => {
    const matchesCategory = activePhonebookCategory === "הכל" || c.category === activePhonebookCategory;
    if (!matchesCategory) return false;
    if (!query) return true;
    const haystack = `${c.name} ${c.role} ${c.category} ${c.phone}`.toLowerCase();
    return haystack.includes(query);
  });

  if (!results.length) {
    el.innerHTML = `<div class="empty-state">לא נמצאו תוצאות התואמות לחיפוש.</div>`;
    return;
  }

  el.innerHTML = results.map((c) => `
    <div class="card contact-card">
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(c.name)}</div>
        <div class="contact-role">${escapeHtml(c.role)}</div>
      </div>
      <a class="contact-phone" href="${formatPhoneHref(c.phone)}">${escapeHtml(c.phone)}</a>
    </div>
  `).join("");
}

/* ---- אלפון חברים (רשימה מלאה, נטענת מקובץ נפרד) ---- */
let membersData = null;
let membersLoadPromise = null;
let membersInitStarted = false;
let activeMembersCountry = "הכל";
const MEMBERS_MAX_RESULTS = 150;
const MEMBERS_MIN_QUERY = 2;

function loadMembers() {
  if (!membersLoadPromise) {
    membersLoadPromise = fetch("phonebook-full.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
      .then((data) => { membersData = data; return data; })
      .catch((err) => {
        console.warn("לא הצלחתי לטעון את אלפון החברים", err);
        membersData = [];
        return membersData;
      });
  }
  return membersLoadPromise;
}

function renderMembersCountryFilters() {
  const options = ["הכל", "ארץ", "חול"];
  const labels = { "הכל": "הכל", "ארץ": "ארץ", "חול": 'חו"ל' };
  const el = document.getElementById("members-country-filters");
  el.innerHTML = options.map((opt) => `
    <button type="button" class="chip${opt === activeMembersCountry ? " active" : ""}" data-country="${escapeHtml(opt)}">${escapeHtml(labels[opt])}</button>
  `).join("");
  el.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeMembersCountry = btn.dataset.country;
      renderMembersCountryFilters();
      renderMembers();
    });
  });
}

function populateCitySelect() {
  const select = document.getElementById("members-city-select");
  const byKey = new Map();
  membersData.forEach((m) => {
    if (!m.city) return;
    const key = m.city.trim().toLowerCase();
    const entry = byKey.get(key) || { label: m.city.trim(), count: 0 };
    entry.count += 1;
    byKey.set(key, entry);
  });
  const cities = [...byKey.entries()]
    .map(([key, v]) => ({ key, label: v.label }))
    .sort((a, b) => a.label.localeCompare(b.label, "he"));
  select.innerHTML = `<option value="">כל הערים</option>` +
    cities.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`).join("");
}

function renderMembers() {
  const el = document.getElementById("members-content");
  const query = (document.getElementById("members-search").value || "").trim().toLowerCase();
  const cityKey = document.getElementById("members-city-select").value;

  if (!cityKey && query.length < MEMBERS_MIN_QUERY) {
    el.innerHTML = `<div class="members-hint">הקלידו שם משפחה, שם פרטי או עיר, או בחרו עיר מהרשימה (${membersData.length.toLocaleString("he")} אנשי קשר במאגר)</div>`;
    return;
  }

  let results = membersData;
  if (activeMembersCountry !== "הכל") {
    results = results.filter((m) => m.country === activeMembersCountry);
  }
  if (cityKey) {
    results = results.filter((m) => m.city && m.city.trim().toLowerCase() === cityKey);
  }
  if (query.length >= MEMBERS_MIN_QUERY) {
    results = results.filter((m) => `${m.family} ${m.first} ${m.city} ${m.chossen}`.toLowerCase().includes(query));
  }

  if (!results.length) {
    el.innerHTML = `<div class="empty-state">לא נמצאו תוצאות.</div>`;
    return;
  }

  const shown = results.slice(0, MEMBERS_MAX_RESULTS);
  el.innerHTML = shown.map((m) => {
    const mainPhone = m.mobile || m.phone;
    const homePhone = m.mobile && m.phone ? m.phone : "";
    return `
    <div class="card kk-card">
      <div class="kk-header">
        <div>
          <div class="kk-name">${escapeHtml(m.family)} ${escapeHtml(m.first)}</div>
          ${m.city ? `<div class="kk-role">${escapeHtml(m.city)}</div>` : ""}
        </div>
        ${mainPhone ? `<a class="kk-badge" href="${formatPhoneHref(mainPhone)}">${escapeHtml(mainPhone)}</a>` : ""}
      </div>
      <div class="kk-details">
        ${m.address ? `<div><span class="kk-label">כתובת:</span> ${escapeHtml(m.address)}</div>` : ""}
        ${homePhone ? `<div><span class="kk-label">בבית:</span> <a href="${formatPhoneHref(homePhone)}">${escapeHtml(homePhone)}</a></div>` : ""}
        ${m.chossen ? `<div><span class="kk-label">חם:</span> ${escapeHtml(m.chossen)}</div>` : ""}
      </div>
    </div>
  `;
  }).join("") + (results.length > MEMBERS_MAX_RESULTS
    ? `<div class="members-more">מוצגות ${MEMBERS_MAX_RESULTS} התוצאות הראשונות מתוך ${results.length.toLocaleString("he")} — צמצמו את החיפוש לתוצאה מדויקת יותר</div>`
    : "");
}

async function initMembers() {
  const el = document.getElementById("members-content");
  el.innerHTML = `<div class="members-hint">טוען אלפון…</div>`;
  await loadMembers();
  renderMembersCountryFilters();
  populateCitySelect();
  renderMembers();
  document.getElementById("members-search").addEventListener("input", renderMembers);
  document.getElementById("members-city-select").addEventListener("change", renderMembers);
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d)) return isoDate;
  return d.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
}

function renderNews() {
  const el = document.getElementById("news-content");
  if (!DATA.news.length) {
    el.innerHTML = `<div class="empty-state">אין חדשות להצגה כרגע.</div>`;
    return;
  }
  const sorted = [...DATA.news].sort((a, b) => (a.date < b.date ? 1 : -1));
  el.innerHTML = sorted.map((item) => `
    <div class="card news-card">
      <div class="news-date">${escapeHtml(formatDate(item.date))}</div>
      <div class="news-title">${escapeHtml(item.title)}</div>
      <div class="news-body">${escapeHtml(item.body)}</div>
    </div>
  `).join("");
}

/* ---- התקנה כאפליקציה (PWA) ---- */
function initInstallPrompt() {
  const banner = document.getElementById("install-banner");
  const installBtn = document.getElementById("install-btn");
  const dismissBtn = document.getElementById("install-dismiss");
  if (!banner) return;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (isStandalone || localStorage.getItem("gur-install-dismissed") === "1") return;

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.hidden = false;
  });

  if (isIos) {
    banner.hidden = false;
    installBtn.textContent = "איך מתקינים?";
  }

  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.hidden = true;
    } else if (isIos) {
      alert('להתקנה: הקישו על כפתור השיתוף בדפדפן (הריבוע עם החץ כלפי מעלה), ואז על "הוספה למסך הבית".');
    }
  });

  dismissBtn.addEventListener("click", () => {
    banner.hidden = true;
    localStorage.setItem("gur-install-dismissed", "1");
  });

  window.addEventListener("appinstalled", () => {
    banner.hidden = true;
  });
}

/* ---- ניווט בין טאבים ---- */
function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.getElementById("main").scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (tabName === "members" && !membersInitStarted) {
    membersInitStarted = true;
    initMembers();
  }
}

function initNav() {
  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}

async function init() {
  initInstallPrompt();
  DATA = await loadData();
  renderTefillos();
  renderKabbalasKahal();
  renderPhonebookFilters();
  renderPhonebook();
  renderNews();
  initNav();
  document.getElementById("phonebook-search").addEventListener("input", renderPhonebook);
}

document.addEventListener("DOMContentLoaded", init);
