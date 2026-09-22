# Vision — skilled people network (India)

Early collection website for plumbers, electricians, carpenters, and other trades.
Host the site on **GitHub Pages**. Store every signup in **one Firebase cloud database**.

---

## How data works (important)

| Piece | Job |
|--------|-----|
| **GitHub Pages** | Hosts the website (HTML/CSS/JS). It does **not** store user data. |
| **Firebase Firestore** | One central cloud database. Every phone in India submits here. |
| **Your laptop / phone** | You open Firebase Console and see all signups in one place. |

```
Phone in Delhi  ──┐
Phone in Mumbai ──┼──► Vision website (GitHub) ──► Firebase (one database)
Phone in Jaipur ──┘
```

People do **not** keep data on their own phones. The form sends details over the internet to Firebase. You read everything from one dashboard.

**Free for early stage:** Firebase Spark (free) plan is enough while you collect the first users.

---

## 1. Put the site on GitHub

1. Create a new GitHub repository (example name: `vision`).
2. Upload these files (or `git push` from this folder).
3. On GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / root**.
4. Wait a minute. Your site will be at:
   `https://YOUR_USERNAME.github.io/vision/`

---

## 2. Create the central database (Firebase)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and sign in with Google.
2. **Add project** → name it `vision` (or similar).
3. Turn off Google Analytics if you want (optional).
4. Inside the project:
   - **Build → Firestore Database → Create database → Start in test mode** (OK for early collection; lock rules later).
   - Choose a location close to India (e.g. `asia-south1`).
5. **Project settings** (gear) → **Your apps → Web (`</>`)** → register app name `vision-web`.
6. Copy the `firebaseConfig` object.
7. Open `config.js` in this project and replace the `PASTE_…` values with your real keys.

Example:

```js
export const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "vision-xxxx.firebaseapp.com",
  projectId: "vision-xxxx",
  storageBucket: "vision-xxxx.appspot.com",
  messagingSenderId: "123…",
  appId: "1:123…:web:abc…",
};
```

8. In Firestore, allow writes for the `signups` collection while testing.  
   **Firestore → Rules** (early / open for collection only):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /signups/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

This lets anyone **submit** a form, but strangers cannot **read** your full user list from the browser.

9. Redeploy / push `config.js` to GitHub so Pages picks up the keys.

---

## 3. See all data in one place

1. Open Firebase Console → **Firestore Database**.
2. Open collection **`signups`**.
3. Every registration (any city, any phone) appears as a new document with:
   - name, phone, city, state, trade, experience, role, notes, time

You can later export to CSV or connect Google Sheets / admin tools.

---

## 4. Test locally before publish

Because the site uses ES modules + Firebase CDN:

```bash
# From this folder (Python example)
python -m http.server 5500
```

Open `http://localhost:5500` — do **not** open `index.html` as a `file://` path (modules will fail).

---

## Project files

| File | Purpose |
|------|---------|
| `index.html` | Landing + registration form |
| `styles.css` | Design |
| `app.js` | Form validation + save to Firestore |
| `config.js` | Your Firebase keys (edit this) |
| `README.md` | This guide |

---

## Next steps (after you collect people)

1. Add customer-side “need a plumber” flow.
2. Add admin login so only you can browse signups.
3. Tighten Firestore rules and add phone OTP if needed.
4. Move from “collection” to real matching / booking.

When Firebase is configured and the site is on GitHub Pages, tell me and we can move to matching, admin view, or WhatsApp alerts.
