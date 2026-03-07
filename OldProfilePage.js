// ProfilePage.js
// ─────────────────────────────────────────────────────────
//  GigsCourt — Provider Profile Page
//  Location: root directory (same level as App.js)
//
//  This is the full-screen page wrapper for a provider’s
//  profile. It imports ProfileGrid from ./components/ and
//  adds a navigation header with a Back button.
//
//  Props:
//    provider     {object}   — provider data object
//    images       {array}    — portfolio image array
//    onUpload     {function} — upload handler (→ Cloudinary)
//    onBack       {function} — navigates back to feed
//    onImagePress {function} — opens lightbox on image tap
// ─────────────────────────────────────────────────────────

import { useState } from “react”;
import ProfileGrid from “./components/ProfileGrid”;

// ── Icons ─────────────────────────────────────────────────
const BackArrow = () => (
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<line x1="19" y1="12" x2="5" y2="12" />
<polyline points="12 19 5 12 12 5" />
</svg>
);

const ShareIcon = () => (
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<circle cx="18" cy="5"  r="3" />
<circle cx="6"  cy="12" r="3" />
<circle cx="18" cy="19" r="3" />
<line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
<line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
</svg>
);

const BookmarkIcon = () => (
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
</svg>
);

// ── Dummy data — used when no props are passed ─────────────
const DEFAULT_PROVIDER = {
businessName:  “Elite Cuts”,
locationName:  “Sabo Auchi”,
avatarUrl:     “https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&q=80”,
category:      “Barber”,
rating:        4.9,
reviewCount:   214,
bio:           “Sharp fades. Clean lines. Premium cuts for the modern gentleman. Walk-ins welcome.”,
jobsCompleted: 847,
followers:     1203,
isVerified:    true,
};

const DEFAULT_IMAGES = [
{ id: 1, url: “https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80”, isFeatured: true },
{ id: 2, url: “https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=300&q=80” },
{ id: 3, url: “https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&q=80” },
{ id: 4, url: “https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=300&q=80” },
{ id: 5, url: “https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&q=80” },
{ id: 6, url: “https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&q=80” },
];

// ── Main Component ────────────────────────────────────────
export default function ProfilePage({
provider     = DEFAULT_PROVIDER,
images: initialImages = DEFAULT_IMAGES,
onBack,
onImagePress,
}) {
const [images,    setImages]    = useState(initialImages);
const [bookmarked, setBookmarked] = useState(false);
const [shared,     setShared]    = useState(false);

// ── Upload handler — adds new image to top of grid ─────
const handleUpload = (newImage) => {
setImages((prev) => [newImage, …prev]);
};

// ── Share (placeholder — connect to Web Share API later) ─
const handleShare = async () => {
if (navigator.share) {
try {
await navigator.share({
title: provider.businessName,
text:  `Check out ${provider.businessName} on GigsCourt!`,
url:   window.location.href,
});
} catch {
// User cancelled share sheet
}
} else {
// Fallback: copy URL to clipboard
navigator.clipboard?.writeText(window.location.href);
setShared(true);
setTimeout(() => setShared(false), 2000);
}
};

return (
<div style={styles.page}>

```
  {/* ── Navigation Bar ── */}
  <nav style={styles.navbar}>

    {/* Back button */}
    <button
      style={styles.navBtn}
      onClick={onBack}
      aria-label="Go back to feed"
    >
      <BackArrow />
    </button>

    {/* Page title */}
    <span style={styles.navTitle} title={provider.businessName}>
      {provider.businessName}
    </span>

    {/* Right actions */}
    <div style={styles.navActions}>
      <button
        style={styles.navBtn}
        onClick={handleShare}
        aria-label="Share this profile"
        title={shared ? "Copied!" : "Share"}
      >
        {shared
          ? <span style={styles.copiedBadge}>✓</span>
          : <ShareIcon />}
      </button>

      <button
        style={{
          ...styles.navBtn,
          color: bookmarked ? "#FF385C" : "var(--text-secondary, #5A5A6E)",
        }}
        onClick={() => setBookmarked((b) => !b)}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this provider"}
      >
        <BookmarkIcon />
      </button>
    </div>

  </nav>

  {/* ── Profile Grid (the main content) ── */}
  <div style={styles.content}>
    <ProfileGrid
      provider={provider}
      images={images}
      onUpload={handleUpload}
      onImagePress={onImagePress ?? ((img, i) =>
        console.log("GigsCourt ProfilePage — image tapped:", img.url, i)
      )}
    />
  </div>

  {/* ── Book Now CTA — fixed at bottom ── */}
  <div style={styles.bookingBar}>
    <div style={styles.bookingInfo}>
      <span style={styles.bookingName}>{provider.businessName}</span>
      <span style={styles.bookingMeta}>
        ★ {provider.rating?.toFixed(1)} · {provider.locationName}
      </span>
    </div>
    <button
      style={styles.bookBtn}
      onClick={() => alert("Booking system coming soon!")}
      aria-label={`Book ${provider.businessName}`}
    >
      Book Now
    </button>
  </div>

</div>
```

);
}

// ── Styles ────────────────────────────────────────────────
const styles = {
page: {
minHeight: “100dvh”,
display: “flex”,
flexDirection: “column”,
backgroundColor: “var(–off-white, #F8F8FA)”,
position: “relative”,
},

// ── Navbar ──
navbar: {
position: “sticky”,
top: 0,
zIndex: 50,
display: “flex”,
alignItems: “center”,
justifyContent: “space-between”,
padding: “10px 12px”,
backgroundColor: “#FFFFFF”,
borderBottom: “1px solid #F0F0F5”,
boxShadow: “0 1px 4px rgba(0,0,0,0.06)”,
gap: 8,
},
navBtn: {
width: 36,
height: 36,
borderRadius: “50%”,
border: “none”,
backgroundColor: “var(–surface, #F2F2F7)”,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
cursor: “pointer”,
color: “var(–text-secondary, #5A5A6E)”,
flexShrink: 0,
transition: “all 0.15s ease”,
WebkitTapHighlightColor: “transparent”,
padding: 0,
},
navTitle: {
flex: 1,
fontFamily: “var(–font-display, ‘Clash Display’, sans-serif)”,
fontSize: 16,
fontWeight: 700,
color: “var(–text-primary, #0D0D12)”,
textAlign: “center”,
overflow: “hidden”,
textOverflow: “ellipsis”,
whiteSpace: “nowrap”,
letterSpacing: “-0.3px”,
},
navActions: {
display: “flex”,
alignItems: “center”,
gap: 6,
},
copiedBadge: {
fontSize: 14,
fontWeight: 700,
color: “#22C55E”,
},

// ── Content ──
content: {
flex: 1,
paddingBottom: 80, // space for the fixed booking bar
},

// ── Booking Bar ──
bookingBar: {
position: “fixed”,
bottom: 0,
left: 0,
right: 0,
zIndex: 50,
display: “flex”,
alignItems: “center”,
justifyContent: “space-between”,
padding: “12px 16px calc(12px + env(safe-area-inset-bottom, 0px))”,
backgroundColor: “#FFFFFF”,
borderTop: “1px solid #F0F0F5”,
boxShadow: “0 -4px 20px rgba(0,0,0,0.08)”,
gap: 12,
},
bookingInfo: {
display: “flex”,
flexDirection: “column”,
gap: 2,
flex: 1,
overflow: “hidden”,
},
bookingName: {
fontFamily: “var(–font-display, ‘Clash Display’, sans-serif)”,
fontSize: 15,
fontWeight: 700,
color: “var(–text-primary, #0D0D12)”,
overflow: “hidden”,
textOverflow: “ellipsis”,
whiteSpace: “nowrap”,
},
bookingMeta: {
fontFamily: “var(–font-body, ‘DM Sans’, sans-serif)”,
fontSize: 12,
color: “var(–text-muted, #9999AA)”,
},
bookBtn: {
flexShrink: 0,
height: 42,
padding: “0 24px”,
backgroundColor: “#FF385C”,
color: “#FFFFFF”,
fontFamily: “var(–font-body, ‘DM Sans’, sans-serif)”,
fontSize: 14,
fontWeight: 700,
border: “none”,
borderRadius: 999,
cursor: “pointer”,
boxShadow: “0 4px 14px rgba(255,56,92,0.4)”,
letterSpacing: “0.3px”,
transition: “all 0.2s ease”,
WebkitTapHighlightColor: “transparent”,
},
};
