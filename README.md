# GigsCourt — Setup Guide

A mobile-first web app for discovering local service providers.
Built with Firebase, Cloudinary, and Leaflet.js.

-----

## File Structure

```
nearby-services/
├── index.html           # Entry point + HTML shell
├── style.css            # All styles (mobile-first, dark theme)
├── App.js               # Application controller
├── FirebaseConfig.js    # Firebase init, Auth, Firestore helpers
├── MapComponent.js      # Leaflet map logic (search + profile picker)
├── ProfilePage.js       # Profile view + edit form
└── CloudinaryUpload.js  # Image upload to Cloudinary
```

-----

## Step 1 — Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
1. Create a new project
1. Enable **Authentication** → Sign-in method → **Email/Password**
1. Enable **Firestore Database** → Start in **test mode** (update rules before production)
1. Go to **Project Settings** → Your Apps → **Add a Web App**
1. Copy the config object into `FirebaseConfig.js`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### Firestore Security Rules (production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /serviceRequests/{doc} {
      allow read, write: if request.auth != null;
    }
    match /responses/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

-----

## Step 2 — Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
1. From the dashboard, note your **Cloud Name**
1. Go to **Settings → Upload → Upload Presets**
1. Click **Add upload preset**
- Set **Signing Mode** to `Unsigned`
- Note the preset name
1. Update `CloudinaryUpload.js`:

```js
const CLOUD_NAME    = "your_cloud_name";
const UPLOAD_PRESET = "your_unsigned_preset";
```

-----

## Step 3 — Serve the App

Because the app uses ES modules (`import`/`export`), it **must be served over HTTP**, not opened as a local file.

**Option A — VS Code Live Server**

- Install the Live Server extension
- Right-click `index.html` → Open with Live Server

**Option B — Python**

```bash
cd nearby-services
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option C — Node.js**

```bash
npx serve .
```

**Option D — Deploy to GitHub Pages / Netlify / Vercel**

- Push files to a repo and connect to Netlify/Vercel for instant HTTPS hosting.

-----

## Feature Overview

|Feature       |Description                                                       |
|--------------|------------------------------------------------------------------|
|Auth          |Email/password sign-up and login via Firebase Auth                |
|Dual role     |Every account can search (client) and offer services (provider)   |
|Profile       |Name, bio, photo, work photos, service, address with map          |
|Location      |Manual address entry + click-to-pin map picker                    |
|Search        |Fuzzy service name matching (barber ↔ hairdresser ↔ hair stylist) |
|Radius filter |1–50 km slider, sorts results by distance                         |
|Map           |Leaflet dark map, provider pins with profile photos               |
|Provider modal|Full profile card with work photo gallery and mini map            |
|Notifications |Firestore real-time: providers see live client requests           |
|Availability  |Providers tap “I’m Available” → client sees the response instantly|

-----

## Notes

- **No Firebase Storage** is used — all images go to Cloudinary.
- The map uses OpenStreetMap tiles (CartoDB Dark Matter) — no API key required.
- Reverse geocoding uses Nominatim (free, OSM) — no API key required.
- The app is entirely client-side (no backend server needed).
