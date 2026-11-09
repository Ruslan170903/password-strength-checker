/* ============================================================
   Parol Kuchi Tekshirgich — app.js
   Hammasi brauzerda ishlaydi. Parol hech qayerga yuborilmaydi.
   Tashqi kutubxona yo'q; hashlash uchun Web Crypto API ishlatiladi.
   ============================================================ */

"use strict";

/* ---------- Eng keng tarqalgan (zaif) parollar ---------- */
const COMMON_PASSWORDS = new Set([
  "password", "parol", "123456", "123456789", "12345678", "12345", "1234567",
  "qwerty", "qwerty123", "abc123", "111111", "000000", "123123", "1234567890",
  "iloveyou", "admin", "welcome", "monkey", "dragon", "letmein", "football",
  "princess", "sunshine", "master", "login", "passw0rd", "password1", "zaq12wsx",
  "qazwsx", "superman", "batman", "trustno1", "whatever", "shadow", "michael",
  "jennifer", "hunter", "baseball", "soccer", "andrew", "tigger", "charlie",
  "qwertyuiop", "asdfghjkl", "1q2w3e4r", "1qaz2wsx", "google", "starwars",
  "test", "test123", "root", "toor", "oliver", "salom", "salom123", "parol123",
  "ferrari", "pokemon", "samsung", "asdf", "asdfgh", "zxcvbn", "a1b2c3",
]);

/* Klaviatura ketma-ketliklari (pattern tekshiruvi uchun) */
const KEYBOARD_ROWS = [
  "qwertyuiop", "asdfghjkl", "zxcvbnm",
  "1234567890", "abcdefghijklmnopqrstuvwxyz",
];

/* ---------- Belgilar to'plami va entropiya ---------- */
function charsetSize(pw) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33; // belgilar, bo'sh joy, boshqalar
  return size;
}

/* ---------- Pattern (ketma-ketlik / takror) tekshiruvi ---------- */
function hasRepeats(pw) {
  // 3 va undan ortiq bir xil belgi ketma-ket: aaa, 111
  if (/(.)\1{2,}/.test(pw)) return true;
  // qisqa bo'lakning takrorlanishi: abcabcabc, 121212
  for (let unit = 1; unit <= 3; unit++) {
    if (pw.length >= unit * 3) {
      const piece = pw.slice(0, unit);
      if (piece.repeat(Math.floor(pw.length / unit)).startsWith(pw.slice(0, Math.floor(pw.length / unit) * unit)) &&
          pw === piece.repeat(pw.length / unit)) {
        return true;
      }
    }
  }
  return false;
}

function hasSequence(pw) {
  const lower = pw.toLowerCase();
  // o'suvchi/kamayuvchi kod ketma-ketligi: abcd, 4321
  let asc = 1, desc = 1;
  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    asc = diff === 1 ? asc + 1 : 1;
    desc = diff === -1 ? desc + 1 : 1;
    if (asc >= 4 || desc >= 4) return true;
  }
  // klaviatura qatorlari: qwert, asdfg ...
  for (const row of KEYBOARD_ROWS) {
    const rrow = row.split("").reverse().join("");
    for (let i = 0; i + 4 <= row.length; i++) {
      const frag = row.slice(i, i + 4);
      const rfrag = rrow.slice(i, i + 4);
      if (lower.includes(frag) || lower.includes(rfrag)) return true;
    }
  }
  return false;
}

function isCommon(pw) {
  const p = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(p)) return true;
  // oxiridagi raqamlarni olib tashlab ham tekshiramiz: "password2024" -> "password"
  const stripped = p.replace(/[0-9!@#$%^&*.]+$/, "");
  if (stripped.length >= 4 && COMMON_PASSWORDS.has(stripped)) return true;
  return false;
}

/* ---------- Asosiy tahlil ---------- */
function analyze(pw) {
  const checks = {
    length: pw.length >= 12,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
    nocommon: pw.length > 0 && !isCommon(pw),
    nopattern: pw.length > 0 && !hasRepeats(pw) && !hasSequence(pw),
  };

  const size = charsetSize(pw);
  let entropy = pw.length > 0 && size > 0 ? pw.length * Math.log2(size) : 0;

  // Patternlar aniqlansa, haqiqiy tasodifiylik pastroq — entropiyani kamaytiramiz
  const weakPattern = hasRepeats(pw) || hasSequence(pw);
  if (weakPattern) entropy *= 0.5;

  const common = pw.length > 0 && isCommon(pw);

  // Ball (score) 0..5
  let score;
  if (pw.length === 0) score = 0;
  else if (common) score = 1;
  else if (entropy < 28) score = 1;
  else if (entropy < 36) score = 2;
  else if (entropy < 60) score = 3;
  else if (entropy < 100) score = 4;
  else score = 5;

  // Qisqa parollar hech qachon "kuchli" bo'lolmaydi
  if (pw.length > 0 && pw.length < 8 && score > 2) score = 2;

  return { checks, entropy: common ? 0 : entropy, score, common, weakPattern };
}

/* ---------- Buzish vaqtini hisoblash ---------- */
function crackTime(entropyBits) {
  if (entropyBits <= 0) return "bir zumda";
  const guessesPerSec = 1e10; // ~10 mlrd/sek (oddiy GPU, tez hash)
  // O'rtacha urinishlar = yarim kalit maydoni = 2^(entropy-1)
  const seconds = Math.pow(2, entropyBits - 1) / guessesPerSec;
  return humanTime(seconds);
}

function humanTime(seconds) {
  if (!isFinite(seconds) || seconds > 3.15e15) return "amalda buzib bo'lmaydi";
  if (seconds < 1) return "bir zumda";
  const units = [
    ["sekund", 60],
    ["daqiqa", 60],
    ["soat", 24],
    ["kun", 30],
    ["oy", 12],
    ["yil", 100],
  ];
  let value = seconds;
  for (const [name, factor] of units) {
    if (value < factor) return `${Math.round(value)} ${name}`;
    value /= factor;
  }
  if (value < 10) return `${Math.round(value)} asr`;
  if (value < 1e4) return "asrlar";
  return "amalda buzib bo'lmaydi";
}

/* ---------- Tavsiyalar ---------- */
const LABELS = ["Parol kiriting", "Juda zaif", "Zaif", "O'rta", "Kuchli", "Juda kuchli"];

function buildSuggestions(pw, result) {
  if (pw.length === 0) {
    return [{ type: "", text: "Parol kiriting — bu yerda shaxsiy tavsiyalar chiqadi." }];
  }
  const s = [];
  const c = result.checks;

  if (result.common) {
    s.push({ type: "danger", text: "Bu juda keng tarqalgan parol — hujumchilar birinchi bo'lib shularni sinaydi. Umuman ishlatmang." });
  }
  if (result.weakPattern) {
    s.push({ type: "danger", text: "Ketma-ketlik yoki takror aniqlandi (masalan 1234, abcd, aaaa, qwerty). Bulardan saqlaning." });
  }
  if (!c.length) {
    s.push({ type: "", text: `Uzunlikni oshiring — hozir ${pw.length} ta belgi. Kamida 12, ideal holda 16+ belgi ishlating.` });
  }
  if (!c.lower || !c.upper) {
    s.push({ type: "", text: "Katta (A–Z) va kichik (a–z) harflarni aralashtiring." });
  }
  if (!c.number) {
    s.push({ type: "", text: "Kamida bitta raqam (0–9) qo'shing." });
  }
  if (!c.symbol) {
    s.push({ type: "", text: "Maxsus belgi qo'shing: ! @ # $ % & * ? ..." });
  }

  // Ijobiy fikr
  if (result.score >= 4 && s.length === 0) {
    s.push({ type: "good", text: "Ajoyib! Bu kuchli parol. Uni faqat bitta xizmatda ishlating va parol menejeriga saqlang." });
  } else if (result.score >= 4) {
    s.push({ type: "good", text: "Yaxshi asos bor — yuqoridagi nuqtalarni to'ldirsangiz, parol yanada mustahkam bo'ladi." });
  }

  if (s.length === 0) {
    s.push({ type: "", text: "Parolni biroz uzaytiring va tasodifiyroq qiling." });
  }
  return s;
}

/* ============================================================
   DOM
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const input = $("password");
  const meter = $("meter");
  const strengthLabel = $("strengthLabel");
  const entropyValue = $("entropyValue");
  const crackTimeEl = $("crackTime");
  const suggestionsEl = $("suggestions");

  const criteria = {
    length: $("crit-length"),
    lower: $("crit-lower"),
    upper: $("crit-upper"),
    number: $("crit-number"),
    symbol: $("crit-symbol"),
    nocommon: $("crit-nocommon"),
    nopattern: $("crit-nopattern"),
  };

  /* ---------- Jonli tahlil ---------- */
  function update() {
    const pw = input.value;
    const result = analyze(pw);

    // Meter
    meter.dataset.score = String(result.score);
    meter.setAttribute("aria-valuenow", String(result.score));

    // Yorliq
    strengthLabel.textContent = LABELS[result.score];
    const labelColors = ["", "var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)"];
    strengthLabel.style.color = labelColors[result.score] || "";

    // Metrikalar
    entropyValue.textContent = pw.length ? `${result.entropy.toFixed(0)} bit` : "—";
    crackTimeEl.textContent = pw.length ? crackTime(result.entropy) : "—";

    // Mezonlar
    for (const key in criteria) {
      const el = criteria[key];
      const met = result.checks[key];
      el.classList.toggle("met", !!met);
      el.classList.toggle("unmet", !met);
    }

    // Tavsiyalar
    const sugg = buildSuggestions(pw, result);
    suggestionsEl.innerHTML = "";
    for (const item of sugg) {
      const li = document.createElement("li");
      if (item.type) li.className = item.type;
      li.textContent = item.text;
      suggestionsEl.appendChild(li);
    }

    // Hash natijalari endi eskirgan — yashiramiz
    $("shaResult").hidden = true;
    $("pbkdf2Result").hidden = true;
  }

  input.addEventListener("input", update);
  update();

  /* ---------- Ko'rsatish / yashirish ---------- */
  const visBtn = $("toggleVisibility");
  const visUse = visBtn.querySelector("use");
  function setVisibility(show) {
    input.type = show ? "text" : "password";
    visUse.setAttribute("href", show ? "#i-eye-off" : "#i-eye");
  }
  visBtn.addEventListener("click", () => setVisibility(input.type === "password"));

  /* ---------- Mavzu (yorug'/qorong'u) ---------- */
  const themeBtn = $("themeToggle");
  const themeUse = themeBtn.querySelector("use");
  function syncThemeIcon() {
    const dark = document.documentElement.getAttribute("data-theme") !== "light";
    themeUse.setAttribute("href", dark ? "#i-sun" : "#i-moon");
  }
  syncThemeIcon();
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("parolmetr-theme", next); } catch (e) {}
    syncThemeIcon();
  });

  /* ---------- Kuchli parol generatsiyasi ---------- */
  $("generateBtn").addEventListener("click", () => {
    input.value = generatePassword(16);
    setVisibility(true);
    update();
    toast("Kuchli parol yaratildi");
  });

  /* ---------- Hashlash ---------- */
  $("hashSha").addEventListener("click", async () => {
    if (!requirePassword()) return;
    try {
      const hex = await sha256Hex(input.value);
      $("shaValue").textContent = hex;
      $("shaResult").hidden = false;
    } catch (e) {
      toast("Xatolik: " + e.message);
    }
  });

  $("hashPbkdf2").addEventListener("click", async () => {
    if (!requirePassword()) return;
    try {
      const { saltHex, hashHex } = await pbkdf2Hex(input.value);
      $("pbkdf2Salt").textContent = saltHex;
      $("pbkdf2Value").textContent = hashHex;
      $("pbkdf2Result").hidden = false;
    } catch (e) {
      toast("Xatolik: " + e.message);
    }
  });

  function requirePassword() {
    if (!input.value) {
      toast("Avval parol kiriting");
      return false;
    }
    return true;
  }

  /* ---------- Nusxa olish ---------- */
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const target = $(btn.dataset.copy);
      if (!target || !target.textContent) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        toast("Nusxa olindi ✓");
      } catch {
        // Fallback
        const r = document.createRange();
        r.selectNode(target);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        try { document.execCommand("copy"); toast("Nusxa olindi ✓"); } catch {}
        sel.removeAllRanges();
      }
    });
  });
});

/* ============================================================
   Yordamchilar — generator, hashlash, toast
   ============================================================ */

function generatePassword(length) {
  const sets = {
    lower: "abcdefghijkmnpqrstuvwxyz",   // o, l chiqarib tashlandi (chalkashmaslik uchun)
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",   // I, O chiqarib tashlandi
    number: "23456789",                   // 0, 1 chiqarib tashlandi
    symbol: "!@#$%^&*?-_=+",
  };
  const all = sets.lower + sets.upper + sets.number + sets.symbol;
  const pick = (chars) => chars[randomInt(chars.length)];

  // Har bir sinfdan kamida bittasi
  let out = [pick(sets.lower), pick(sets.upper), pick(sets.number), pick(sets.symbol)];
  for (let i = out.length; i < length; i++) out.push(pick(all));

  // Fisher–Yates aralashtirish (crypto bilan)
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

function randomInt(max) {
  // [0, max) oralig'ida bir tekis tasodifiy son
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % max;
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

async function pbkdf2Hex(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210000;
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial, 256
  );
  return {
    saltHex: bytesToHex(salt),
    hashHex: bytesToHex(new Uint8Array(bits)),
  };
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.hidden = true), 250);
  }, 1800);
}
