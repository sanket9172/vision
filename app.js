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
let signups = [];
let selectedName = "";

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
    billForm.hidden = currentUser !== "sanket";
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
    return "Firestore is blocking this. Publish the updated rules in firestore.rules, then try again.";
  }
  return "Could not load data. Check your internet and try again.";
}

async function loadSignups() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  signups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  signups.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

async function loadTransactions() {
  const snap = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
  transactions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  transactions.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
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

function totalsByName() {
  const totals = new Map();
  transactions.forEach((row) => {
    const key = personKey(row.name);
    const prev = totals.get(key) || { name: row.name, total: 0, count: 0 };
    prev.total += Number(row.amount) || 0;
    prev.count += 1;
    totals.set(key, prev);
  });
  return totals;
}

function renderBillTotal() {
  if (!selectedName) {
    billTotal.innerHTML = `<p class="eyebrow">Total bill</p><p class="bill-empty">Select a record to see that person’s total.</p>`;
    return;
  }
  const info = totalsByName().get(selectedName);
  billTotal.innerHTML = `
    <p class="eyebrow">Total bill</p>
    <h3>${escapeHtml(info?.name || selectedName)}</h3>
    <p class="count-num count-num-sm">${money(info?.total || 0)}</p>
    <p class="count-label">${info?.count || 0} payment${info?.count === 1 ? "" : "s"}</p>
  `;
}

function renderBillings() {
  if (!transactions.length) {
    billingList.innerHTML = `<p class="bill-empty">No transactions yet.</p>`;
    renderBillTotal();
    return;
  }
  billingList.innerHTML = transactions
    .map((row) => {
      const key = personKey(row.name);
      const active = key === selectedName ? " is-active" : "";
      return `<button type="button" class="billing-row${active}" data-name="${escapeHtml(key)}">
        <span>${formatDate(row.date)}</span>
        <span>${escapeHtml(row.name || "—")}</span>
        <span>${money(Number(row.amount) || 0)}</span>
      </button>`;
    })
    .join("");
  renderBillTotal();
}

billingList?.addEventListener("click", (event) => {
  const row = event.target.closest(".billing-row");
  if (!row) return;
  selectedName = row.dataset.name || "";
  renderBillings();
});

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
      payerDate.value = new Date().toISOString().slice(0, 10);
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

billForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentUser !== "sanket" || !db) return;

  const name = billForm.payerName.value.trim();
  const amount = Number(billForm.payerAmount.value);
  const date = billForm.payerDate.value;
  if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
    billStatus.textContent = "Enter a name, date, and amount.";
    billStatus.className = "form-status err";
    return;
  }

  const button = document.getElementById("billSubmit");
  button.disabled = true;
  billStatus.textContent = "Saving…";
  billStatus.className = "form-status";

  try {
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      name,
      amount,
      date,
      addedBy: "sanket",
      createdAt: serverTimestamp(),
    });
    billForm.payerName.value = "";
    billForm.payerAmount.value = "";
    billStatus.textContent = "Transaction added.";
    billStatus.className = "form-status ok";
    selectedName = personKey(name);
    await loadTransactions();
    renderBillings();
  } catch (err) {
    console.error(err);
    billStatus.textContent = rulesHint(err);
    billStatus.className = "form-status err";
  } finally {
    button.disabled = false;
  }
});

applySession();
