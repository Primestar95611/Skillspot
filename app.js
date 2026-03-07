// App.js
// ─────────────────────────────────────────────────────────
//  GigsCourt — Service Marketplace PWA
//  Main Application Logic & State Hub
//
//  Architecture:
//    App.js        → owns all shared state, GPS logic
//    Header        → search bar + radius slider (stateless)
//    CategoryGrid  → horizontal category filter  [next step]
//    ProviderCard  → Instagram-style cards        [next step]
//    locationService → Haversine GPS math         [next step]
// ─────────────────────────────────────────────────────────

import { useState, useCallback } from “react”;
import “./styles.css”;
import Header from “./components/Header”;

// ─── App Component ────────────────────────────────────────
export default function App() {

// ── Search & Radius State ────────────────────────────
// These will be passed down to Header and later used
// to filter the ProviderCard list.
const [searchQuery, setSearchQuery]   = useState(””);
const [radiusKm,    setRadiusKm]      = useState(5); // default: 5 km

// ── GPS / Location State ─────────────────────────────
// locationLabel → human-readable name shown in the header pill
// userCoords    → { lat, lng } used by locationService later
// isLocating    → true while GPS is fetching (drives UI spinner)
const [locationLabel, setLocationLabel] = useState(””);
const [userCoords,    setUserCoords]    = useState(null);
const [isLocating,    setIsLocating]    = useState(false);

// ── GPS Handler ──────────────────────────────────────
// Requests the device GPS, then does a reverse-geocode
// to get a human area name (e.g. “Sabo Auchi”).
// locationService.js will own the Haversine math later;
// this function owns the GPS fetch + label resolution.
const handleRequestGPS = useCallback(() => {
if (!navigator.geolocation) {
alert(“Location is not supported on this device.”);
return;
}

```
setIsLocating(true);

navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude: lat, longitude: lng } = position.coords;

    setUserCoords({ lat, lng });

    // Reverse-geocode: get a readable area name from coordinates.
    // Uses the free OpenStreetMap Nominatim API — no key required.
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();

      // Pick the most useful label available in the response
      const label =
        data.address?.suburb    ||
        data.address?.town      ||
        data.address?.village   ||
        data.address?.city      ||
        data.address?.county    ||
        "My Location";

      setLocationLabel(label);
    } catch {
      // Fallback if network fails — show raw coordinates
      setLocationLabel(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    }

    setIsLocating(false);
  },
  (error) => {
    console.error("GPS error:", error.message);
    setIsLocating(false);
    alert("Could not get your location. Please check your permissions.");
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000, // cache position for 60s
  }
);
```

}, []);

// ── Render ───────────────────────────────────────────
return (
<div className="app-root">

```
  {/* ── Sticky Header (Search + Radius Slider) ───── */}
  <Header
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    radiusKm={radiusKm}
    onRadiusChange={setRadiusKm}
    locationLabel={locationLabel}
    onRequestGPS={handleRequestGPS}
    isLocating={isLocating}
  />

  {/* ── Main Content Area ────────────────────────── */}
  {/* CategoryGrid and ProviderCards slot in here next */}
  <main className="app-main">

    {/* Temporary placeholder — removed in next step */}
    <div className="app-placeholder">
      <div className="placeholder-icon">⚡</div>
      <p className="placeholder-title">GigsCourt is live.</p>
      <p className="placeholder-sub">
        Provider cards load here next.
      </p>

      {/* Debug readout — helpful during development */}
      <div className="debug-panel">
        <div className="debug-row">
          <span>Search</span>
          <strong>{searchQuery || "—"}</strong>
        </div>
        <div className="debug-row">
          <span>Radius</span>
          <strong>{radiusKm} km</strong>
        </div>
        <div className="debug-row">
          <span>Location</span>
          <strong>{locationLabel || "Not set"}</strong>
        </div>
        <div className="debug-row">
          <span>Coords</span>
          <strong>
            {userCoords
              ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
              : "—"}
          </strong>
        </div>
      </div>
    </div>

  </main>

</div>
```

);
}

// ─── Inline styles for placeholder (no extra CSS file needed) ─
// These are temporary and will be deleted in the next step.
const style = document.createElement(“style”);
style.textContent = `
.app-root {
min-height: 100dvh;
display: flex;
flex-direction: column;
background: var(–off-white);
}

.app-main {
flex: 1;
padding: 24px 16px;
display: flex;
flex-direction: column;
gap: 20px;
}

/* ── Placeholder ── */
.app-placeholder {
flex: 1;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
gap: 8px;
padding: 48px 0;
text-align: center;
animation: fadeInUp 0.5s ease both;
}

.placeholder-icon {
font-size: 40px;
margin-bottom: 8px;
}

.placeholder-title {
font-family: var(–font-display);
font-size: 22px;
font-weight: 700;
color: var(–text-primary);
margin: 0;
}

.placeholder-sub {
font-size: 14px;
color: var(–text-muted);
margin: 0 0 20px;
}

/* ── Debug Panel ── */
.debug-panel {
width: 100%;
max-width: 320px;
background: var(–white);
border: 1.5px dashed var(–border);
border-radius: var(–radius-md);
padding: 14px 18px;
display: flex;
flex-direction: column;
gap: 10px;
}

.debug-row {
display: flex;
justify-content: space-between;
align-items: center;
font-size: 13px;
}

.debug-row span {
color: var(–text-muted);
font-weight: 400;
}

.debug-row strong {
color: var(–text-primary);
font-weight: 600;
max-width: 180px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
`;
document.head.appendChild(style);
