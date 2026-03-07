// App.js — GigsCourt
// ═══════════════════════════════════════════════════════════
//  Loaded by index.html as: <script type="text/babel" src="./App.js">
//  Babel Standalone transforms JSX in the browser — no bundler needed.
//
//  WHY SELF-CONTAINED:
//    Babel Standalone cannot resolve ES module import/export across
//    separate files when loaded via <script> tags. All components
//    live in this one file. When you upgrade to Vite, split them back.
//
//  IMPORT MAP (for when you upgrade to Vite later):
//    ./components/Header.js       → Header component
//    ./components/ProviderCard.js → ProviderCard component
//    ./components/ProfileGrid.js  → ProfileGrid component
//    ./ProfilePage.js             → ProfilePage component
//    ./MapComponent.js            → MapComponent component
//    ./CloudinaryUpload.js        → CloudinaryUpload component
//
//  ICONS: Standard emoji only — zero external library risk.
// ═══════════════════════════════════════════════════════════

const { useState, useCallback, useEffect, useRef } = React;

// ───────────────────────────────────────────────────────────
// SECTION 1 — DATA
// ───────────────────────────────────────────────────────────

const DUMMY_PROVIDERS = [
{
id: 1, businessName: “Elite Cuts”,     locationName: “Sabo Auchi”,
distanceKm: 1.2, rating: 4.9, reviewCount: 214, category: “Barber”,
imageUrl: “https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80”,
isVerified: true, isAvailable: true,
},
{
id: 2, businessName: “Glam Studio NG”, locationName: “Iyamho”,
distanceKm: 3.7, rating: 4.7, reviewCount: 98,  category: “Stylist”,
imageUrl: “https://images.unsplash.com/photo-1560066984-138daaa0ce8f?w=400&q=80”,
isVerified: true, isAvailable: true,
},
{
id: 3, businessName: “Stitch & Silk”,  locationName: “Fugar”,
distanceKm: 6.1, rating: 4.5, reviewCount: 61,  category: “Tailor”,
imageUrl: “https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80”,
isVerified: false, isAvailable: true,
},
{
id: 4, businessName: “Fade King”,      locationName: “Auchi Town”,
distanceKm: 8.4, rating: 4.6, reviewCount: 177, category: “Barber”,
imageUrl: “https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=400&q=80”,
isVerified: true, isAvailable: false,
},
{
id: 5, businessName: “Gloss & Glow”,   locationName: “Jattu”,
distanceKm: 12.0, rating: 4.8, reviewCount: 43, category: “Makeup”,
imageUrl: “https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80”,
isVerified: false, isAvailable: true,
},
{
id: 6, businessName: “Royal Tailors”,  locationName: “Uzairue”,
distanceKm: 15.5, rating: 4.4, reviewCount: 29, category: “Tailor”,
imageUrl: “https://images.unsplash.com/photo-1594938298603-c8148c4b4691?w=400&q=80”,
isVerified: true, isAvailable: true,
},
];

const DUMMY_PROFILE = {
businessName: “Elite Cuts”, locationName: “Sabo Auchi”,
avatarUrl: “https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&q=80”,
category: “Barber”, rating: 4.9, reviewCount: 214,
bio: “Sharp fades. Clean lines. Premium cuts for the modern gentleman.”,
jobsCompleted: 847, followers: 1203, isVerified: true,
};

const DUMMY_IMAGES = [
{ id: 1, url: “https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80”, isFeatured: true },
{ id: 2, url: “https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=300&q=80” },
{ id: 3, url: “https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&q=80” },
{ id: 4, url: “https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=300&q=80” },
{ id: 5, url: “https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&q=80” },
{ id: 6, url: “https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&q=80” },
];

// ───────────────────────────────────────────────────────────
// SECTION 2 — CloudinaryUpload (placeholder, root folder)
// File: ./CloudinaryUpload.js  |  Inlined here for Babel compat
// ───────────────────────────────────────────────────────────

function CloudinaryUpload({ onUploadSuccess, label = “Upload Photo” }) {
const inputRef = useRef(null);
const [status,  setStatus]  = useState(“idle”);
const [preview, setPreview] = useState(null);

const handleFile = async (e) => {
const file = e.target.files?.[0];
if (!file) return;
setPreview(URL.createObjectURL(file));
setStatus(“uploading”);
// ── Cloudinary connection point ──────────────────────
// Replace the setTimeout below with:
//   const fd = new FormData();
//   fd.append(“file”, file);
//   fd.append(“upload_preset”, “YOUR_PRESET”);
//   const r = await fetch(“https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload”, { method:“POST”, body:fd });
//   const d = await r.json();
//   onUploadSuccess?.({ url: d.secure_url, publicId: d.public_id });
await new Promise(r => setTimeout(r, 1200));
onUploadSuccess?.({ url: URL.createObjectURL(file), publicId: `gc_${Date.now()}` });
setStatus(“done”);
e.target.value = “”;
};

return (
<div style={S.cloudWrapper}>
<div style={S.cloudBadge}>☁️ Upload Tool — Coming Soon</div>
<div
style={{ …S.cloudZone, borderColor: status === “uploading” ? “#FF385C” : “rgba(255,56,92,0.3)” }}
onClick={() => inputRef.current?.click()}
>
<input ref={inputRef} type=“file” accept=“image/*” style={{ display:“none” }} onChange={handleFile} />
{preview
? <img src={preview} alt="preview" style={S.cloudPreview} />
: <div style={S.cloudEmpty}><div style={{ fontSize:36 }}>📷</div><p style={S.cloudHint}>Tap to choose a photo</p></div>
}
{status === “uploading” && <div style={S.cloudOverlay}><div style={S.spinner} /></div>}
</div>
<p style={{ …S.cloudStatus, color: status === “done” ? “#22C55E” : status === “uploading” ? “#FF385C” : “#9999AA” }}>
{status === “done” ? “✅ Upload complete!” : status === “uploading” ? “⏳ Uploading…” : “Cloudinary ready to connect.”}
</p>
<button style={S.redBtn} onClick={() => inputRef.current?.click()} disabled={status === “uploading”}>
📤 {label}
</button>
</div>
);
}

// ───────────────────────────────────────────────────────────
// SECTION 3 — MapComponent (placeholder, root folder)
// File: ./MapComponent.js  |  Inlined here for Babel compat
// ───────────────────────────────────────────────────────────

function MapComponent({ radiusKm = 5, userCoords = null, providers = [] }) {
const [activeId, setActiveId] = useState(1);

const pins = [
{ id:1, name:“Elite Cuts”,     top:“38%”, left:“48%” },
{ id:2, name:“Glam Studio NG”, top:“55%”, left:“62%” },
{ id:3, name:“Stitch & Silk”,  top:“30%”, left:“30%” },
{ id:4, name:“Fade King”,      top:“65%”, left:“42%” },
{ id:5, name:“Gloss & Glow”,   top:“44%”, left:“70%” },
];

return (
<div style={S.mapWrapper}>
<div style={S.mapBanner}>📍 Map View — Coming Soon</div>
<div style={S.mapArea}>
{/* Grid lines */}
<div style={S.mapGrid} />
{/* Radius circle */}
<div style={S.mapCircle}><span style={S.mapRadiusLabel}>{radiusKm}km</span></div>
{/* User dot */}
<div style={S.mapUserDot} />
{/* Provider pins */}
{pins.map(p => (
<button
key={p.id}
onClick={() => setActiveId(p.id)}
style={{
…S.mapPin,
top: p.top, left: p.left,
background: activeId === p.id ? “#FF385C” : “#fff”,
color:      activeId === p.id ? “#fff”    : “#FF385C”,
transform:  `translate(-50%,-100%) scale(${activeId === p.id ? 1.2 : 1})`,
zIndex:     activeId === p.id ? 10 : 5,
}}
title={p.name}
>
📍
</button>
))}
{/* Compass */}
<div style={S.mapCompass}>🧭<br /><span style={{ fontSize:10, color:”#9999AA” }}>Map Loading…</span></div>
</div>
<div style={S.mapFooter}>
<span style={S.mapStat}><strong>{pins.length}</strong> providers</span>
<span style={S.mapStat}><strong>{radiusKm}km</strong> radius</span>
<span style={S.mapStat}><strong style={{ color: userCoords ? “#22C55E” : “#9999AA” }}>{userCoords ? “GPS On” : “GPS Off”}</strong></span>
</div>
<p style={{ fontSize:11, color:”#9999AA”, textAlign:“center”, padding:“8px 16px”, margin:0 }}>
🗺 Google Maps / Leaflet connects here. GPS coords already stored.
</p>
</div>
);
}

// ───────────────────────────────────────────────────────────
// SECTION 4 — Header (from ./components/Header.js)
// ───────────────────────────────────────────────────────────

function Header({ searchQuery, onSearchChange, radiusKm, onRadiusChange, locationLabel, onRequestGPS, isLocating }) {
const [sliderVal, setSliderVal] = useState(5);

const sliderToKm = (v) => v <= 10 ? v : Math.round(10 + Math.pow((v-10)/10, 1.6) * 90);
const fillPct    = ((sliderVal - 1) / 19) * 100;
const displayKm  = sliderToKm(sliderVal);

const handleSlider = (e) => {
const v = Number(e.target.value);
setSliderVal(v);
onRadiusChange?.(sliderToKm(v));
};

return (
<header style={S.header}>
{/* Row 1: Logo + Location */}
<div style={S.headerTop}>
<h1 style={S.logo}>Gigs<span style={{ color:”#FF385C” }}>Court</span></h1>
<button onClick={onRequestGPS} style={S.locationPill} title="Get my location">
{locationLabel
? <><span style={S.gpsDot} /><span style={{ fontSize:12, color:”#FF385C”, maxWidth:130, overflow:“hidden”, textOverflow:“ellipsis”, whiteSpace:“nowrap” }}>{locationLabel}</span></>
: <span style={{ fontSize:12, color:”#9999AA” }}>📍 Set location</span>
}
</button>
</div>

```
  {/* Row 2: Search */}
  <div style={S.searchRow}>
    <span style={S.searchIcon}>🔍</span>
    <input
      type="search"
      style={S.searchInput}
      placeholder="Find barbers, stylists, tailors…"
      value={searchQuery}
      onChange={e => onSearchChange?.(e.target.value)}
    />
    <button
      onClick={onRequestGPS}
      style={{ ...S.gpsBtn, opacity: isLocating ? 0.6 : 1 }}
      title={isLocating ? "Locating…" : "Use my location"}
    >
      {isLocating ? "⏳" : "🎯"}
    </button>
  </div>

  {/* Row 3: Radius slider */}
  <div style={S.radiusSection}>
    <div style={S.radiusLabelRow}>
      <span style={S.radiusLabel}>🎯 Search Radius</span>
      <span style={S.radiusBadge}>{displayKm >= 100 ? "100+ km" : `${displayKm} km`}</span>
    </div>
    <input
      type="range" min={1} max={20} step={1}
      value={sliderVal}
      onChange={handleSlider}
      style={{ ...S.slider, background: `linear-gradient(to right, #FF385C ${fillPct}%, #E8E8EE ${fillPct}%)` }}
    />
    <div style={S.sliderMarkers}>
      <span>1 km</span><span>25 km</span><span>100+ km</span>
    </div>
  </div>
</header>
```

);
}

// ───────────────────────────────────────────────────────────
// SECTION 5 — ProviderCard (from ./components/ProviderCard.js)
// ───────────────────────────────────────────────────────────

function ProviderCard({ provider, onViewPortfolio }) {
const [imgLoaded, setImgLoaded] = useState(false);
const [pressed,   setPressed]   = useState(false);

const { businessName=”?”, locationName=”?”, distanceKm=null,
rating=0, reviewCount=0, imageUrl=””, isVerified=false,
isAvailable=true, category=”” } = provider || {};

const fmtDist = (km) => {
if (km == null) return null;
if (km < 1)  return `${Math.round(km*1000)}m away`;
if (km < 10) return `${km.toFixed(1)}km away`;
return `${Math.round(km)}km away`;
};

const stars = Array.from({ length: 5 }, (_, i) =>
<span key={i} style={{ color: i < Math.floor(rating) ? “#FF385C” : “#DDD”, fontSize:11 }}>★</span>
);

return (
<div
style={{
…S.card,
transform: pressed ? “scale(0.97)” : “scale(1)”,
boxShadow: pressed ? “0 2px 6px rgba(0,0,0,0.06)” : “0 4px 16px rgba(0,0,0,0.08)”,
}}
onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
>
{/* Header */}
<div style={S.cardHeader}>
<div style={{ display:“flex”, alignItems:“center”, gap:4, flex:1, overflow:“hidden” }}>
<span style={{ fontSize:10, color:”#9999AA” }}>📍</span>
<span style={S.cardLocation}>{locationName}{isVerified ? “ ✅” : “”}</span>
</div>
{distanceKm != null && <span style={S.distBadge}>{fmtDist(distanceKm)}</span>}
</div>

```
  {/* Image */}
  <div style={S.imgBox}>
    {!imgLoaded && <div style={S.imgSkeleton} className="skeleton" />}
    <img
      src={imageUrl}
      alt={businessName}
      style={{ ...S.cardImg, opacity: imgLoaded ? 1 : 0 }}
      onLoad={() => setImgLoaded(true)}
      loading="lazy"
    />
    {/* Availability dot */}
    <div style={{ ...S.availDot, backgroundColor: isAvailable ? "#22C55E" : "#94A3B8" }} />
  </div>

  {/* Footer */}
  <div style={S.cardFooter}>
    <p style={S.bizName}>{businessName}</p>
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <div style={{ display:"flex" }}>{stars}</div>
      <span style={{ fontSize:11, fontWeight:600, color:"#0D0D12" }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize:10, color:"#9999AA" }}>({reviewCount})</span>
    </div>
    <button
      style={S.redBtn}
      onClick={() => onViewPortfolio?.(provider)}
    >
      View Portfolio →
    </button>
  </div>
</div>
```

);
}

// ───────────────────────────────────────────────────────────
// SECTION 6 — ProfileGrid (from ./components/ProfileGrid.js)
// ───────────────────────────────────────────────────────────

function ProfileGrid({ provider, images = [], onUpload, onImagePress }) {
const inputRef = useRef(null);
const [isUploading, setIsUploading] = useState(false);
const {
businessName=”?”, locationName=”?”, avatarUrl=””, category=“Provider”,
rating=0, reviewCount=0, bio=””, jobsCompleted=0, followers=0, isVerified=false,
} = provider || {};

const handleUpload = async (e) => {
const file = e.target.files?.[0];
if (!file) return;
setIsUploading(true);
const localUrl = URL.createObjectURL(file);
await new Promise(r => setTimeout(r, 800));
onUpload?.({ url: localUrl, id: Date.now(), caption: file.name });
setIsUploading(false);
e.target.value = “”;
};

const initials = businessName.split(” “).slice(0,2).map(w => w[0]?.toUpperCase() || “”).join(””);

return (
<div style={{ background:“var(–off-white,#F8F8FA)”, minHeight:“100dvh” }}>
{/* Profile Header */}
<div style={S.profileHeader}>
<div style={S.avatarRing}>
<div style={S.avatarInner}>
{avatarUrl
? <img src={avatarUrl} alt={businessName} style={{ width:“100%”, height:“100%”, objectFit:“cover”, borderRadius:“50%” }} />
: <div style={S.avatarFallback}>{initials}</div>
}
</div>
</div>
<h2 style={S.profileName}>{businessName}{isVerified ? “ ✅” : “”}</h2>
<span style={S.catChip}>{category}</span>
<div style={S.profileMeta}>
<span>📍 {locationName}</span>
<span style={{ color:”#E8E8EE” }}>|</span>
<span>⭐ {rating.toFixed(1)} ({reviewCount})</span>
</div>
{bio && <p style={S.profileBio}>{bio}</p>}
<div style={S.statsBar}>
<div style={S.statItem}><strong style={S.statNum}>{jobsCompleted}</strong><span style={S.statLbl}>Jobs</span></div>
<div style={S.statDiv} />
<div style={S.statItem}><strong style={S.statNum}>{followers}</strong><span style={S.statLbl}>Followers</span></div>
<div style={S.statDiv} />
<div style={S.statItem}><strong style={S.statNum}>{rating.toFixed(1)}★</strong><span style={S.statLbl}>Rating</span></div>
</div>
</div>

```
  {/* Grid section header */}
  <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px 8px" }}>
    <span style={{ fontFamily:"var(--font-display,'Clash Display',sans-serif)", fontWeight:700, fontSize:15 }}>🖼 Work Portfolio</span>
    <span style={{ fontSize:12, color:"#9999AA" }}>{images.length} photos</span>
  </div>

  {/* 3-column grid */}
  <div style={S.photoGrid}>
    {/* Upload slot */}
    <button style={S.uploadSlot} onClick={() => inputRef.current?.click()} disabled={isUploading}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleUpload} />
      {isUploading
        ? <div style={S.spinner} />
        : <><div style={S.plusCircle}>➕</div><span style={{ fontSize:11, color:"#FF385C", fontWeight:600 }}>Add Work</span></>
      }
    </button>

    {/* Photo cells */}
    {images.map((img, i) => (
      <button key={img.id || i} style={S.gridCell} onClick={() => onImagePress?.(img, i)}>
        <img src={img.url} alt={img.caption || `Work ${i+1}`} style={S.gridImg} loading="lazy" />
        {img.isFeatured && <span style={S.featuredTag}>Featured</span>}
      </button>
    ))}
  </div>

  {images.length === 0 && (
    <div style={{ textAlign:"center", padding:"32px 24px", color:"#9999AA" }}>
      <div style={{ fontSize:40 }}>📸</div>
      <p style={{ fontWeight:700, color:"#0D0D12", margin:"8px 0 4px" }}>No photos yet</p>
      <p style={{ fontSize:13, margin:0 }}>Tap <strong style={{ color:"#FF385C" }}>+</strong> to upload your first work photo</p>
    </div>
  )}
</div>
```

);
}

// ───────────────────────────────────────────────────────────
// SECTION 7 — ProfilePage (from ./ProfilePage.js — root folder)
// ───────────────────────────────────────────────────────────

function ProfilePage({ provider, images, onBack, onUpload, onImagePress }) {
const [imgs, setImgs] = useState(images || DUMMY_IMAGES);

const handleUpload = (newImg) => {
setImgs(prev => [newImg, …prev]);
onUpload?.(newImg);
};

return (
<div style={{ minHeight:“100dvh”, display:“flex”, flexDirection:“column”, background:“var(–off-white,#F8F8FA)” }}>
{/* Navbar */}
<nav style={S.profileNav}>
<button style={S.navBtn} onClick={onBack}>← Back</button>
<span style={S.navTitle}>{provider?.businessName || “Profile”}</span>
<button style={S.navBtn} onClick={() => alert(“Booking coming soon! 🎉”)}>Book</button>
</nav>

```
  {/* Content */}
  <div style={{ flex:1, paddingBottom:80 }}>
    <ProfileGrid
      provider={provider}
      images={imgs}
      onUpload={handleUpload}
      onImagePress={onImagePress}
    />
  </div>

  {/* Fixed book-now bar */}
  <div style={S.bookBar}>
    <div>
      <p style={{ margin:0, fontWeight:700, fontSize:14, fontFamily:"var(--font-display,'Clash Display',sans-serif)" }}>{provider?.businessName}</p>
      <p style={{ margin:0, fontSize:12, color:"#9999AA" }}>⭐ {provider?.rating?.toFixed(1)} · 📍 {provider?.locationName}</p>
    </div>
    <button style={{ ...S.redBtn, width:"auto", padding:"0 22px", flexShrink:0 }} onClick={() => alert("Booking coming soon! 🎉")}>
      Book Now
    </button>
  </div>
</div>
```

);
}

// ───────────────────────────────────────────────────────────
// SECTION 8 — Feed View (2-col ProviderCard grid)
// ───────────────────────────────────────────────────────────

function FeedView({ providers, searchQuery, onViewPortfolio }) {
const filtered = providers.filter(p => {
if (!searchQuery?.trim()) return true;
const q = searchQuery.toLowerCase();
return p.businessName.toLowerCase().includes(q)
|| p.locationName.toLowerCase().includes(q)
|| p.category.toLowerCase().includes(q);
});

return (
<main style={{ flex:1, padding:“12px 10px 32px”, display:“flex”, flexDirection:“column”, gap:10 }}>
<span style={{ fontSize:12, color:”#9999AA”, paddingLeft:4 }}>
{filtered.length} provider{filtered.length !== 1 ? “s” : “”} nearby
</span>
{filtered.length > 0 ? (
<div style={{ display:“grid”, gridTemplateColumns:“repeat(2,1fr)”, gap:10 }}>
{filtered.map((p, i) => (
<div key={p.id} className=“animate-fadeInUp” style={{ animationDelay:`${i*0.06}s` }}>
<ProviderCard provider={p} onViewPortfolio={onViewPortfolio} />
</div>
))}
</div>
) : (
<div style={{ flex:1, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, padding:“60px 24px”, gap:10, textAlign:“center” }}>
<span style={{ fontSize:44 }}>🔍</span>
<p style={{ fontFamily:“var(–font-display,‘Clash Display’,sans-serif)”, fontSize:20, fontWeight:700, margin:0 }}>No results found</p>
<p style={{ fontSize:14, color:”#9999AA”, margin:0 }}>Try a different name or widen your radius.</p>
</div>
)}
</main>
);
}

// ───────────────────────────────────────────────────────────
// SECTION 9 — DEV Toggle Banner
// ───────────────────────────────────────────────────────────

function DevToggle({ view, onToggle }) {
return (
<div style={{ display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“7px 14px”, background:”#0D0D12”, gap:8, flexShrink:0 }}>
<span style={{ fontSize:9, fontWeight:700, letterSpacing:“1.5px”, color:“rgba(255,255,255,0.3)”, border:“1px solid rgba(255,255,255,0.1)”, padding:“2px 5px”, borderRadius:3 }}>DEV</span>
<span style={{ fontSize:12, color:“rgba(255,255,255,0.5)”, flex:1, textAlign:“center” }}>
View: <strong style={{ color:”#FF385C” }}>{view}</strong>
</span>
<button
onClick={onToggle}
style={{ fontSize:12, fontWeight:600, color:“rgba(255,255,255,0.85)”, background:“rgba(255,56,92,0.18)”, border:“1px solid rgba(255,56,92,0.35)”, borderRadius:20, padding:“5px 13px”, cursor:“pointer”, whiteSpace:“nowrap” }}
>
Switch to {view === “feed” ? “Profile →” : “← Feed”}
</button>
</div>
);
}

// ───────────────────────────────────────────────────────────
// SECTION 10 — APP ROOT
// ───────────────────────────────────────────────────────────

function App() {

// ── ✅ LOADING STATE — clears after exactly 2 seconds ──
const [loading, setLoading] = useState(true);

useEffect(() => {
const t = setTimeout(() => {
setLoading(false);
// Also kill the HTML splash loader
const el = document.getElementById(“app-loader”);
if (el) {
el.classList.add(“hidden”);
setTimeout(() => el.parentNode?.removeChild(el), 450);
}
}, 2000); // ← 2 second hard clear
return () => clearTimeout(t);
}, []);

// ── View State ─────────────────────────────────────────
// ‘feed’ | ‘profile’ | ‘map’ | ‘upload’
const [view, setView] = useState(“feed”);

// ── Search & Radius ────────────────────────────────────
const [searchQuery, setSearchQuery] = useState(””);
const [radiusKm,    setRadiusKm]    = useState(5);

// ── GPS ────────────────────────────────────────────────
const [locationLabel, setLocationLabel] = useState(””);
const [userCoords,    setUserCoords]    = useState(null);
const [isLocating,    setIsLocating]    = useState(false);

// ── Portfolio images ───────────────────────────────────
const [portfolioImages, setPortfolioImages] = useState(DUMMY_IMAGES);

// ── GPS Handler ────────────────────────────────────────
const handleGPS = useCallback(() => {
if (!navigator.geolocation) { alert(“GPS not supported on this device.”); return; }
setIsLocating(true);
navigator.geolocation.getCurrentPosition(
async ({ coords: { latitude: lat, longitude: lng } }) => {
setUserCoords({ lat, lng });
try {
const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
const d = await r.json();
setLocationLabel(d.address?.suburb || d.address?.town || d.address?.village || d.address?.city || “My Location”);
} catch {
setLocationLabel(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
}
setIsLocating(false);
},
(err) => { console.error(“GPS:”, err.message); setIsLocating(false); alert(“Could not get location. Check permissions.”); },
{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
);
}, []);

// ── Loading Screen ─────────────────────────────────────
if (loading) {
return (
<div style={{ position:“fixed”, inset:0, background:”#fff”, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, gap:16, zIndex:9999 }}>
<p style={{ fontFamily:”‘Clash Display’,sans-serif”, fontSize:30, fontWeight:700, color:”#0D0D12”, margin:0, letterSpacing:”-0.5px” }}>
Gigs<span style={{ color:”#FF385C” }}>Court</span>
</p>
<div style={S.spinner} />
<p style={{ fontFamily:”‘DM Sans’,sans-serif”, fontSize:13, color:”#9999AA”, margin:0 }}>Finding gigs near you…</p>
</div>
);
}

// ── Main Render ────────────────────────────────────────
return (
<div style={{ minHeight:“100dvh”, display:“flex”, flexDirection:“column”, background:“var(–off-white,#F8F8FA)” }}>

```
  <DevToggle view={view} onToggle={() => setView(v => v === "feed" ? "profile" : "feed")} />

  {/* Header always visible except on full-page profile */}
  {view !== "profile" && (
    <Header
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      radiusKm={radiusKm}
      onRadiusChange={setRadiusKm}
      locationLabel={locationLabel}
      onRequestGPS={handleGPS}
      isLocating={isLocating}
    />
  )}

  {/* View Router */}
  {view === "feed" && (
    <FeedView
      providers={DUMMY_PROVIDERS}
      searchQuery={searchQuery}
      onViewPortfolio={() => setView("profile")}
    />
  )}

  {view === "profile" && (
    <ProfilePage
      provider={DUMMY_PROFILE}
      images={portfolioImages}
      onBack={() => setView("feed")}
      onUpload={(img) => setPortfolioImages(p => [img, ...p])}
      onImagePress={(img, i) => console.log("Tapped:", img.url, i)}
    />
  )}

  {view === "map" && (
    <div style={{ flex:1, padding:16 }}>
      <MapComponent radiusKm={radiusKm} userCoords={userCoords} providers={DUMMY_PROVIDERS} />
    </div>
  )}

  {view === "upload" && (
    <div style={{ flex:1, padding:16 }}>
      <CloudinaryUpload
        onUploadSuccess={(img) => { setPortfolioImages(p => [img, ...p]); setView("profile"); }}
      />
    </div>
  )}

</div>
```

);
}

// ───────────────────────────────────────────────────────────
// SECTION 11 — MOUNT INTO #root
// ───────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById(“root”));
root.render(<App />);

// ───────────────────────────────────────────────────────────
// SECTION 12 — SHARED STYLE TOKENS
// All inline styles. Avoids className lookup issues when
// Babel transpiles across non-bundled script tags.
// ───────────────────────────────────────────────────────────

const S = {
// Header
header: { position:“sticky”, top:0, zIndex:100, background:”#fff”, borderBottom:“1px solid #F0F0F5”, boxShadow:“0 1px 4px rgba(0,0,0,0.06)”, padding:“14px 16px 16px” },
headerTop: { display:“flex”, alignItems:“center”, justifyContent:“space-between”, marginBottom:14 },
logo: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:22, fontWeight:700, color:”#0D0D12”, letterSpacing:”-0.5px”, margin:0 },
locationPill: { display:“flex”, alignItems:“center”, gap:5, padding:“4px 10px”, background:“none”, border:“1px solid #E8E8EE”, borderRadius:999, cursor:“pointer”, maxWidth:160 },
gpsDot: { width:7, height:7, borderRadius:“50%”, background:”#FF385C”, flexShrink:0 },
searchRow: { position:“relative”, display:“flex”, alignItems:“center”, marginBottom:14 },
searchIcon: { position:“absolute”, left:14, fontSize:16, pointerEvents:“none” },
searchInput: { width:“100%”, height:46, padding:“0 44px 0 40px”, fontFamily:”‘DM Sans’,sans-serif”, fontSize:15, color:”#0D0D12”, background:”#F2F2F7”, border:“1.5px solid transparent”, borderRadius:999, outline:“none”, WebkitAppearance:“none” },
gpsBtn: { position:“absolute”, right:8, width:32, height:32, borderRadius:“50%”, background:”#FF385C”, border:“none”, cursor:“pointer”, fontSize:16, display:“flex”, alignItems:“center”, justifyContent:“center” },
radiusSection: { display:“flex”, flexDirection:“column”, gap:6 },
radiusLabelRow: { display:“flex”, justifyContent:“space-between”, alignItems:“center” },
radiusLabel: { fontSize:12, fontWeight:500, color:”#5A5A6E”, textTransform:“uppercase”, letterSpacing:“0.3px” },
radiusBadge: { padding:“3px 10px”, background:“rgba(255,56,92,0.08)”, border:“1px solid rgba(255,56,92,0.18)”, borderRadius:999, fontSize:13, fontWeight:700, color:”#FF385C”, fontFamily:”‘Clash Display’,sans-serif” },
slider: { WebkitAppearance:“none”, appearance:“none”, width:“100%”, height:4, borderRadius:999, outline:“none”, cursor:“pointer” },
sliderMarkers: { display:“flex”, justifyContent:“space-between”, fontSize:10, fontWeight:500, color:”#9999AA” },

// Cards
card: { background:”#fff”, borderRadius:20, overflow:“hidden”, display:“flex”, flexDirection:“column”, position:“relative”, transition:“transform 0.15s ease, box-shadow 0.15s ease”, cursor:“pointer”, WebkitUserSelect:“none”, userSelect:“none” },
cardHeader: { display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“10px 10px 8px”, gap:4 },
cardLocation: { fontSize:11, fontWeight:500, color:”#5A5A6E”, overflow:“hidden”, textOverflow:“ellipsis”, whiteSpace:“nowrap” },
distBadge: { flexShrink:0, padding:“3px 8px”, background:“rgba(255,56,92,0.08)”, border:“1px solid rgba(255,56,92,0.18)”, borderRadius:999, fontSize:10, fontWeight:700, color:”#FF385C”, whiteSpace:“nowrap” },
imgBox: { position:“relative”, width:“100%”, aspectRatio:“1/1”, overflow:“hidden”, background:”#F2F2F7” },
imgSkeleton: { position:“absolute”, inset:0 },
cardImg: { width:“100%”, height:“100%”, objectFit:“cover”, display:“block”, transition:“opacity 0.3s ease” },
availDot: { position:“absolute”, top:8, right:8, width:8, height:8, borderRadius:“50%”, border:“1.5px solid #fff”, boxShadow:“0 1px 4px rgba(0,0,0,0.2)” },
cardFooter: { padding:“10px 10px 12px”, display:“flex”, flexDirection:“column”, gap:6 },
bizName: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:13, fontWeight:700, color:”#0D0D12”, margin:0, overflow:“hidden”, textOverflow:“ellipsis”, whiteSpace:“nowrap”, letterSpacing:”-0.2px” },

// Shared red button
redBtn: { display:“flex”, alignItems:“center”, justifyContent:“center”, gap:6, width:“100%”, height:34, background:”#FF385C”, color:”#fff”, fontFamily:”‘DM Sans’,sans-serif”, fontSize:12, fontWeight:700, border:“none”, borderRadius:999, cursor:“pointer”, boxShadow:“0 3px 10px rgba(255,56,92,0.30)”, letterSpacing:“0.2px”, marginTop:2 },

// Spinner
spinner: { width:28, height:28, borderRadius:“50%”, border:“3px solid rgba(255,56,92,0.2)”, borderTopColor:”#FF385C”, animation:“gcSpin 0.75s linear infinite” },

// ProfileGrid
profileHeader: { display:“flex”, flexDirection:“column”, alignItems:“center”, background:”#fff”, padding:“28px 20px 24px”, borderBottom:“1px solid #F0F0F5”, gap:6 },
avatarRing: { width:92, height:92, borderRadius:“50%”, padding:3, background:“linear-gradient(135deg,#FF385C,#FF6B87)”, boxShadow:“0 4px 20px rgba(255,56,92,0.35)”, marginBottom:8 },
avatarInner: { width:“100%”, height:“100%”, borderRadius:“50%”, overflow:“hidden”, border:“2.5px solid #fff”, background:”#F2F2F7” },
avatarFallback: { width:“100%”, height:“100%”, display:“flex”, alignItems:“center”, justifyContent:“center”, fontFamily:”‘Clash Display’,sans-serif”, fontSize:28, fontWeight:700, color:”#fff”, background:“linear-gradient(135deg,#1a1a2e,#16213e)” },
profileName: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:22, fontWeight:700, color:”#0D0D12”, margin:0, letterSpacing:”-0.4px” },
catChip: { padding:“4px 14px”, background:“rgba(255,56,92,0.08)”, border:“1px solid rgba(255,56,92,0.2)”, borderRadius:999, fontSize:12, fontWeight:600, color:”#FF385C” },
profileMeta: { display:“flex”, alignItems:“center”, gap:10, fontSize:13, fontWeight:500, color:”#5A5A6E” },
profileBio: { fontFamily:”‘DM Sans’,sans-serif”, fontSize:13, lineHeight:1.55, color:”#5A5A6E”, textAlign:“center”, maxWidth:280, margin:“4px 0 0” },
statsBar: { display:“flex”, alignItems:“center”, width:“100%”, maxWidth:280, background:”#F2F2F7”, borderRadius:14, overflow:“hidden”, border:“1px solid #F0F0F5” },
statItem: { flex:1, display:“flex”, flexDirection:“column”, alignItems:“center”, padding:“10px 0”, gap:2 },
statNum: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:16, fontWeight:700, color:”#0D0D12”, lineHeight:1 },
statLbl: { fontSize:10, fontWeight:500, color:”#9999AA”, textTransform:“uppercase”, letterSpacing:“0.4px” },
statDiv: { width:1, height:32, background:”#E8E8EE” },
photoGrid: { display:“grid”, gridTemplateColumns:“repeat(3,1fr)”, gap:2, background:”#E8E8EE” },
uploadSlot: { aspectRatio:“1/1”, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, gap:5, background:”#F2F2F7”, border:“2px dashed rgba(255,56,92,0.35)”, cursor:“pointer”, padding:0, WebkitTapHighlightColor:“transparent” },
plusCircle: { width:38, height:38, borderRadius:“50%”, background:”#FF385C”, display:“flex”, alignItems:“center”, justifyContent:“center”, fontSize:18, boxShadow:“0 4px 12px rgba(255,56,92,0.35)” },
gridCell: { aspectRatio:“1/1”, position:“relative”, overflow:“hidden”, background:”#F2F2F7”, border:“none”, padding:0, cursor:“pointer”, display:“block” },
gridImg: { width:“100%”, height:“100%”, objectFit:“cover”, display:“block” },
featuredTag: { position:“absolute”, bottom:5, left:5, padding:“2px 7px”, background:”#FF385C”, borderRadius:999, fontSize:9, fontWeight:700, color:”#fff”, letterSpacing:“0.4px”, textTransform:“uppercase” },

// ProfilePage nav
profileNav: { position:“sticky”, top:0, zIndex:50, display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“10px 12px”, background:”#fff”, borderBottom:“1px solid #F0F0F5”, boxShadow:“0 1px 4px rgba(0,0,0,0.06)”, gap:8 },
navBtn: { padding:“6px 14px”, borderRadius:20, border:“none”, background:”#F2F2F7”, fontSize:13, fontWeight:600, color:”#5A5A6E”, cursor:“pointer” },
navTitle: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:16, fontWeight:700, color:”#0D0D12”, flex:1, textAlign:“center”, overflow:“hidden”, textOverflow:“ellipsis”, whiteSpace:“nowrap” },
bookBar: { position:“fixed”, bottom:0, left:0, right:0, zIndex:50, display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“12px 16px”, background:”#fff”, borderTop:“1px solid #F0F0F5”, boxShadow:“0 -4px 20px rgba(0,0,0,0.08)”, gap:12 },

// CloudinaryUpload
cloudWrapper: { display:“flex”, flexDirection:“column”, alignItems:“center”, gap:14, padding:“28px 20px”, background:”#fff”, borderRadius:20, boxShadow:“0 4px 16px rgba(0,0,0,0.07)”, maxWidth:360, margin:“0 auto”, width:“100%” },
cloudBadge: { padding:“4px 14px”, background:“rgba(255,56,92,0.08)”, border:“1px solid rgba(255,56,92,0.2)”, borderRadius:999, fontSize:12, fontWeight:600, color:”#FF385C” },
cloudZone: { width:“100%”, minHeight:160, border:“2px dashed”, borderRadius:14, background:”#F2F2F7”, display:“flex”, alignItems:“center”, justifyContent:“center”, cursor:“pointer”, overflow:“hidden”, position:“relative” },
cloudEmpty: { display:“flex”, flexDirection:“column”, alignItems:“center”, gap:8, padding:“24px 16px” },
cloudHint: { fontFamily:”‘DM Sans’,sans-serif”, fontSize:14, fontWeight:500, color:”#5A5A6E”, margin:0 },
cloudPreview: { width:“100%”, height:“100%”, objectFit:“cover” },
cloudOverlay: { position:“absolute”, inset:0, background:“rgba(0,0,0,0.45)”, display:“flex”, alignItems:“center”, justifyContent:“center” },
cloudStatus: { fontFamily:”‘DM Sans’,sans-serif”, fontSize:12, textAlign:“center”, margin:0 },

// MapComponent
mapWrapper: { display:“flex”, flexDirection:“column”, background:”#fff”, borderRadius:20, overflow:“hidden”, boxShadow:“0 4px 16px rgba(0,0,0,0.08)”, width:“100%”, maxWidth:480, margin:“0 auto” },
mapBanner: { padding:“10px 16px”, background:“rgba(255,56,92,0.06)”, borderBottom:“1px solid rgba(255,56,92,0.12)”, fontSize:13, fontWeight:600, color:”#FF385C” },
mapArea: { position:“relative”, width:“100%”, aspectRatio:“4/3”, background:”#E8EDF2”, overflow:“hidden” },
mapGrid: { position:“absolute”, inset:0, backgroundImage:“linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)”, backgroundSize:“40px 40px” },
mapCircle: { position:“absolute”, top:“50%”, left:“50%”, transform:“translate(-50%,-50%)”, width:“55%”, aspectRatio:“1”, borderRadius:“50%”, border:“2px dashed rgba(255,56,92,0.4)”, background:“rgba(255,56,92,0.05)”, display:“flex”, alignItems:“flex-start”, justifyContent:“flex-end”, padding:8, pointerEvents:“none” },
mapRadiusLabel: { fontFamily:”‘Clash Display’,sans-serif”, fontSize:10, fontWeight:700, color:”#FF385C” },
mapUserDot: { position:“absolute”, top:“50%”, left:“50%”, transform:“translate(-50%,-50%)”, width:14, height:14, borderRadius:“50%”, background:”#3B82F6”, border:“3px solid #fff”, boxShadow:“0 2px 8px rgba(59,130,246,0.5)”, zIndex:8 },
mapPin: { position:“absolute”, width:30, height:30, borderRadius:“50%”, border:“2px solid #FF385C”, display:“flex”, alignItems:“center”, justifyContent:“center”, cursor:“pointer”, transition:“all 0.2s ease”, padding:0, fontSize:14, WebkitTapHighlightColor:“transparent” },
mapCompass: { position:“absolute”, bottom:12, right:12, textAlign:“center”, opacity:0.7, fontSize:22 },
mapFooter: { display:“flex”, justifyContent:“space-around”, padding:“12px 16px”, borderTop:“1px solid #F0F0F5”, background:”#FAFAFA” },
mapStat: { fontFamily:”‘DM Sans’,sans-serif”, fontSize:13, color:”#5A5A6E” },
};
