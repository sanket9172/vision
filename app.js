import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, COLLECTION_NAME, TRANSACTIONS_COLLECTION } from "./config.js";

const ACCOUNTS = {
  sanket: "1703",
  varun: "1703",
  darshan: "1703",
};
const SESSION_KEY = "visionUser";

const form = document.getElementById("joinForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const tradeSelect = document.getElementById("trade");
const otherWrap = document.getElementById("otherTradeWrap");
const otherTrade = document.getElementById("otherTrade");
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");

function isConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("PASTE_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("PASTE_")
  );
}

let db = null;
if (isConfigured()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

menuBtn?.addEventListener("click", () => {
  const open = mobileNav.hasAttribute("hidden");
  if (open) {
    mobileNav.removeAttribute("hidden");
    menuBtn.setAttribute("aria-expanded", "true");
  } else {
    mobileNav.setAttribute("hidden", "");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.setAttribute("hidden", "");
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

tradeSelect?.addEventListener("change", () => {
  const isOther = tradeSelect.value === "Other";
  otherWrap.hidden = !isOther;
  otherTrade.required = isOther;
  if (!isOther) otherTrade.value = "";
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "form-status" + (type ? ` ${type}` : "");
}

function clearFieldErrors() {
  form.querySelectorAll(".field.error").forEach((el) => el.classList.remove("error"));
}

function markError(input) {
  input.closest(".field")?.classList.add("error");
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldErrors();
  setStatus("");

  const data = {
    fullName: form.fullName.value.trim(),
    phone: form.phone.value.trim().replace(/\s+/g, ""),
    city: form.city.value.trim(),
    state: form.state.value,
    trade: form.trade.value,
    otherTrade: form.otherTrade.value.trim(),
    experience: form.experience.value,
    role: form.role.value,
    notes: form.notes.value.trim(),
  };

  let valid = true;
  ["fullName", "phone", "city", "state", "trade", "experience", "role"].forEach((name) => {
    if (!data[name]) {
      markError(form[name]);
      valid = false;
    }
  });

  if (data.trade === "Other" && !data.otherTrade) {
    markError(otherTrade);
    valid = false;
  }

  if (data.phone && !validatePhone(data.phone)) {
    markError(form.phone);
    valid = false;
    setStatus("Enter a valid 10-digit Indian mobile number.", "err");
    return;
  }

  if (!valid) {
    setStatus("Please fill all required fields.", "err");
    return;
  }

  if (!isConfigured() || !db) {
    setStatus(
      "Firebase is not set up yet. Open config.js and paste your Firebase keys (see README).",
      "err"
    );
    return;
  }

  const payload = {
    fullName: data.fullName,
    phone: data.phone,
    city: data.city,
    state: data.state,
    trade: data.trade === "Other" ? data.otherTrade : data.trade,
    experience: data.experience,
    role: data.role,
    notes: data.notes || "",
    source: "vision-website",
    createdAt: serverTimestamp(),
    userAgent: navigator.userAgent.slice(0, 180),
  };

  submitBtn.disabled = true;
  setStatus("Saving…");

  try {
    await addDoc(collection(db, COLLECTION_NAME), payload);
    form.reset();
    otherWrap.hidden = true;
    otherTrade.required = false;
    setStatus("Thank you — you are on the Vision list. We will reach out when we connect your area.", "ok");
  } catch (err) {
    console.error(err);
    const code = err?.code || "";
    if (code === "permission-denied") {
      setStatus(
        "Blocked by Firebase rules. In Firebase Console → Firestore → Rules, allow create on signups, then Publish.",
        "err"
      );
    } else if (code === "unavailable" || code === "failed-precondition") {
      setStatus(
        "Firestore is not ready. Open Firebase → Firestore and confirm the database exists.",
        "err"
      );
    } else {
      setStatus(`Could not save (${code || "error"}). Check internet and try again.`, "err");
    }
  } finally {
    submitBtn.disabled = false;
  }
});

const loginOpen = document.getElementById("loginOpen");
const loginModal = document.getElementById("loginModal");
const loginClose = document.getElementById("loginClose");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const profileBtn = document.getElementById("profileBtn");
const profileName = document.getElementById("profileName");
const avatarMark = document.getElementById("avatarMark");
const sidePanel = document.getElementById("sidePanel");
const logoutBtn = document.getElementById("logoutBtn");
const desk = document.getElementById("desk");
const logoLink = document.getElementById("logoLink");
const billForm = document.getElementById("billForm");
const billStatus = document.getElementById("billStatus");
const billingList = document.getElementById("billingList");
const billTotal = document.getElementById("billTotal");
const registeredCount = document.getElementById("registeredCount");
const registeredStatus = document.getElementById("registeredStatus");
const historyList = document.getElementById("historyList");
const historyStatus = document.getElementById("historyStatus");
const payerDate = document.getElementById("payerDate");

let currentUser = sessionStorage.getItem(SESSION_KEY);
let transactions = [];
let payers = [];
let billingSettings = { weeklyAmount: 0, payPhone: "" };
let signups = [];
let selectedName = "";
let selectedTxId = "";

function titleName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function personKey(name) {
  return (name || "").trim().toLowerCase();
}

function setLoginStatus(message, type) {
  loginStatus.textContent = message;
  loginStatus.className = "form-status" + (type ? ` ${type}` : "");
}

function openLogin() {
  loginModal.hidden = false;
  setLoginStatus("");
  document.getElementById("username")?.focus();
}

function closeLogin() {
  loginModal.hidden = true;
}

function closeSidebar() {
  sidePanel.hidden = true;
  profileBtn.setAttribute("aria-expanded", "false");
}

function showPublicSite() {
  desk.hidden = true;
  document.body.classList.remove("desk-on");
  document.querySelectorAll(".desk-view").forEach((view) => {
    view.hidden = true;
  });
}

function applySession() {
  const known = currentUser && Object.prototype.hasOwnProperty.call(ACCOUNTS, currentUser);
  if (!known) currentUser = null;

  loginOpen.hidden = Boolean(currentUser);
  profileBtn.hidden = !currentUser;

  if (currentUser) {
    profileName.textContent = titleName(currentUser);
    avatarMark.textContent = currentUser.charAt(0).toUpperCase();
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.hidden = currentUser !== "sanket";
    });
  } else {
    closeSidebar();
    showPublicSite();
    sessionStorage.removeItem(SESSION_KEY);
  }
}

loginOpen?.addEventListener("click", openLogin);
loginClose?.addEventListener("click", closeLogin);
loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) closeLogin();
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = loginForm.username.value.trim().toLowerCase();
  const password = loginForm.password.value;
  if (ACCOUNTS[username] && ACCOUNTS[username] === password) {
    currentUser = username;
    sessionStorage.setItem(SESSION_KEY, username);
    loginForm.reset();
    closeLogin();
    applySession();
    return;
  }
  setLoginStatus("Wrong username or password.", "err");
});

profileBtn?.addEventListener("click", () => {
  const open = sidePanel.hidden;
  sidePanel.hidden = !open;
  profileBtn.setAttribute("aria-expanded", open ? "true" : "false");
});

logoutBtn?.addEventListener("click", () => {
  currentUser = null;
  sessionStorage.removeItem(SESSION_KEY);
  applySession();
});

logoLink?.addEventListener("click", () => {
  closeSidebar();
  showPublicSite();
});

document.addEventListener("click", (event) => {
  if (sidePanel.hidden) return;
  if (sidePanel.contains(event.target) || profileBtn.contains(event.target)) return;
  closeSidebar();
});

function rulesHint(err) {
  if (err?.code === "permission-denied") {
    return "Firebase blocked this save. Wait a moment and try again.";
  }
  return "Could not load data. Check your internet and try again.";
}

function isAdmin() {
  return currentUser === "sanket";
}

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function weekRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const weekday = start.getDay();
  const fromMonday = weekday === 0 ? 6 : weekday - 1;
  start.setDate(start.getDate() - fromMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function inThisWeek(value) {
  if (!value) return false;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  const { start, end } = weekRange();
  return date >= start && date <= end;
}

function validPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function setBillStatus(message, type) {
  billStatus.textContent = message;
  billStatus.className = "form-status" + (type ? ` ${type}` : "");
}

async function loadSignups() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  signups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  signups.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

function recordTime(row) {
  return row.savedAt || (row.createdAt?.seconds || 0) * 1000;
}

async function addRecord(data) {
  await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
    ...data,
    savedAt: Date.now(),
    createdAt: serverTimestamp(),
  });
}

async function loadTransactions() {
  const snap = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
  const ledger = snap.docs
    .map((row) => ({ id: row.id, ...row.data() }))
    .filter((row) => row.kind !== "test" && row.name !== "_rulecheck")
    .sort((a, b) => recordTime(a) - recordTime(b));

  const latestSettings = ledger.filter((row) => row.kind === "settings").at(-1);
  billingSettings = latestSettings
    ? { weeklyAmount: Number(latestSettings.weeklyAmount) || 0, payPhone: latestSettings.payPhone || "" }
    : { weeklyAmount: 0, payPhone: "" };

  const payerMap = new Map();
  ledger
    .filter((row) => row.kind === "payer")
    .forEach((row) => payerMap.set(row.payerKey || personKey(row.name), row));
  payers = [...payerMap.values()]
    .filter((row) => !row.removed)
    .map((row) => ({
      id: row.payerKey || personKey(row.name),
      name: row.name,
      phone: row.phone || "",
    }));

  const changesByTarget = new Map();
  ledger
    .filter((row) => row.kind === "change" && row.targetId)
    .forEach((row) => {
      const list = changesByTarget.get(row.targetId) || [];
      list.push(row);
      changesByTarget.set(row.targetId, list);
    });

  transactions = ledger
    .filter((row) => !row.kind || row.kind === "payment")
    .map((row) => {
      const current = { ...row };
      for (const change of changesByTarget.get(row.id) || []) {
        if (change.removed) return null;
        if (change.name) current.name = change.name;
        if (change.phone != null && change.phone !== "") current.phone = change.phone;
        if (change.amount != null) current.amount = change.amount;
        if (change.date) current.date = change.date;
        if (change.status) current.status = change.status;
      }
      return current;
    })
    .filter(Boolean);
  transactions.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function txStatus(row) {
  return row.status || "approved";
}

function phoneFor(name) {
  const key = personKey(name);
  const payer = payers.find((person) => personKey(person.name) === key);
  if (payer?.phone) return payer.phone;
  const row = transactions.find((item) => personKey(item.name) === key && item.phone);
  return row?.phone || "";
}

function knownPeople() {
  const map = new Map();
  payers.forEach((person) => {
    const key = personKey(person.name);
    if (!key) return;
    map.set(key, { key, id: person.id, name: person.name, phone: person.phone || "" });
  });
  transactions.forEach((row) => {
    const key = personKey(row.name);
    if (!key || map.has(key)) return;
    map.set(key, { key, id: "", name: row.name, phone: row.phone || "" });
  });
  return [...map.values()];
}

function paidThisWeek(name) {
  const key = personKey(name);
  return transactions.reduce((sum, row) => {
    if (personKey(row.name) !== key || txStatus(row) !== "approved" || !inThisWeek(row.date)) return sum;
    return sum + (Number(row.amount) || 0);
  }, 0);
}

function pendingThisWeek(name) {
  const key = personKey(name);
  return transactions.reduce((sum, row) => {
    if (personKey(row.name) !== key || txStatus(row) !== "pending" || !inThisWeek(row.date)) return sum;
    return sum + (Number(row.amount) || 0);
  }, 0);
}

function remainingDue(name) {
  const weekly = Number(billingSettings.weeklyAmount) || 0;
  return Math.max(0, weekly - paidThisWeek(name));
}

function approvedTotal(name) {
  const key = personKey(name);
  return transactions.reduce((sum, row) => {
    if (personKey(row.name) !== key || txStatus(row) !== "approved") return sum;
    return sum + (Number(row.amount) || 0);
  }, 0);
}

function whatsAppLink(phone, text) {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}?text=${encodeURIComponent(text)}`;
}

function reminderText(name, due) {
  const phone = billingSettings.payPhone ? ` PhonePe: ${billingSettings.payPhone}.` : "";
  return `Hi ${name}, your Vision weekly due is ${money(due)}. Please pay now.${phone}`;
}

function phonePeUrl(amount, note) {
  const phone = String(billingSettings.payPhone || "").replace(/\D/g, "");
  const params = new URLSearchParams({
    pa: `${phone}@ybl`,
    pn: "Vision",
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

function renderRegistered() {
  registeredCount.textContent = String(signups.length);
  registeredStatus.textContent = "";
  registeredStatus.className = "form-status";
}

function renderHistory() {
  historyStatus.textContent = "";
  historyStatus.className = "form-status";
  if (!signups.length) {
    historyList.innerHTML = `<p class="bill-empty">No one has registered yet.</p>`;
    return;
  }
  historyList.innerHTML = signups
    .map((person) => {
      const when = formatDate(person.createdAt);
      return `<article class="history-card">
        <div>
          <strong>${escapeHtml(person.fullName || "—")}</strong>
          <p>${escapeHtml(person.trade || "—")} · ${escapeHtml(person.city || "—")}, ${escapeHtml(person.state || "")}</p>
        </div>
        <time>${when}</time>
      </article>`;
    })
    .join("");
}

function renderStats() {
  const people = knownPeople();
  const collected = people.reduce((sum, person) => sum + paidThisWeek(person.name), 0);
  const stillDue = people.reduce((sum, person) => sum + remainingDue(person.name), 0);
  const waiting = transactions.reduce((sum, row) => {
    if (txStatus(row) !== "pending") return sum;
    return sum + (Number(row.amount) || 0);
  }, 0);
  const stats = document.getElementById("billStats");
  stats.innerHTML = `
    <article class="stat-card"><span>Weekly amount</span><strong>${money(billingSettings.weeklyAmount || 0)}</strong></article>
    <article class="stat-card"><span>Collected this week</span><strong>${money(collected)}</strong></article>
    <article class="stat-card"><span>Still due</span><strong>${money(stillDue)}</strong></article>
    <article class="stat-card"><span>Waiting for approval</span><strong>${money(waiting)}</strong></article>
  `;
}

function renderDues() {
  const dueList = document.getElementById("dueList");
  const people = knownPeople();
  if (!people.length) {
    dueList.innerHTML = `<p class="bill-empty">No people yet. Sanket can add a name and mobile.</p>`;
    return;
  }
  dueList.innerHTML = people
    .map((person) => {
      const due = remainingDue(person.name);
      const paid = paidThisWeek(person.name);
      const pending = pendingThisWeek(person.name);
      const weekly = Number(billingSettings.weeklyAmount) || 0;
      const state = due === 0 && weekly > 0 ? "paid" : "due";
      const label = due === 0 && weekly > 0 ? "Paid" : "Due";
      const adminButtons = isAdmin()
        ? `<button type="button" class="btn btn-ghost btn-small" data-action="edit-person" data-id="${escapeHtml(person.id)}" data-name="${escapeHtml(person.key)}">Edit</button>
           ${person.id ? `<button type="button" class="btn btn-ghost btn-small" data-action="delete-person" data-id="${escapeHtml(person.id)}">Delete</button>` : ""}`
        : "";
      return `<article class="due-card${person.key === selectedName ? " is-active" : ""}">
        <button type="button" class="due-main" data-action="select-person" data-name="${escapeHtml(person.key)}">
          <div>
            <strong>${escapeHtml(person.name)}</strong>
            <p>${escapeHtml(person.phone || "No mobile")}</p>
          </div>
          <span class="pill pill-${state}">${label} ${money(due)}</span>
        </button>
        <p class="due-meta">Paid ${money(paid)} of ${money(weekly)} this week${pending ? ` · ${money(pending)} waiting` : ""}</p>
        <div class="row-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="remind" data-name="${escapeHtml(person.key)}">Remind</button>
          <button type="button" class="btn btn-primary btn-small" data-action="pay-now" data-name="${escapeHtml(person.key)}">Pay now</button>
          ${adminButtons}
        </div>
      </article>`;
    })
    .join("");
}

function renderPayments() {
  if (!transactions.length) {
    billingList.innerHTML = `<p class="bill-empty">No payments yet.</p>`;
    return;
  }
  billingList.innerHTML = transactions
    .map((row) => {
      const key = personKey(row.name);
      const status = txStatus(row);
      const active = row.id === selectedTxId ? " is-active" : "";
      return `<button type="button" class="billing-row${active}" data-action="select-tx" data-id="${escapeHtml(row.id)}" data-name="${escapeHtml(key)}">
        <span>${formatDate(row.date)}</span>
        <span>${escapeHtml(row.name || "—")}</span>
        <span>${money(Number(row.amount) || 0)}</span>
        <span class="pill pill-${status === "pending" ? "wait" : "paid"}">${status === "pending" ? "Pending" : "Approved"}</span>
      </button>`;
    })
    .join("");
}

function renderBillTotal() {
  const tx = transactions.find((row) => row.id === selectedTxId);
  if (tx && isAdmin()) {
    billTotal.innerHTML = `
      <p class="eyebrow">Payment</p>
      <h3>${escapeHtml(tx.name || "")}</h3>
      <p class="due-meta">${formatDate(tx.date)} · ${txStatus(tx) === "pending" ? "Waiting for your approval" : "Approved"}</p>
      <form id="editTxForm" class="stack-form">
        <div class="field">
          <label for="editName">Name</label>
          <input id="editName" value="${escapeHtml(tx.name || "")}" />
        </div>
        <div class="field">
          <label for="editAmount">Amount (₹)</label>
          <input id="editAmount" type="number" min="1" step="1" value="${Number(tx.amount) || 0}" />
        </div>
        <div class="field">
          <label for="editDate">Date</label>
          <input id="editDate" type="date" value="${escapeHtml(tx.date || "")}" />
        </div>
        <div class="row-actions">
          ${txStatus(tx) === "pending" ? `<button type="button" class="btn btn-primary btn-small" data-action="approve-tx" data-id="${escapeHtml(tx.id)}">Approve</button>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="save-tx" data-id="${escapeHtml(tx.id)}">Save</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="delete-tx" data-id="${escapeHtml(tx.id)}">Delete</button>
        </div>
      </form>
    `;
    return;
  }

  if (!selectedName) {
    billTotal.innerHTML = `<p class="eyebrow">Due</p><p class="bill-empty">Select a name to see what is still due.</p>`;
    return;
  }

  const person = knownPeople().find((item) => item.key === selectedName);
  const due = remainingDue(person?.name || selectedName);
  billTotal.innerHTML = `
    <p class="eyebrow">This week</p>
    <h3>${escapeHtml(person?.name || selectedName)}</h3>
    <p class="count-num count-num-sm">${money(due)}</p>
    <p class="count-label">still due · ${money(approvedTotal(person?.name || selectedName))} approved in total</p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary btn-small" data-action="pay-now" data-name="${escapeHtml(selectedName)}">Pay now</button>
      <button type="button" class="btn btn-ghost btn-small" data-action="remind" data-name="${escapeHtml(selectedName)}">Remind</button>
    </div>
  `;
}

function renderBillings() {
  const weeklyInput = document.getElementById("weeklyAmount");
  const phoneInput = document.getElementById("payPhone");
  if (weeklyInput && document.activeElement !== weeklyInput) weeklyInput.value = billingSettings.weeklyAmount || "";
  if (phoneInput && document.activeElement !== phoneInput) phoneInput.value = billingSettings.payPhone || "";
  renderStats();
  renderDues();
  renderPayments();
  renderBillTotal();
}

function resetPersonForm() {
  const personForm = document.getElementById("personForm");
  personForm.reset();
  document.getElementById("personId").value = "";
  document.getElementById("personFormTitle").textContent = "Add person";
  document.getElementById("personCancel").hidden = true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function openView(name) {
  if (!currentUser) return;
  if (!db) {
    desk.hidden = false;
    document.body.classList.add("desk-on");
    return;
  }

  closeSidebar();
  document.querySelectorAll(".desk-view").forEach((view) => {
    view.hidden = true;
  });
  desk.hidden = false;
  document.body.classList.add("desk-on");
  window.scrollTo(0, 0);
  billStatus.textContent = "";
  billStatus.className = "form-status";
  registeredStatus.textContent = "";
  registeredStatus.className = "form-status";
  historyStatus.textContent = "";
  historyStatus.className = "form-status";

  try {
    if (name === "registered" || name === "history") {
      await loadSignups();
    }
    if (name === "billings") {
      await loadTransactions();
    }
  } catch (err) {
    console.error(err);
    const message = rulesHint(err);
    if (name === "registered") {
      registeredCount.textContent = "—";
      registeredStatus.textContent = message;
      registeredStatus.className = "form-status err";
    }
    if (name === "history") {
      historyList.innerHTML = "";
      historyStatus.textContent = message;
      historyStatus.className = "form-status err";
    }
    if (name === "billings") {
      billingList.innerHTML = "";
      billStatus.textContent = message;
      billStatus.className = "form-status err";
    }
  }

  if (name === "billings") {
    document.getElementById("viewBillings").hidden = false;
    if (payerDate && !payerDate.value) {
      payerDate.value = todayInputValue();
    }
    if (!billStatus.classList.contains("err")) renderBillings();
  }
  if (name === "registered") {
    document.getElementById("viewRegistered").hidden = false;
    if (!registeredStatus.textContent) renderRegistered();
  }
  if (name === "history") {
    document.getElementById("viewHistory").hidden = false;
    if (!historyStatus.textContent) renderHistory();
  }
}

sidePanel?.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

async function refreshBilling() {
  await loadTransactions();
  renderBillings();
}

document.getElementById("settingsForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin() || !db) return;
  const weeklyAmount = Number(document.getElementById("weeklyAmount").value);
  const payPhone = document.getElementById("payPhone").value.trim();
  if (!Number.isFinite(weeklyAmount) || weeklyAmount < 0 || !validPhone(payPhone)) {
    setBillStatus("Enter a weekly amount and a valid 10-digit PhonePe number.", "err");
    return;
  }
  try {
    await addRecord({
      kind: "settings",
      weeklyAmount,
      payPhone,
      updatedBy: currentUser,
    });
    setBillStatus("Weekly amount and PhonePe number saved.", "ok");
    await refreshBilling();
  } catch (err) {
    console.error(err);
    setBillStatus(rulesHint(err), "err");
  }
});

document.getElementById("personForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin() || !db) return;
  const name = document.getElementById("personName").value.trim();
  const phone = document.getElementById("personPhone").value.trim();
  const personId = document.getElementById("personId").value;
  if (!name || !validPhone(phone)) {
    setBillStatus("Enter a name and a valid 10-digit mobile.", "err");
    return;
  }
  try {
    await addRecord({
      kind: "payer",
      payerKey: personId || `p_${Date.now()}`,
      name,
      phone,
      removed: false,
    });
    setBillStatus(personId ? "Person updated." : "Person added.", "ok");
    selectedName = personKey(name);
    resetPersonForm();
    await refreshBilling();
  } catch (err) {
    console.error(err);
    setBillStatus(rulesHint(err), "err");
  }
});

document.getElementById("personCancel")?.addEventListener("click", resetPersonForm);

document.getElementById("remindAll")?.addEventListener("click", () => {
  const duePeople = knownPeople().filter((person) => remainingDue(person.name) > 0 && person.phone);
  if (!duePeople.length) {
    setBillStatus("Nobody with a mobile number has a due this week.", "err");
    return;
  }
  duePeople.forEach((person) => {
    window.open(whatsAppLink(person.phone, reminderText(person.name, remainingDue(person.name))), "_blank", "noopener");
  });
  setBillStatus(`Opened ${duePeople.length} reminder${duePeople.length === 1 ? "" : "s"}.`, "ok");
});

document.getElementById("viewBillings")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || !db) return;
  const action = button.dataset.action;
  const nameKey = button.dataset.name || "";
  const id = button.dataset.id || "";

  if (action === "select-person") {
    selectedName = nameKey;
    selectedTxId = "";
    renderBillings();
    return;
  }

  if (action === "select-tx") {
    selectedTxId = id;
    selectedName = nameKey;
    renderBillings();
    return;
  }

  if (action === "remind") {
    const person = knownPeople().find((item) => item.key === nameKey);
    const due = remainingDue(person?.name || nameKey);
    if (!person?.phone) {
      setBillStatus("Add a mobile number before sending a reminder.", "err");
      return;
    }
    if (due <= 0) {
      setBillStatus("Nothing is due for this person this week.", "err");
      return;
    }
    window.open(whatsAppLink(person.phone, reminderText(person.name, due)), "_blank", "noopener");
    return;
  }

  if (action === "pay-now") {
    const person = knownPeople().find((item) => item.key === nameKey);
    const due = remainingDue(person?.name || nameKey);
    if (!validPhone(String(billingSettings.payPhone || ""))) {
      setBillStatus("Sanket needs to save the PhonePe mobile number first.", "err");
      return;
    }
    if (due <= 0) {
      setBillStatus("Nothing is due for this person this week.", "err");
      return;
    }
    try {
      await addRecord({
        kind: "payment",
        name: person?.name || nameKey,
        phone: person?.phone || "",
        amount: due,
        date: todayInputValue(),
        status: "pending",
        method: "phonepe",
        addedBy: currentUser,
      });
      setBillStatus("PhonePe opened. This stays pending until Sanket approves it.", "ok");
      await refreshBilling();
      window.location.href = phonePeUrl(due, `Vision weekly ${person?.name || nameKey}`);
    } catch (err) {
      console.error(err);
      setBillStatus(rulesHint(err), "err");
    }
    return;
  }

  if (!isAdmin()) return;

  if (action === "edit-person") {
    const person = knownPeople().find((item) => item.key === nameKey);
    if (!person?.id) {
      setBillStatus("Add this person with a mobile number before editing.", "err");
      return;
    }
    document.getElementById("personId").value = person.id;
    document.getElementById("personName").value = person.name;
    document.getElementById("personPhone").value = person.phone || "";
    document.getElementById("personFormTitle").textContent = "Edit person";
    document.getElementById("personCancel").hidden = false;
    document.getElementById("personForm").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (action === "delete-person") {
    if (!id || !confirm("Delete this person? Their payments stay until you delete those too.")) return;
    try {
      const person = payers.find((item) => item.id === id);
      await addRecord({
        kind: "payer",
        payerKey: id,
        name: person?.name || "",
        phone: person?.phone || "",
        removed: true,
      });
      setBillStatus("Person deleted.", "ok");
      await refreshBilling();
    } catch (err) {
      console.error(err);
      setBillStatus(rulesHint(err), "err");
    }
    return;
  }

  if (action === "approve-tx") {
    try {
      await addRecord({
        kind: "change",
        targetId: id,
        status: "approved",
        approvedBy: currentUser,
      });
      setBillStatus("Payment approved. It now counts toward the due.", "ok");
      await refreshBilling();
    } catch (err) {
      console.error(err);
      setBillStatus(rulesHint(err), "err");
    }
    return;
  }

  if (action === "save-tx") {
    const name = document.getElementById("editName").value.trim();
    const amount = Number(document.getElementById("editAmount").value);
    const date = document.getElementById("editDate").value;
    if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
      setBillStatus("Enter a name, date, and amount.", "err");
      return;
    }
    try {
      await addRecord({
        kind: "change",
        targetId: id,
        name,
        amount,
        date,
      });
      selectedName = personKey(name);
      setBillStatus("Payment updated.", "ok");
      await refreshBilling();
    } catch (err) {
      console.error(err);
      setBillStatus(rulesHint(err), "err");
    }
    return;
  }

  if (action === "delete-tx") {
    if (!confirm("Delete this payment?")) return;
    try {
      await addRecord({
        kind: "change",
        targetId: id,
        removed: true,
      });
      selectedTxId = "";
      setBillStatus("Payment deleted.", "ok");
      await refreshBilling();
    } catch (err) {
      console.error(err);
      setBillStatus(rulesHint(err), "err");
    }
  }
});

billForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin() || !db) return;

  const name = billForm.payerName.value.trim();
  const phone = billForm.payerPhone.value.trim();
  const amount = Number(billForm.payerAmount.value);
  const date = billForm.payerDate.value;
  if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
    setBillStatus("Enter a name, date, and amount.", "err");
    return;
  }
  if (phone && !validPhone(phone)) {
    setBillStatus("Enter a valid 10-digit mobile, or leave it empty.", "err");
    return;
  }

  const button = document.getElementById("billSubmit");
  button.disabled = true;
  setBillStatus("Saving…");

  try {
    await addRecord({
      kind: "payment",
      name,
      phone,
      amount,
      date,
      status: "approved",
      method: "manual",
      addedBy: currentUser,
    });
    billForm.payerName.value = "";
    billForm.payerPhone.value = "";
    billForm.payerAmount.value = "";
    setBillStatus("Payment added and counted toward the due.", "ok");
    selectedName = personKey(name);
    selectedTxId = "";
    await refreshBilling();
  } catch (err) {
    console.error(err);
    setBillStatus(rulesHint(err), "err");
  } finally {
    button.disabled = false;
  }
});

applySession();
