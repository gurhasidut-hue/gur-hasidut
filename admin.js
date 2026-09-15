/* =========================================================================
   חסידות גור — ניהול תוכן
   עמוד עריכה עצמאי: טוען את המסמך מ-Firestore, מציג טפסים לכל סעיף,
   ושומר בחזרה ל-Firestore בלחיצת כפתור. אין כאן בניית build — קובץ
   רגיל שנטען ישירות בדפדפן.
   ========================================================================= */

import {
  db, doc, getDoc, setDoc,
  auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "./firebase-init.js";

/* חשבונות Google מורשים לנהל תוכן. חייב להתאים גם לכללי ה-Rules ב-Firestore. */
const ALLOWED_EMAILS = ["gurhasidut@gmail.com"];

const SITE_DOC = doc(db, "site", "data");
let currentData = null;
let hasBooted = false;

function escapeAttr(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- שער כניסה (Google Sign-In) ---------- */
function initGate() {
  const gate = document.getElementById("gate");
  const app = document.getElementById("admin-app");
  const signInBtn = document.getElementById("google-signin-btn");
  const deniedEl = document.getElementById("gate-denied");
  const signOutBtn = document.getElementById("sign-out-btn");
  const emailEl = document.getElementById("admin-user-email");

  signInBtn.addEventListener("click", async () => {
    deniedEl.hidden = true;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      deniedEl.hidden = false;
      deniedEl.textContent = "שגיאה בהתחברות: " + err.message;
    }
  });

  signOutBtn.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.includes(user.email)) {
      gate.hidden = true;
      app.hidden = false;
      emailEl.textContent = user.email;
      if (!hasBooted) {
        hasBooted = true;
        boot();
      }
    } else {
      app.hidden = true;
      gate.hidden = false;
      if (user) {
        deniedEl.hidden = false;
        deniedEl.textContent = `החשבון ${user.email} אינו מורשה לנהל את התוכן.`;
        signOut(auth);
      }
    }
  });
}

/* ---------- טעינה ---------- */
async function boot() {
  const statusEl = document.getElementById("load-status");
  try {
    const snap = await getDoc(SITE_DOC);
    if (!snap.exists()) {
      statusEl.textContent = "לא נמצא עדיין מידע ב-Firestore. פתחו את האתר הראשי פעם אחת (כדי שהמידע ייווצר), ואז רעננו את העמוד הזה.";
      return;
    }
    currentData = snap.data();
  } catch (err) {
    statusEl.textContent = "שגיאה בטעינת הנתונים: " + err.message;
    return;
  }
  statusEl.hidden = true;

  renderTefillos();
  renderKabbalasKahal();
  renderPhonebook();
  renderNews();
  wireButtons();
  initNav();
}

/* ---------- שמירה כללית ---------- */
async function saveField(name, value, statusEl) {
  currentData[name] = value;
  statusEl.hidden = false;
  statusEl.textContent = "שומר…";
  try {
    await setDoc(SITE_DOC, currentData);
    statusEl.textContent = "נשמר בהצלחה ✓";
    setTimeout(() => { statusEl.hidden = true; }, 2500);
  } catch (err) {
    statusEl.textContent = "שגיאה בשמירה: " + err.message;
  }
}

/* =========================================================================
   זמני תפילות
   ========================================================================= */

function renderTefillos() {
  const container = document.getElementById("tefillos-groups");
  container.innerHTML = "";
  (currentData.tefillos || []).forEach((group) => container.appendChild(buildGroupCard(group)));
}

function buildGroupCard(group = { group: "", rows: [] }) {
  const card = document.createElement("div");
  card.className = "card admin-card";
  card.dataset.group = "1";
  card.innerHTML = `
    <div class="admin-row-top">
      <input type="text" class="admin-input admin-group-name" placeholder="שם הקבוצה (למשל: ימי חול)" value="${escapeAttr(group.group)}">
      <button type="button" class="admin-remove-btn" title="הסרת קבוצה">✕</button>
    </div>
    <div class="admin-rows"></div>
    <button type="button" class="admin-btn-add-row">+ הוספת שורה</button>
  `;
  const rowsEl = card.querySelector(".admin-rows");
  (group.rows || []).forEach((row) => rowsEl.appendChild(buildRow(row)));
  card.querySelector(".admin-remove-btn").addEventListener("click", () => card.remove());
  card.querySelector(".admin-btn-add-row").addEventListener("click", () => rowsEl.appendChild(buildRow()));
  return card;
}

function buildRow(row = { name: "", time: "", note: "" }) {
  const div = document.createElement("div");
  div.className = "admin-subrow";
  div.innerHTML = `
    <input type="text" class="admin-input" data-field="name" placeholder="שם התפילה" value="${escapeAttr(row.name)}">
    <input type="text" class="admin-input admin-input-narrow" data-field="time" placeholder="שעה" value="${escapeAttr(row.time)}">
    <input type="text" class="admin-input" data-field="note" placeholder="הערה (אופציונלי)" value="${escapeAttr(row.note)}">
    <button type="button" class="admin-remove-btn" title="הסרת שורה">✕</button>
  `;
  div.querySelector(".admin-remove-btn").addEventListener("click", () => div.remove());
  return div;
}

async function saveTefillos(statusEl) {
  const groups = [...document.querySelectorAll("#tefillos-groups > [data-group]")].map((card) => {
    const groupName = card.querySelector(".admin-group-name").value.trim();
    const rows = [...card.querySelectorAll(".admin-subrow")].map((row) => {
      const name = row.querySelector('[data-field="name"]').value.trim();
      const time = row.querySelector('[data-field="time"]').value.trim();
      const note = row.querySelector('[data-field="note"]').value.trim();
      const r = { name, time };
      if (note) r.note = note;
      return r;
    }).filter((r) => r.name || r.time);
    return { group: groupName, rows };
  }).filter((g) => g.group);

  await saveField("tefillos", groups, statusEl);
}

/* =========================================================================
   שעות קבלת קהל
   ========================================================================= */

function renderKabbalasKahal() {
  const container = document.getElementById("kk-items");
  container.innerHTML = "";
  (currentData.kabbalasKahal || []).forEach((item) => container.appendChild(buildKkCard(item)));
}

function buildKkCard(item = {}) {
  const div = document.createElement("div");
  div.className = "card admin-card";
  div.dataset.kkItem = "1";
  div.innerHTML = `
    <input type="text" class="admin-input" data-field="name" placeholder="שם / תפקיד ראשי" value="${escapeAttr(item.name)}">
    <input type="text" class="admin-input" data-field="role" placeholder="תיאור התפקיד" value="${escapeAttr(item.role)}">
    <input type="text" class="admin-input" data-field="days" placeholder="ימים ושעות" value="${escapeAttr(item.days)}">
    <input type="text" class="admin-input" data-field="location" placeholder="מיקום (אופציונלי)" value="${escapeAttr(item.location)}">
    <input type="tel" class="admin-input" data-field="phone" placeholder="טלפון (אופציונלי)" value="${escapeAttr(item.phone)}">
    <input type="text" class="admin-input" data-field="note" placeholder="הערה (אופציונלי)" value="${escapeAttr(item.note)}">
    <button type="button" class="admin-remove-btn admin-remove-btn-full" title="הסרה">✕ הסרת רשומה</button>
  `;
  div.querySelector(".admin-remove-btn").addEventListener("click", () => div.remove());
  return div;
}

async function saveKabbalasKahal(statusEl) {
  const items = [...document.querySelectorAll("#kk-items > [data-kk-item]")].map((card) => {
    const name = card.querySelector('[data-field="name"]').value.trim();
    const role = card.querySelector('[data-field="role"]').value.trim();
    const days = card.querySelector('[data-field="days"]').value.trim();
    const location = card.querySelector('[data-field="location"]').value.trim();
    const phone = card.querySelector('[data-field="phone"]').value.trim();
    const note = card.querySelector('[data-field="note"]').value.trim();
    const item = { name, role, days };
    if (location) item.location = location;
    if (phone) item.phone = phone;
    if (note) item.note = note;
    return item;
  }).filter((i) => i.name);

  await saveField("kabbalasKahal", items, statusEl);
}

/* =========================================================================
   אלפון
   ========================================================================= */

function renderPhonebook() {
  const container = document.getElementById("contact-items");
  container.innerHTML = "";
  (currentData.phonebook || []).forEach((item) => container.appendChild(buildContactCard(item)));
}

function buildContactCard(item = {}) {
  const div = document.createElement("div");
  div.className = "card admin-card";
  div.dataset.contactItem = "1";
  div.innerHTML = `
    <input type="text" class="admin-input" data-field="name" placeholder="שם" value="${escapeAttr(item.name)}">
    <input type="text" class="admin-input" data-field="role" placeholder="תפקיד" value="${escapeAttr(item.role)}">
    <input type="text" class="admin-input" data-field="category" placeholder="קטגוריה (למשל: הנהלה / גבאים / חסד)" value="${escapeAttr(item.category)}">
    <input type="tel" class="admin-input" data-field="phone" placeholder="טלפון" value="${escapeAttr(item.phone)}">
    <button type="button" class="admin-remove-btn admin-remove-btn-full" title="הסרה">✕ הסרת רשומה</button>
  `;
  div.querySelector(".admin-remove-btn").addEventListener("click", () => div.remove());
  return div;
}

async function savePhonebook(statusEl) {
  const items = [...document.querySelectorAll("#contact-items > [data-contact-item]")].map((card) => ({
    name: card.querySelector('[data-field="name"]').value.trim(),
    role: card.querySelector('[data-field="role"]').value.trim(),
    category: card.querySelector('[data-field="category"]').value.trim(),
    phone: card.querySelector('[data-field="phone"]').value.trim()
  })).filter((i) => i.name);

  await saveField("phonebook", items, statusEl);
}

/* =========================================================================
   חדשות
   ========================================================================= */

function renderNews() {
  const container = document.getElementById("news-items");
  container.innerHTML = "";
  (currentData.news || []).forEach((item) => container.appendChild(buildNewsCard(item)));
}

function buildNewsCard(item = { date: todayIso(), title: "", body: "" }) {
  const div = document.createElement("div");
  div.className = "card admin-card";
  div.dataset.newsItem = "1";
  div.innerHTML = `
    <input type="date" class="admin-input" data-field="date" value="${escapeAttr(item.date || todayIso())}">
    <input type="text" class="admin-input" data-field="title" placeholder="כותרת" value="${escapeAttr(item.title)}">
    <textarea class="admin-input" data-field="body" placeholder="תוכן החדשה">${escapeAttr(item.body)}</textarea>
    <button type="button" class="admin-remove-btn admin-remove-btn-full" title="הסרה">✕ הסרת חדשה</button>
  `;
  div.querySelector(".admin-remove-btn").addEventListener("click", () => div.remove());
  return div;
}

async function saveNews(statusEl) {
  const items = [...document.querySelectorAll("#news-items > [data-news-item]")].map((card) => ({
    date: card.querySelector('[data-field="date"]').value.trim() || todayIso(),
    title: card.querySelector('[data-field="title"]').value.trim(),
    body: card.querySelector('[data-field="body"]').value.trim()
  })).filter((i) => i.title);

  await saveField("news", items, statusEl);
}

/* =========================================================================
   כפתורי הוספה ושמירה + ניווט
   ========================================================================= */

function wireButtons() {
  document.getElementById("add-group-btn").addEventListener("click", () => {
    document.getElementById("tefillos-groups").appendChild(buildGroupCard());
  });
  document.getElementById("add-kk-btn").addEventListener("click", () => {
    document.getElementById("kk-items").appendChild(buildKkCard());
  });
  document.getElementById("add-contact-btn").addEventListener("click", () => {
    document.getElementById("contact-items").appendChild(buildContactCard());
  });
  document.getElementById("add-news-btn").addEventListener("click", () => {
    document.getElementById("news-items").prepend(buildNewsCard());
  });

  document.querySelectorAll("[data-save]").forEach((btn) => {
    const field = btn.dataset.save;
    const statusEl = document.querySelector(`[data-status="${field}"]`);
    const savers = {
      tefillos: saveTefillos,
      kabbalasKahal: saveKabbalasKahal,
      phonebook: savePhonebook,
      news: saveNews
    };
    btn.addEventListener("click", () => savers[field](statusEl));
  });
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
}

function initNav() {
  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}

document.addEventListener("DOMContentLoaded", initGate);
