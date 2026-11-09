# 🔐 Parol Kuchi Tekshirgich (Password Strength Checker)

Foydalanuvchi kiritgan parolning **kuchliligini real vaqtda** baholaydigan, **tavsiyalar** beradigan va **hashlashni** ko'rsatadigan veb-ilova. Hammasi **brauzerda** ishlaydi — parol hech qachon serverga yuborilmaydi.

> **Maxfiylik:** Parolingiz **hech qachon serverga yuborilmaydi** — barcha tahlil va hashlash sahifaning o'zida (brauzerda) bajariladi. Yagona tashqi so'rov — chiroyli shrift (Google Fonts); u parolga aloqasi yo'q va shriftsiz ham tizim shrifti bilan ishlayveradi. `localStorage` da faqat tanlagan mavzuingiz (yorug'/qorong'u) saqlanadi.

---

## ✨ Imkoniyatlar

- **Kuch o'lchagich** — entropiya (bit) asosida 5 darajali baho (Juda zaif → Juda kuchli).
- **Taxminiy buzish vaqti** — oddiy GPU (~10 mlrd urinish/sek) uchun hisoblanadi.
- **Mezonlar ro'yxati** — uzunlik, katta/kichik harf, raqam, belgi, keng tarqalgan parol emasligi, ketma-ketlik/takror yo'qligi.
- **Shaxsiy tavsiyalar** — parolga qarab, nimani yaxshilash kerakligini aytadi.
- **"Qayerda qanday parol"** — bank, email, ijtimoiy tarmoq va h.k. uchun yo'riqnoma.
- **Kuchli parol generatori** — `crypto.getRandomValues` bilan tasodifiy, xavfsiz parol.
- **Hashlash demosi** — `SHA-256` (tez) va `PBKDF2` (parolga mos, salt bilan) ni solishtiradi va farqini tushuntiradi.
- **Zamonaviy interfeys** — yorug'/qorong'u mavzu almashtirgich, toza SVG ikonalar, glassmorphism dizayn, mobilga to'liq moslashgan.

---

## 🚀 Ishga tushirish (lokal)

Hech qanday build yoki o'rnatish shart emas — oddiy statik sayt.

**Eng oddiy yo'l:** `index.html` faylini brauzerda oching.

**Yoki lokal server bilan** (tavsiya — `file://` emas, `localhost` da ba'zi brauzer xususiyatlari to'g'riroq ishlaydi):

```bash
# Python 3
python -m http.server 8000
# keyin brauzerda: http://localhost:8000
```

```bash
# yoki Node (npx)
npx serve .
```

---

## 🌍 GitHub Pages'ga bepul joylashtirish

1. Ushbu papkani GitHub'ga yangi repozitoriya qilib yuklang (push).
2. Repo sahifasida **Settings → Pages**.
3. **Source** → `Deploy from a branch`, branch: `main`, papka: `/ (root)`.
4. Saqlang — bir necha daqiqadan so'ng saytingiz `https://<username>.github.io/<repo-nomi>/` manzilida jonli bo'ladi.

---

## 📁 Loyiha tuzilmasi

```
.
├── index.html        # Sahifa tuzilmasi (markup)
├── css/
│   └── style.css     # Dizayn (qorong'u/yorug' rejim, responsive)
├── js/
│   └── app.js        # Kuch tahlili, tavsiyalar, generator, hashlash
├── README.md
└── LICENSE
```

---

## 🧠 Qanday ishlaydi (texnik qism)

### Kuch o'lchash
Parol kuchi **entropiya** (bit) orqali baholanadi:

```
entropiya = parol_uzunligi × log2(belgilar_to'plami_hajmi)
```

So'ng keng tarqalgan parollar, ketma-ketliklar (`1234`, `abcd`, `qwerty`) va takrorlar (`aaaa`) uchun **jarima** qo'llanadi — chunki ular "tasodifiy" ko'rinsa ham, aslida oson taxmin qilinadi.

| Entropiya | Baho |
|-----------|------|
| < 28 bit  | Juda zaif |
| 28–35     | Zaif |
| 36–59     | O'rta |
| 60–99     | Kuchli |
| 100+ bit  | Juda kuchli |

### Hashlash: SHA-256 vs PBKDF2 (muhim dars)

| | SHA-256 | PBKDF2 / bcrypt / argon2 |
|---|---|---|
| Tezlik | **Juda tez** (zaiflik) | **Ataylab sekin** (kuch) |
| Salt | Yo'q | **Bor** (har safar boshqa) |
| Vazifasi | Fayl yaxlitligi, imzo | **Parol saqlash** |

Tez hash (SHA/MD5) parol uchun **yomon**, chunki hujumchi sekundiga milliardlab urinadi va "rainbow table" ishlatadi. Parol uchun **sekin + salt**li algoritmlar kerak.

> ⚠️ **Eslatma:** Haqiqiy ilovalarda parol **serverda** hashlanishi kerak. Agar brauzerda hashlab serverga yuborsangiz, hashning o'zi "parol"ga aylanadi (pass-the-hash). Bu loyihadagi hashlash — faqat **o'rganish uchun demo**.

---

## 🔒 Xavfsizlik tamoyillari (ilovaning o'zi targ'ib qiladi)

- Har bir xizmat uchun **alohida, unikal** parol.
- Uzunlik > murakkablik: **16+ belgi** yoki 4–5 so'zdan iborat **passphrase**.
- **Parol menejeri** (Bitwarden, KeePassXC, 1Password) ishlating.
- Imkoni bo'lsa hamma joyda **2FA** yoqing.
- Parolni hech kimga aytmang, brauzerda/qog'ozda ochiq saqlamang.

---

## 📄 Litsenziya

[MIT](LICENSE) — erkin foydalaning, o'zgartiring va ulashing.

---

*Ushbu loyiha ta'limiy maqsadda yaratilgan. Xatolarni topsangiz yoki g'oyangiz bo'lsa — issue oching yoki pull request yuboring.*
