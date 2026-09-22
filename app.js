import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, COLLECTION_NAME } from "./config.js";

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
    setStatus("Could not save. Check Firebase rules / internet and try again.", "err");
  } finally {
    submitBtn.disabled = false;
  }
});
