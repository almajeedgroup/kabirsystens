# Going live with Firebase

The app runs in two modes automatically:

- **Local mode** (default) — no credentials set. Data lives in the browser;
  no login. This is what the preview link uses.
- **Firebase mode** — as soon as real credentials are present, the app shows an
  **admin login** and stores everything in **Cloud Firestore**.

Follow the steps below once to go live. You only do steps 1–4 a single time.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `kabir-college`), accept the defaults, and create it.

## 2. Add a Web App and copy the config

1. In the project, click the **Web** icon (`</>`) to register a web app.
2. Give it a nickname, click **Register app**.
3. Copy the `firebaseConfig` values shown (apiKey, authDomain, projectId, …).

Put them into the project either way:

**Option A — `.env` file (recommended, keeps them out of source):**
create a file named `.env` in the project root:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Option B —** paste them directly into `src/firebaseConfig.js`.

## 3. Enable Email/Password sign-in and create the admin

1. Firebase Console → **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Email/Password**.
3. **Users** tab → **Add user** → enter the admin email and a password.
   That is the single administrator login for the app.

## 4. Create the Firestore database

1. Firebase Console → **Build → Firestore Database → Create database**.
2. Start in **production mode** and pick a region close to you.
3. The security rules in `firestore.rules` (only signed-in users can read/write)
   are deployed in the next step.

## 5. Deploy

Install the Firebase CLI once: `npm install -g firebase-tools`, then:

```bash
firebase login
# set your project id in .firebaserc (replace YOUR_FIREBASE_PROJECT_ID)
npm run build
firebase deploy
```

`firebase deploy` publishes the built app to **Firebase Hosting** and uploads the
Firestore security rules. The CLI prints your live URL
(`https://YOUR_PROJECT.web.app`).

## Everyday use

- Open the live URL, sign in with the admin email/password.
- Everything you enter saves to Firestore automatically and is available on any
  device you sign in from.
- Use **Finance → Import & Export → Download Backup** regularly for an extra copy.
- To move data you entered in the preview/local mode into the cloud: download a
  backup there, sign in to the live app, then **Restore Backup**.

## Redeploying after changes

```bash
npm run build && firebase deploy --only hosting
```
