# How to get the JWT (access token) for testing sync-role

You need to be **logged in** at `http://localhost:3000`, then get the token from the browser.

---

## Option A: Dashboard button (recommended)

1. Log in and go to **http://localhost:3000/dashboard**.
2. Under the welcome text you’ll see a small link: **“Copiar JWT (para Postman)”**.
3. Click it. If you have a valid Supabase session, the JWT is copied to your clipboard and you’ll see a confirmation.
4. In Postman:
   - **GET:** `http://localhost:3000/api/auth/sync-role?accessToken=PASTE_TOKEN_HERE`
   - **POST:** URL `http://localhost:3000/api/auth/sync-role`, Body → raw → JSON: `{ "accessToken": "PASTE_TOKEN_HERE" }`

If you see **“No hay sesión de Supabase”**: log out, then log in again with email/password and try the button again.

---

**Open the Console on Mac (any browser):**
1. **Right‑click** anywhere on the page (e.g. http://localhost:3000) → choose **Inspect** (or **Inspect Element**).
2. A panel opens at the bottom or side. At the **top of that panel**, click the **Console** tab (next to Elements, Network, etc.).
3. You should see a prompt like `>` where you can type or paste. That’s the Console.

Alternative: **View → Developer → JavaScript Console** (Chrome) or **Tools → Browser Tools → Web Console** (Firefox).

---

## Option B: Browser console (localStorage script)

1. Open **http://localhost:3000** and **log in** (email + password or social).
2. **Right‑click** the page → **Inspect** → click the **Console** tab in the panel that opens.
3. Paste this and press **Enter**:

```javascript
(function () {
  var key = Object.keys(localStorage).find(function (k) {
    return k.startsWith('sb-') && k.endsWith('-auth-token');
  });
  if (!key) {
    console.log('Not logged in. Log in at /login first.');
    return;
  }
  var data = JSON.parse(localStorage.getItem(key) || '{}');
  var token = data?.session?.access_token;
  if (!token) {
    console.log('No access_token in session. Log out and log in again, or use the dashboard link "Copiar JWT (para Postman)" on /dashboard.');
    return;
  }
  console.log('Access token (copy for Postman):');
  console.log(token);
  if (typeof copy === 'function') copy(token);
})();
```

4. The **access token** (long string starting with `eyJ...`) is printed. In many browsers it is also **copied to your clipboard**.
5. Use it in Postman:
   - **GET:** `http://localhost:3000/api/auth/sync-role?accessToken=PASTE_TOKEN_HERE`
   - **POST:** URL `http://localhost:3000/api/auth/sync-role`, Body → raw → JSON: `{ "accessToken": "PASTE_TOKEN_HERE" }`

---

**If you see “No access_token in session”:** the stored Supabase session may be missing or expired. Log out, log in again with email/password, then run the script (or use Option A).

---

## Option C: Application → Local Storage

1. Log in at **http://localhost:3000**.
2. **Right‑click** the page → **Inspect** → in the top bar of the panel, open **Application** (Chrome) or **Storage** (Firefox).
3. In the left sidebar: **Local Storage** → **http://localhost:3000**.
4. Find the key named **`sb-XXXXX-auth-token`** (XXXXX = your Supabase project id from the URL, e.g. `abcdefgh` from `https://abcdefgh.supabase.co`).
5. Click the key. The value is JSON. Find **`session.access_token`** and copy its value (the long JWT starting with `eyJ...`).

---

## Option D: One-liner in console

If you're already logged in, you can also run:

```javascript
JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('sb-') && k.includes('auth-token')) || '{}'))?.session?.access_token
```

That prints the token (or `undefined` if not logged in). Copy the output and use it as `accessToken` in Postman.
