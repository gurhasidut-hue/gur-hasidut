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
        ${item.phone ? `<a class="kk-badge" href="${formatPhoneHref(item.phone)}">התקשרות</a>` : ""}
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

/* ---- ניווט בין טאבים ---- */
function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.getElementById("main").scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function initNav() {
  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}

async function init() {
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
