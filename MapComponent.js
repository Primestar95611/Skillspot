/**

- MapComponent.js
- ───────────────
- All Leaflet.js map logic:
- • Initialising the search map and the profile-picker map
- • Rendering provider pins with custom profile-photo markers
- • Radius filtering and distance-sorted results
- • “Locate me” geolocation helper
- • Reverse geocoding (Nominatim)
  */

// Leaflet is loaded globally via <script> in index.html
// We access it through window.L

let searchMap      = null;   // Leaflet map instance for the search tab
let profileMap     = null;   // Leaflet map instance for the profile address picker
let clientMarker   = null;   // Blue circle for the client’s position
let providerLayer  = null;   // LayerGroup holding provider markers
let clientLat      = null;
let clientLng      = null;

// Callback fired when user picks a location on the profile map
let onProfileLocationPicked = null;

/**

- Initialise (or re-use) the search/discovery map.
- @param {string}   containerId    – DOM element id, default “map”
- @param {function} onProviderClick – called with provider data when a pin is tapped
  */
  function initSearchMap(containerId = “map”, onProviderClick = null) {
  if (searchMap) {
  searchMap.invalidateSize();
  return;
  }

searchMap = L.map(containerId, {
zoomControl: true,
attributionControl: false,
}).setView([51.505, -0.09], 13); // Default: London (overridden by geolocation)

// Dark-style tile layer (CartoDB Dark Matter)
L.tileLayer(
“https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png”,
{ maxZoom: 19 },
).addTo(searchMap);

providerLayer = L.layerGroup().addTo(searchMap);

// Store the click callback so renderProviders can use it
searchMap._onProviderClick = onProviderClick;

return searchMap;
}

/**

- Initialise (or re-use) the profile-picker map.
- @param {string}   containerId
- @param {function} onPick – called with { lat, lng, address } when user clicks
  */
  async function initProfileMap(containerId = “profileMap”, onPick = null) {
  onProfileLocationPicked = onPick;

// If already exists, just re-attach callback and refresh
if (profileMap) {
profileMap.invalidateSize();
onProfileLocationPicked = onPick;
return profileMap;
}

profileMap = L.map(containerId, {
zoomControl: true,
attributionControl: false,
}).setView([51.505, -0.09], 13);

L.tileLayer(
“https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png”,
{ maxZoom: 19 },
).addTo(profileMap);

let pickerMarker = null;

profileMap.on(“click”, async (e) => {
const { lat, lng } = e.latlng;

```
if (pickerMarker) profileMap.removeLayer(pickerMarker);
pickerMarker = L.circleMarker([lat, lng], {
  radius: 8,
  color: "#e8a234",
  fillColor: "#e8a234",
  fillOpacity: 0.9,
  weight: 2,
}).addTo(profileMap);

// Reverse geocode to get a human-readable address
const address = await reverseGeocode(lat, lng);

if (onProfileLocationPicked) onProfileLocationPicked({ lat, lng, address });
```

});

return profileMap;
}

/**

- Place (or move) the client marker on the search map.
- @param {number} lat
- @param {number} lng
  */
  function setClientPosition(lat, lng) {
  clientLat = lat;
  clientLng = lng;

if (!searchMap) return;

if (clientMarker) searchMap.removeLayer(clientMarker);

clientMarker = L.circleMarker([lat, lng], {
radius: 9,
color: “#4caf72”,
fillColor: “#4caf72”,
fillOpacity: 0.85,
weight: 2,
})
.addTo(searchMap)
.bindPopup(”<strong>You are here</strong>”);

searchMap.setView([lat, lng], 14);
}

/**

- Render provider markers on the search map.
- Clears existing markers first.
- 
- @param {Array}  providers   – array of user profile objects with lat/lng
- @param {number} radiusKm    – only show providers within this distance
  */
  function renderProviderMarkers(providers, radiusKm = 50) {
  if (!searchMap) return;

providerLayer.clearLayers();

providers.forEach((p) => {
if (!p.lat || !p.lng) return;

```
// Distance filter
if (clientLat !== null) {
  const dist = haversineKm(clientLat, clientLng, p.lat, p.lng);
  if (dist > radiusKm) return;
}

const icon = buildProviderIcon(p.photoURL);
const marker = L.marker([p.lat, p.lng], { icon })
  .addTo(providerLayer)
  .bindPopup(
    `<strong>${escHtml(p.name || "Provider")}</strong>
     ${escHtml(p.serviceName || p.serviceCategory || "")}`,
  );

marker.on("click", () => {
  if (searchMap._onProviderClick) searchMap._onProviderClick(p);
});
```

});
}

/**

- Move the profile map to a specific lat/lng.
  */
  function flyProfileMapTo(lat, lng) {
  if (!profileMap) return;
  profileMap.setView([lat, lng], 15);
  }

/**

- Build a custom Leaflet DivIcon with the provider’s profile photo.
- Falls back to a styled letter icon.
  */
  function buildProviderIcon(photoURL) {
  const size = 38;
  const html = photoURL
  ? `<div class="custom-marker"><img src="${escHtml(photoURL)}" loading="lazy"/></div>`
  : `<div class="custom-marker" style="display:flex;align-items:center;justify-content:center;font-size:1rem">👤</div>`;

return L.divIcon({
html,
className: “”,
iconSize:  [size, size],
iconAnchor: [size / 2, size / 2],
popupAnchor: [0, -(size / 2)],
});
}

/**

- Use the browser’s Geolocation API to get the user’s position.
- Updates the search map automatically.
- 
- @returns {Promise<{lat: number, lng: number}>}
  */
  function locateUser() {
  return new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
  reject(new Error(“Geolocation not supported”));
  return;
  }
  navigator.geolocation.getCurrentPosition(
  (pos) => {
  const { latitude: lat, longitude: lng } = pos.coords;
  setClientPosition(lat, lng);
  resolve({ lat, lng });
  },
  (err) => reject(new Error(err.message)),
  { enableHighAccuracy: true, timeout: 10000 },
  );
  });
  }

/**

- Geocode an address string → { lat, lng }.
- Uses OpenStreetMap Nominatim (free, no key required).
- 
- @param {string} address
- @returns {Promise<{lat: number, lng: number, display: string}|null>}
  */
  async function geocodeAddress(address) {
  if (!address.trim()) return null;
  try {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res  = await fetch(url, { headers: { “Accept-Language”: “en” } });
  const data = await res.json();
  if (!data.length) return null;
  return {
  lat:     parseFloat(data[0].lat),
  lng:     parseFloat(data[0].lon),
  display: data[0].display_name,
  };
  } catch {
  return null;
  }
  }

/**

- Reverse geocode lat/lng → human-readable address string.
- @param {number} lat
- @param {number} lng
- @returns {Promise<string>}
  */
  async function reverseGeocode(lat, lng) {
  try {
  const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res  = await fetch(url, { headers: { “Accept-Language”: “en” } });
  const data = await res.json();
  // Return a compact address
  const a = data.address || {};
  const parts = [
  a.road,
  a.suburb || a.neighbourhood,
  a.city || a.town || a.village,
  a.country,
  ].filter(Boolean);
  return parts.join(”, “) || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  }

/**

- Filter and sort a provider array by distance from the client.
- 
- @param {Array}  providers
- @param {number} radiusKm
- @returns {Array} filtered and sorted, with .distanceKm added
  */
  function filterAndSortByDistance(providers, radiusKm) {
  if (clientLat === null) return providers;

return providers
.map((p) => {
const d = p.lat && p.lng
? haversineKm(clientLat, clientLng, p.lat, p.lng)
: Infinity;
return { …p, distanceKm: d };
})
.filter((p) => p.distanceKm <= radiusKm)
.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**

- Open a mini map in a given container showing a single pin.
- Used in the provider profile modal.
- 
- @param {string} containerId
- @param {number} lat
- @param {number} lng
- @param {string} label
  */
  function showMiniMap(containerId, lat, lng, label = “”) {
  // Destroy previous instance if any
  const el = document.getElementById(containerId);
  if (!el) return;
  if (el._leaflet_id) {
  el._leaflet_id = null;
  el.innerHTML = “”;
  }

const mini = L.map(containerId, {
zoomControl: false,
attributionControl: false,
dragging: false,
scrollWheelZoom: false,
doubleClickZoom: false,
touchZoom: false,
}).setView([lat, lng], 15);

L.tileLayer(
“https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png”,
{ maxZoom: 19 },
).addTo(mini);

L.circleMarker([lat, lng], {
radius: 9,
color: “#e8a234”,
fillColor: “#e8a234”,
fillOpacity: 0.9,
})
.addTo(mini)
.bindPopup(label)
.openPopup();
}

// ─── UTILITY ─────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
const R  = 6371;
const dL = ((lat2 - lat1) * Math.PI) / 180;
const dG = ((lng2 - lng1) * Math.PI) / 180;
const a  =
Math.sin(dL / 2) ** 2 +
Math.cos((lat1 * Math.PI) / 180) *
Math.cos((lat2 * Math.PI) / 180) *
Math.sin(dG / 2) ** 2;
return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function escHtml(str) {
return String(str ?? “”)
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/”/g, “"”);
}

export {
initSearchMap,
initProfileMap,
setClientPosition,
renderProviderMarkers,
flyProfileMapTo,
locateUser,
geocodeAddress,
reverseGeocode,
filterAndSortByDistance,
showMiniMap,
haversineKm,
};
