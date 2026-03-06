/**

- ProfilePage.js
- ──────────────
- Handles everything in the Profile tab:
- • Rendering the profile view (read mode)
- • Rendering the profile edit form (write mode)
- • Address geocoding + map picker integration
- • Work photo grid management
- • Delegating saves to FirebaseConfig and uploads to CloudinaryUpload
  */

import { loadUserProfile, saveUserProfile } from “./FirebaseConfig.js”;
import {
uploadProfilePhoto,
uploadWorkPhoto,
createLocalPreview,
} from “./CloudinaryUpload.js”;
import {
initProfileMap,
geocodeAddress,
flyProfileMapTo,
reverseGeocode,
} from “./MapComponent.js”;

// Service categories for the dropdown
const SERVICE_CATEGORIES = [
“Beauty & Hair”,
“Health & Wellness”,
“Home Repair”,
“Cleaning”,
“Electrical”,
“Plumbing”,
“Education & Tutoring”,
“Pet Care”,
“Photography”,
“Fitness”,
“Tech & IT Support”,
“Event Planning”,
“Catering & Cooking”,
“Transport & Delivery”,
“Legal & Finance”,
“Design & Creative”,
“Other”,
];

let currentUid    = null;
let profileData   = {};
let editMode      = false;
let pendingPhotos = []; // { file, preview } – not yet uploaded

// ─── PUBLIC API ──────────────────────────────────────────────────

/**

- Load and render the profile for the given UID.
- @param {string} uid
- @param {HTMLElement} container
  */
  async function renderProfilePage(uid, container) {
  currentUid  = uid;
  editMode    = false;
  pendingPhotos = [];

const data = await loadUserProfile(uid);
profileData = data || {};

container.innerHTML = buildProfileViewHTML(profileData);
attachProfileViewEvents(container);
}

/**

- Switch the profile container into edit mode.
- @param {HTMLElement} container
  */
  async function renderProfileEditForm(container) {
  editMode = true;
  container.innerHTML = buildProfileFormHTML(profileData);
  await attachProfileFormEvents(container);
  }

// ─── VIEW MODE ───────────────────────────────────────────────────

function buildProfileViewHTML(p) {
const hasProfile = p && p.name;
if (!hasProfile) {
return ` <div class="profile-header"> <div class="profile-avatar-wrap"> <img class="profile-avatar" src="https://via.placeholder.com/90?text=👤" alt="avatar"/> </div> <h2 class="profile-name">Complete Your Profile</h2> </div> <div style="padding:0 16px"> <button class="btn-primary" id="editProfileBtn">Set Up Profile</button> </div>`;
}

const photos = (p.workPhotos || []).map(
(url) => `<img class="work-photo-item" src="${esc(url)}" alt="work photo" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`,
).join(””) || ‘<p style="color:var(--text3);font-size:0.85rem">No work photos yet</p>’;

return `<div class="profile-header"> <div class="profile-avatar-wrap"> <img class="profile-avatar" src="${esc(p.photoURL || 'https://via.placeholder.com/90?text=👤')}" alt="avatar"/> </div> <h2 class="profile-name">${esc(p.name || "")}</h2> ${p.serviceName ?`<span class="profile-service-badge">${esc(p.serviceName)}</span>` : “”}
</div>

```
<div class="profile-section">
  <div class="profile-section-title">About</div>
  <p class="profile-bio-text">${esc(p.bio || "No bio yet.")}</p>
</div>

<div class="profile-section">
  <div class="profile-section-title">Service</div>
  <p style="font-size:0.9rem;color:var(--text2)">
    <span style="color:var(--accent);font-weight:600">${esc(p.serviceName || "—")}</span>
    ${p.serviceCategory ? `<span style="color:var(--text3)"> · ${esc(p.serviceCategory)}</span>` : ""}
  </p>
</div>

${p.address ? `
<div class="profile-section">
  <div class="profile-section-title">Location</div>
  <p class="profile-address-text" id="viewAddressLink">📍 ${esc(p.address)}</p>
  ${p.lat && p.lng ? `<div class="map-picker-wrap" id="viewMiniMap" style="display:none"></div>` : ""}
</div>` : ""}

<div class="profile-section">
  <div class="profile-section-title">Work Photos (${(p.workPhotos || []).length})</div>
  <div class="work-photos-grid">${photos}</div>
</div>

<div style="padding:0 0 16px">
  <button class="btn-primary" id="editProfileBtn">Edit Profile</button>
</div>
```

`;
}

function attachProfileViewEvents(container) {
container.querySelector(”#editProfileBtn”)?.addEventListener(“click”, () => {
renderProfileEditForm(container);
});

const addrLink = container.querySelector(”#viewAddressLink”);
const miniMapEl = container.querySelector(”#viewMiniMap”);
if (addrLink && miniMapEl && profileData.lat && profileData.lng) {
addrLink.addEventListener(“click”, () => {
const isOpen = miniMapEl.style.display === “block”;
miniMapEl.style.display = isOpen ? “none” : “block”;
if (!isOpen) {
import(”./MapComponent.js”).then(({ showMiniMap }) => {
showMiniMap(“viewMiniMap”, profileData.lat, profileData.lng, profileData.address);
});
}
});
}
}

// ─── EDIT MODE ───────────────────────────────────────────────────

function buildProfileFormHTML(p) {
const catOptions = SERVICE_CATEGORIES.map(
(c) => `<option value="${esc(c)}" ${p.serviceCategory === c ? "selected" : ""}>${esc(c)}</option>`,
).join(””);

const workPhotoItems = (p.workPhotos || []).map(
(url, i) => ` <div class="work-photo-item" data-index="${i}"> <img src="${esc(url)}" alt="work"/> <button class="work-photo-del" data-del="${i}">✕</button> </div>`,
).join(””);

return `
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 16px">
<h2 style="font-family:var(--font-head);font-size:1.3rem;font-weight:800">Edit Profile</h2>
<button class="btn-ghost" id="cancelEditBtn">Cancel</button>
</div>

```
<!-- Avatar -->
<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
  <div class="profile-avatar-wrap">
    <img id="avatarPreview" class="profile-avatar"
         src="${esc(p.photoURL || 'https://via.placeholder.com/90?text=👤')}" alt="avatar"/>
    <button class="avatar-upload-btn" id="triggerAvatarUpload">＋</button>
  </div>
  <div>
    <p style="font-size:0.85rem;color:var(--text2)">Profile photo</p>
    <p class="upload-hint">Tap ＋ to upload</p>
  </div>
</div>
<input type="file" id="avatarFileInput" accept="image/*"/>

<div class="profile-form">
  <div class="field-group">
    <label>Full Name</label>
    <input type="text" id="fName" value="${esc(p.name || '')}" placeholder="Your name"/>
  </div>

  <div class="field-group">
    <label>Bio</label>
    <textarea id="fBio" placeholder="Tell clients about yourself…">${esc(p.bio || '')}</textarea>
  </div>

  <div class="field-group">
    <label>Service Category</label>
    <select id="fCategory">
      <option value="">— Select a category —</option>
      ${catOptions}
    </select>
  </div>

  <div class="field-group">
    <label>Your Service Name</label>
    <input type="text" id="fServiceName" value="${esc(p.serviceName || '')}"
           placeholder="e.g. Barber, Home Electrician, French Tutor"/>
  </div>

  <div class="field-group">
    <label>Address</label>
    <div class="address-row">
      <input type="text" id="fAddress" value="${esc(p.address || '')}"
             placeholder="Type your address and press Search"/>
      <button class="btn-secondary" id="geocodeBtn">Search</button>
    </div>
    <p class="upload-hint">Or tap the map below to pin your location</p>
    <div class="map-picker-wrap">
      <div id="profileMap"></div>
    </div>
  </div>

  <!-- Work Photos -->
  <div class="field-group">
    <label>Work Photos</label>
    <div class="work-photos-grid" id="workPhotosGrid">
      ${workPhotoItems}
      <div class="work-photo-item" id="addWorkPhotoBtn">
        <span class="work-photo-add">＋</span>
      </div>
    </div>
    <p class="upload-hint">Show off your best work (up to 9 photos)</p>
  </div>
  <input type="file" id="workPhotoInput" accept="image/*" multiple/>

  <p id="profileSaveError" style="color:var(--red);font-size:0.83rem;min-height:18px"></p>
  <button class="btn-primary" id="saveProfileBtn">Save Profile</button>
</div>
```

`;
}

async function attachProfileFormEvents(container) {
// Cancel
container.querySelector(”#cancelEditBtn”)?.addEventListener(“click”, () => {
renderProfilePage(currentUid, container);
});

// Avatar upload trigger
container.querySelector(”#triggerAvatarUpload”)?.addEventListener(“click”, () => {
container.querySelector(”#avatarFileInput”)?.click();
});

container.querySelector(”#avatarFileInput”)?.addEventListener(“change”, (e) => {
const file = e.target.files[0];
if (!file) return;
const preview = createLocalPreview(file);
container.querySelector(”#avatarPreview”).src = preview;
profileData._pendingAvatarFile = file;
});

// Work photo add
container.querySelector(”#addWorkPhotoBtn”)?.addEventListener(“click”, () => {
container.querySelector(”#workPhotoInput”)?.click();
});

container.querySelector(”#workPhotoInput”)?.addEventListener(“change”, (e) => {
Array.from(e.target.files).forEach((file) => {
const preview = createLocalPreview(file);
pendingPhotos.push({ file, preview });
});
refreshWorkPhotoGrid(container);
e.target.value = “”;
});

// Delete existing work photo
container.addEventListener(“click”, (e) => {
const delBtn = e.target.closest(”[data-del]”);
if (!delBtn) return;
const idx = parseInt(delBtn.dataset.del, 10);
if (!isNaN(idx) && profileData.workPhotos) {
profileData.workPhotos.splice(idx, 1);
refreshWorkPhotoGrid(container);
}
});

// Geocode address
container.querySelector(”#geocodeBtn”)?.addEventListener(“click”, async () => {
const addr = container.querySelector(”#fAddress”).value;
if (!addr.trim()) return;
const result = await geocodeAddress(addr);
if (result) {
profileData._pickedLat = result.lat;
profileData._pickedLng = result.lng;
container.querySelector(”#fAddress”).value = result.display;
flyProfileMapTo(result.lat, result.lng);
} else {
showError(container, “Address not found. Try a more specific address.”);
}
});

// Profile map picker
await initProfileMap(“profileMap”, ({ lat, lng, address }) => {
profileData._pickedLat = lat;
profileData._pickedLng = lng;
container.querySelector(”#fAddress”).value = address;
});

// If we already have coordinates, fly to them
if (profileData.lat && profileData.lng) {
flyProfileMapTo(profileData.lat, profileData.lng);
}

// Save
container.querySelector(”#saveProfileBtn”)?.addEventListener(“click”, async () => {
await handleSaveProfile(container);
});
}

function refreshWorkPhotoGrid(container) {
const grid = container.querySelector(”#workPhotosGrid”);
if (!grid) return;

const existing = (profileData.workPhotos || []).map(
(url, i) => ` <div class="work-photo-item" data-index="${i}"> <img src="${esc(url)}" alt="work"/> <button class="work-photo-del" data-del="${i}">✕</button> </div>`,
).join(””);

const pending = pendingPhotos.map(
(p, i) => ` <div class="work-photo-item" data-pending="${i}"> <img src="${esc(p.preview)}" alt="pending"/> <button class="work-photo-del" data-delpending="${i}">✕</button> </div>`,
).join(””);

const addBtn = `<div class="work-photo-item" id="addWorkPhotoBtn"><span class="work-photo-add">＋</span></div>`;

grid.innerHTML = existing + pending + addBtn;

// Re-attach the add button event
grid.querySelector(”#addWorkPhotoBtn”)?.addEventListener(“click”, () => {
container.querySelector(”#workPhotoInput”)?.click();
});

// Handle pending photo deletion
grid.querySelectorAll(”[data-delpending]”).forEach((btn) => {
btn.addEventListener(“click”, (e) => {
e.stopPropagation();
const idx = parseInt(btn.dataset.delpending, 10);
pendingPhotos.splice(idx, 1);
refreshWorkPhotoGrid(container);
});
});
}

async function handleSaveProfile(container) {
const btn = container.querySelector(”#saveProfileBtn”);
btn.textContent = “Saving…”;
btn.disabled = true;
showError(container, “”);

try {
const name         = container.querySelector(”#fName”).value.trim();
const bio          = container.querySelector(”#fBio”).value.trim();
const serviceCategory = container.querySelector(”#fCategory”).value;
const serviceName  = container.querySelector(”#fServiceName”).value.trim();
const addressInput = container.querySelector(”#fAddress”).value.trim();

```
if (!name) { showError(container, "Please enter your name."); return; }

let photoURL   = profileData.photoURL || "";
let lat        = profileData._pickedLat ?? profileData.lat ?? null;
let lng        = profileData._pickedLng ?? profileData.lng ?? null;
let address    = addressInput || profileData.address || "";

// Upload new avatar if selected
if (profileData._pendingAvatarFile) {
  btn.textContent = "Uploading photo…";
  photoURL = await uploadProfilePhoto(profileData._pendingAvatarFile, currentUid);
}

// Upload pending work photos
let workPhotos = [...(profileData.workPhotos || [])];
if (pendingPhotos.length > 0) {
  btn.textContent = `Uploading work photos…`;
  for (const { file } of pendingPhotos) {
    const url = await uploadWorkPhoto(file, currentUid);
    workPhotos.push(url);
  }
}

// If address changed and no map pick, geocode
if (address && address !== profileData.address && lat === null) {
  const geo = await geocodeAddress(address);
  if (geo) {
    lat     = geo.lat;
    lng     = geo.lng;
    address = geo.display;
  }
}

// If lat/lng but address empty, reverse geocode
if (lat && lng && !address) {
  address = await reverseGeocode(lat, lng);
}

const updated = {
  name, bio, photoURL, serviceCategory, serviceName,
  address, lat, lng, workPhotos,
};

btn.textContent = "Saving to database…";
await saveUserProfile(currentUid, updated);

// Clean up pending state
profileData = { ...profileData, ...updated };
delete profileData._pendingAvatarFile;
delete profileData._pickedLat;
delete profileData._pickedLng;
pendingPhotos = [];

// Switch back to view mode
const profileViewContainer = container.closest("#profileView") || container;
await renderProfilePage(currentUid, profileViewContainer);
```

} catch (err) {
console.error(“Save profile error:”, err);
showError(container, err.message || “Failed to save profile. Check Cloudinary/Firebase config.”);
} finally {
btn.textContent = “Save Profile”;
btn.disabled = false;
}
}

// ─── UTILITY ─────────────────────────────────────────────────────

function showError(container, msg) {
const el = container.querySelector(”#profileSaveError”);
if (el) el.textContent = msg;
}

function esc(str) {
return String(str ?? “”)
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/”/g, “"”);
}

export {
renderProfilePage,
renderProfileEditForm,
SERVICE_CATEGORIES,
};
