import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, sendEmailVerification, signOut, deleteUser
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, query, orderBy, limit, startAfter, getDocs, GeoPoint,
  addDoc, onSnapshot, Timestamp, where, writeBatch, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ==================== CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyD7dRYpXukVlyV6ipmCfbCXEJ4kp8t1Gmg",
  authDomain: "gigscourt.firebaseapp.com",
  projectId: "gigscourt",
  storageBucket: "gigscourt.firebasestorage.app",
  messagingSenderId: "1055157379736",
  appId: "1:1055157379736:web:215763c63606c2c5a966ed",
  measurementId: "G-BY1YBSYJHV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ImageKit config
const IK_PUBLIC_KEY = 'public_t2gpKmHQ/9binh9kNSsQBq0zsys=';
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'100\' fill=\'%23e0e0e0\'/%3E%3Ccircle cx=\'100\' cy=\'70\' r=\'30\' fill=\'%23b0b0b0\'/%3E%3Ccircle cx=\'100\' cy=\'150\' r=\'40\' fill=\'%23b0b0b0\'/%3E%3C/svg%3E';

const getThumbnailUrl = (url, w = 400) => !url ? DEFAULT_AVATAR : url.includes('?') ? `${url}&tr=w-${w}` : `${url}?tr=w-${w}`;

// ==================== DOM ELEMENTS ====================
const $ = {
  authContainer: id('authContainer'), mainApp: id('mainApp'),
  emailSignupView: id('emailSignupView'), phoneSignupView: id('phoneSignupView'),
  loginView: id('loginView'), verifyView: id('verifyView'),
  authError: id('authError'), loginError: id('loginError'),
  adminTabBtn: id('adminTabBtn'), adminTab: id('adminTab'),
  homeGrid: id('homeGrid'), deleteModal: id('deleteModal'),
  providerListDrawer: id('providerListDrawer'), radiusSlider: id('radiusSlider'),
  radiusValue: id('radiusValue'), skillSearch: id('skillSearch'),
  conversationsList: id('conversationsList'), messagesContainer: id('messagesContainer'),
  messageInput: id('messageInput'), sendMessageBtn: id('sendMessageBtn'),
  chatPartnerImg: id('chatPartnerImg'), chatPartnerName: id('chatPartnerName'),
  backToConversations: id('backToConversations'), chatView: id('chatView'),
  messagesTab: id('messagesTab'), startChatModal: id('startChatModal'),
  startChatModalTitle: id('startChatModalTitle'), startChatModalMessage: id('startChatModalMessage'),
  cancelStartChatBtn: id('cancelStartChatBtn'), confirmStartChatBtn: id('confirmStartChatBtn'),
  fileInput: id('fileInput'), quickViewSheet: id('quickViewSheet'),
  sheetOverlay: id('sheetOverlay'), sheetContent: id('sheetContent'),
  profileViewer: id('profileViewer'), profileViewerImg: id('profileViewerImg'),
  closeProfileViewer: id('closeProfileViewer'), deletePortfolioModal: id('deletePortfolioModal'),
  deletePortfolioOverlay: id('deletePortfolioOverlay'), cancelDeletePortfolio: id('cancelDeletePortfolio'),
  confirmDeletePortfolio: id('confirmDeletePortfolio'), profileStats: id('profileStats'),
  profileReviews: id('profileReviews'), portfolioCount: id('portfolioCount'),
  profileImage: id('profileImage'), profileBusinessName: id('profileBusinessName'),
  profileUsername: id('profileUsername'), profileJobs: id('profileJobs'),
  profileRating: id('profileRating'), profileBio: id('profileBio'),
  profilePhone: id('profilePhone'), profilePhoneContainer: id('profilePhoneContainer'),
  profileAddress: id('profileAddress'), profileAddressContainer: id('profileAddressContainer'),
  editProfileBtn: id('editProfileBtn'), shareProfileBtn: id('shareProfileBtn'),
  portfolioGrid: id('portfolioGrid'), uploadProfilePicBtn: id('uploadProfilePicBtn'),
  addPortfolioBtn: id('addPortfolioBtn'), uploadProgress: id('uploadProgress'),
  uploadError: id('uploadError'), editProfileScreen: id('editProfileScreen'),
  backFromEditBtn: id('backFromEditBtn'), saveEditProfileBtn: id('saveEditProfileBtn'),
  editProfileImage: id('editProfileImage'), editBusinessName: id('editBusinessName'),
  editUsername: id('editUsername'), editBio: id('editBio'),
  editPhone: id('editPhone'), editAddress: id('editAddress'),
  editSkillsContainer: id('editSkillsContainer'), newSkillInput: id('newSkillInput'),
  addSkillBtn: id('addSkillBtn'), businessNameTimer: id('businessNameTimer'),
  usernameTimer: id('usernameTimer'), editLogoutBtn: id('editLogoutBtn'),
  editDeleteAccountBtn: id('editDeleteAccountBtn')
};

function id(id) { return document.getElementById(id); }

if ($.adminTab) $.adminTab.innerHTML = '<div style="padding:20px"><h2>Pending Services</h2><div id="pendingList"></div></div>';

// ==================== STATE ====================
let state = {
  selectedEmailSkills: new Set(),
  lastVisible: null,
  loadingMore: false,
  currentUser: null,
  map: null,
  mapMarkers: [],
  allUsers: [],
  aktuellesSuchwort: '',
  aktuellerRadius: 25,
  touchOnMap: false,
  currentHighlightedMarker: null,
  currentChatId: null,
  currentChatPartner: null,
  unsubscribeMessages: null,
  unsubscribeConversations: null,
  pendingChatUserId: null,
  pendingChatUserName: null,
  pendingChatUserImage: null,
  userCache: new Map(),
  refreshIndicator: null,
  pullStartY: 0,
  isPulling: false,
  isTouchingMap: false,
  isUploading: false,
  currentUploadType: null,
  currentSheetProvider: null,
  longPressTimer: null,
  selectedImageIndex: null,
  selectedImageUrl: null,
  isPullingProfile: false,
  profilePullStartY: 0,
  portfolioStartIndex: 0,
  portfolioBatchSize: 9
};

// ==================== UTILS ====================
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let { width, height } = img;
        const maxSize = 1600;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          } else {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }
        const canvas = Object.assign(document.createElement('canvas'), { width, height });
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })), 'image/jpeg', 0.85);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// ==================== QUICK VIEW ====================
function openQuickView(id, data) {
  state.currentSheetProvider = { id, ...data };
  const portfolioImages = data.portfolioImages || Array(3).fill('https://ik.imagekit.io/GigsCourt/sample');
  $.sheetContent.innerHTML = `
    <div class="sheet-profile-row">
      <img class="sheet-profile-img" src="${getThumbnailUrl(data.profileImage, 200)}">
      <div>
        <h3 style="margin-bottom:4px">${data.businessName || 'Business'}</h3>
        <div style="color:#4b5563">⭐ ${data.rating || 0} (${data.reviewCount || 0}) · 1.2 km</div>
      </div>
    </div>
    <div style="margin:12px 0;color:#2c3e50">${(data.skills || []).join(' · ')}</div>
    <div style="color:#6b7280;margin-bottom:16px">${data.bio ? data.bio.substring(0,100)+'…' : 'No bio yet.'}</div>
    <div class="sheet-portfolio-grid">${portfolioImages.slice(0,3).map(u => `<img src="${getThumbnailUrl(u,300)}">`).join('')}</div>
    <div class="sheet-buttons">
      <button class="sheet-btn-secondary" id="sheetViewProfileBtn">View Profile</button>
      <button class="sheet-btn-primary" id="sheetMessageBtn">Message</button>
    </div>
  `;
  $.quickViewSheet.classList.add('active');
  $.sheetOverlay.classList.add('active');
  
  id('sheetMessageBtn')?.addEventListener('click', () => {
    closeQuickView();
    showStartChatModal(id, data.businessName, data.profileImage);
  });
  id('sheetViewProfileBtn')?.addEventListener('click', () => { alert('Full profile coming in next phase'); closeQuickView(); });
}

function closeQuickView() {
  $.quickViewSheet.classList.remove('active');
  $.sheetOverlay.classList.remove('active');
}

// ==================== PULL TO REFRESH ====================
function createRefreshIndicator() {
  const el = document.createElement('div');
  el.className = 'refresh-indicator';
  el.innerHTML = '<div class="spinner-small"></div><span>Pull to refresh</span>';
  document.body.appendChild(el);
  return el;
}

function initPullToRefresh() {
  const tabContent = document.querySelector('.tab-content');
  if (!tabContent) return;
  
  tabContent.addEventListener('touchstart', (e) => {
    if (id('map')?.contains(e.target)) { state.isTouchingMap = true; return; }
    state.isTouchingMap = false;
    const active = document.querySelector('.tab-pane:not(.hidden)')?.id;
    if (active === 'searchTab') { state.isPulling = false; return; }
    const y = e.touches[0].clientY;
    if (tabContent.scrollTop === 0 && y < 60) {
      state.pullStartY = y;
      state.isPulling = true;
    }
  }, { passive: true });

  tabContent.addEventListener('touchmove', (e) => {
    const active = document.querySelector('.tab-pane:not(.hidden)')?.id;
    if (active === 'searchTab' || state.isTouchingMap || !state.isPulling || tabContent.scrollTop > 0) return;
    const diff = e.touches[0].clientY - state.pullStartY;
    if (diff > 0) {
      e.preventDefault();
      let r = 1; if (diff > 30) r = 0.7; if (diff > 60) r = 0.4; if (diff > 90) r = 0.25;
      const d = Math.min(diff * r, 100);
      if (!state.refreshIndicator) state.refreshIndicator = createRefreshIndicator();
      state.refreshIndicator.style.transform = `translateY(${d + 60}px)`;
      state.refreshIndicator.querySelector('span').textContent = diff > 90 ? 'Release to refresh' : 'Pull to refresh';
    }
  }, { passive: false });

  tabContent.addEventListener('touchend', async (e) => {
    const active = document.querySelector('.tab-pane:not(.hidden)')?.id;
    if (active === 'searchTab' || state.isTouchingMap || !state.isPulling || !state.refreshIndicator) return;
    const diff = e.changedTouches[0].clientY - state.pullStartY;
    if (diff > 100 && tabContent.scrollTop === 0) {
      state.refreshIndicator.querySelector('span').textContent = 'Refreshing...';
      if (active === 'homeTab') await loadProviders(true);
      else if (active === 'messagesTab') await loadConversations();
      else if (active === 'profileTab' && state.currentUser) await loadProfileData();
      state.refreshIndicator.style.transform = 'translateY(60px)';
      setTimeout(() => {
        state.refreshIndicator.style.transform = 'translateY(-60px)';
        setTimeout(() => { if (state.refreshIndicator) { state.refreshIndicator.remove(); state.refreshIndicator = null; } }, 200);
      }, 500);
    } else {
      state.refreshIndicator.style.transform = 'translateY(-60px)';
      setTimeout(() => { if (state.refreshIndicator) { state.refreshIndicator.remove(); state.refreshIndicator = null; } }, 200);
    }
    state.isPulling = false;
  }, { passive: true });
}

function initProfilePullToRefresh() {
  const tab = id('profileTab');
  if (!tab) return;
  
  tab.addEventListener('touchstart', (e) => {
    const y = e.touches[0].clientY;
    if (tab.scrollTop === 0 && y < 60) {
      state.profilePullStartY = y;
      state.isPullingProfile = true;
    }
  }, { passive: true });

  tab.addEventListener('touchmove', (e) => {
    if (!state.isPullingProfile || tab.scrollTop > 0) return;
    const diff = e.touches[0].clientY - state.profilePullStartY;
    if (diff > 0) {
      e.preventDefault();
      let r = 1; if (diff > 30) r = 0.7; if (diff > 60) r = 0.4; if (diff > 90) r = 0.25;
      const d = Math.min(diff * r, 100);
      if (!state.refreshIndicator) state.refreshIndicator = createRefreshIndicator();
      state.refreshIndicator.style.transform = `translateY(${d + 60}px)`;
      state.refreshIndicator.querySelector('span').textContent = diff > 90 ? 'Release to refresh' : 'Pull to refresh';
    }
  }, { passive: false });

  tab.addEventListener('touchend', async (e) => {
    if (!state.isPullingProfile || !state.refreshIndicator) return;
    const diff = e.changedTouches[0].clientY - state.profilePullStartY;
    if (diff > 100 && tab.scrollTop === 0) {
      state.refreshIndicator.querySelector('span').textContent = 'Refreshing...';
      if (state.currentUser) await loadProfileData();
      state.refreshIndicator.style.transform = 'translateY(60px)';
      setTimeout(() => {
        state.refreshIndicator.style.transform = 'translateY(-60px)';
        setTimeout(() => { if (state.refreshIndicator) { state.refreshIndicator.remove(); state.refreshIndicator = null; } }, 200);
      }, 500);
    } else {
      state.refreshIndicator.style.transform = 'translateY(-60px)';
      setTimeout(() => { if (state.refreshIndicator) { state.refreshIndicator.remove(); state.refreshIndicator = null; } }, 200);
    }
    state.isPullingProfile = false;
  }, { passive: true });
}

// ==================== IMAGEKIT UPLOAD ====================
async function uploadToImageKit(file, type) {
  if (state.isUploading) { alert('Upload already in progress'); return null; }
  if (!state.currentUser) { alert('You must be logged in to upload'); return null; }
  
  state.isUploading = true;
  state.currentUploadType = type;
  $.uploadProgress.classList.remove('hidden');
  $.uploadError?.classList.add('hidden');
  
  try {
    const compressed = await compressImage(file);
    const auth = await (await fetch('/api/imagekit-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name })
    })).json();
    
    const form = new FormData();
    form.append('file', compressed);
    form.append('publicKey', IK_PUBLIC_KEY);
    form.append('signature', auth.signature);
    form.append('token', auth.token);
    form.append('expire', auth.expire);
    form.append('fileName', file.name);
    form.append('folder', type === 'profile' ? 'profiles' : 'portfolios');
    form.append('useUniqueFileName', 'true');
    
    const res = await (await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: form })).json();
    return res.url;
  } catch (err) {
    console.error(err);
    if ($.uploadError) { $.uploadError.textContent = 'Upload failed: ' + err.message; $.uploadError.classList.remove('hidden'); }
    return null;
  } finally {
    $.uploadProgress.classList.add('hidden');
    state.isUploading = false;
  }
}

// ==================== PROFILE ====================
$.profileImage?.addEventListener('click', () => {
  $.profileViewerImg.src = $.profileImage.src;
  $.profileViewer.classList.add('active');
});

$.closeProfileViewer?.addEventListener('click', () => $.profileViewer.classList.remove('active'));
$.profileViewer?.addEventListener('click', (e) => { if (e.target === $.profileViewer) $.profileViewer.classList.remove('active'); });

// Long press delete
function setupLongPress() {
  document.querySelectorAll('.portfolio-item').forEach((item, i) => {
    item.addEventListener('touchstart', () => {
      state.longPressTimer = setTimeout(() => {
        state.selectedImageUrl = item.dataset.url;
        state.selectedImageIndex = i;
        $.deletePortfolioModal.classList.add('active');
        $.deletePortfolioOverlay.classList.add('active');
        item.classList.add('long-press');
      }, 500);
    });
    item.addEventListener('touchend', () => { clearTimeout(state.longPressTimer); item.classList.remove('long-press'); });
    item.addEventListener('touchmove', () => { clearTimeout(state.longPressTimer); item.classList.remove('long-press'); });
  });
}

$.cancelDeletePortfolio?.addEventListener('click', () => {
  $.deletePortfolioModal.classList.remove('active');
  $.deletePortfolioOverlay.classList.remove('active');
});
$.deletePortfolioOverlay?.addEventListener('click', () => {
  $.deletePortfolioModal.classList.remove('active');
  $.deletePortfolioOverlay.classList.remove('active');
});
$.confirmDeletePortfolio?.addEventListener('click', async () => {
  if (!state.currentUser || !state.selectedImageUrl) return;
  try {
    await updateDoc(doc(db, 'users', state.currentUser.uid), { portfolioImages: arrayRemove(state.selectedImageUrl) });
    await loadProfileData();
  } catch (err) { console.error(err); alert('Failed to delete image'); }
  finally {
    $.deletePortfolioModal.classList.remove('active');
    $.deletePortfolioOverlay.classList.remove('active');
  }
});

async function loadProfileData() {
  if (!auth.currentUser) return;
  const ref = doc(db, 'users', auth.currentUser.uid);
  let snap = await getDoc(ref);
  
  if (!snap.exists()) {
    const newUser = {
      businessName: auth.currentUser.email?.split('@')[0] || 'User',
      email: auth.currentUser.email || '',
      username: auth.currentUser.email?.split('@')[0] || 'user',
      phoneNumber: '', address: '', skills: [], profileImage: DEFAULT_AVATAR,
      rating: 0, reviewCount: 0, jobsDone: 0,
      location: new GeoPoint(7.0667, 6.2667), createdAt: Date.now(),
      portfolioImages: Array(3).fill('https://ik.imagekit.io/GigsCourt/sample'),
      bio: '', signupMethod: 'email', emailVerified: true, phoneVerified: false,
      businessNameLastChanged: null, usernameLastChanged: null
    };
    await setDoc(ref, newUser);
    snap = { data: () => newUser };
  }
  
  const d = snap.data();
  if ($.profileBusinessName) $.profileBusinessName.textContent = d.businessName || '';
  if ($.profileUsername) $.profileUsername.textContent = d.username ? '@' + d.username : '@user';
  if ($.profileJobs) $.profileJobs.textContent = d.jobsDone || 0;
  if ($.profileRating) $.profileRating.textContent = d.rating || 0;
  if ($.profileReviews) $.profileReviews.textContent = d.reviewCount || 0;
  if ($.profileBio) $.profileBio.textContent = d.bio || 'No bio yet.';
  if ($.profileImage) $.profileImage.src = getThumbnailUrl(d.profileImage, 200);
  
  if ($.profilePhone && $.profilePhoneContainer) {
    $.profilePhone.textContent = d.phoneNumber || '';
    $.profilePhoneContainer.style.display = d.phoneNumber ? 'flex' : 'none';
  }
  if ($.profileAddress && $.profileAddressContainer) {
    $.profileAddress.textContent = d.address || '';
    $.profileAddressContainer.style.display = d.address ? 'flex' : 'none';
  }

  // Skills section
  let container = id('profileSkillsContainer');
  if (!container) {
    container = document.createElement('div');
    container.className = 'profile-skills';
    container.id = 'profileSkillsContainer';
    container.innerHTML = '<div style="padding:0 16px 16px"><div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#666">Services</div><div id="profileSkillsList" style="display:flex;flex-wrap:wrap;gap:8px"></div></div>';
    (document.querySelector('.profile-bio') || document.querySelector('.profile-name-section'))?.insertAdjacentElement('afterend', container);
  }
  
  const list = id('profileSkillsList');
  if (list && d.skills) {
    list.innerHTML = '';
    d.skills.forEach(s => {
      const tag = document.createElement('span');
      tag.style.cssText = 'background:#f0f3f8;padding:6px 12px;border-radius:20px;font-size:13px;color:#1e1e2f';
      tag.textContent = s;
      list.appendChild(tag);
    });
  }

  const portfolio = d.portfolioImages || Array(3).fill('https://ik.imagekit.io/GigsCourt/sample');
  if ($.portfolioCount) $.portfolioCount.textContent = `(${portfolio.length})`;
  
  if ($.portfolioGrid) {
    $.portfolioGrid.innerHTML = '';
    state.portfolioStartIndex = 0;
    
    const loadMore = () => {
      const batch = portfolio.slice(state.portfolioStartIndex, state.portfolioStartIndex + state.portfolioBatchSize);
      batch.forEach((url, i) => {
        const idx = state.portfolioStartIndex + i;
        const item = document.createElement('div');
        item.className = 'portfolio-item';
        item.dataset.url = url;
        item.dataset.index = idx;
        
        const img = document.createElement('img');
        img.src = getThumbnailUrl(url, 300);
        img.loading = 'lazy';
        img.classList.add('lazy-load');
        img.onload = () => img.classList.add('loaded');
        img.addEventListener('click', () => openGallery(portfolio, idx));
        
        const del = document.createElement('div');
        del.className = 'delete-overlay';
        del.innerHTML = '×';
        
        item.append(img, del);
        $.portfolioGrid.appendChild(item);
      });
      state.portfolioStartIndex += batch.length;
    };
    
    loadMore();
    $.portfolioGrid.addEventListener('scroll', () => {
      if ($.portfolioGrid.scrollTop + $.portfolioGrid.clientHeight >= $.portfolioGrid.scrollHeight - 100 &&
          state.portfolioStartIndex < portfolio.length) loadMore();
    });
  }
  setupLongPress();
}

// ==================== GALLERY ====================
function openGallery(images, start = 0) {
  if (typeof PhotoSwipeLightbox === 'undefined' || typeof PhotoSwipe === 'undefined') {
    alert('Gallery viewer not ready'); return;
  }
  try {
    new PhotoSwipeLightbox({
      dataSource: images.map(u => ({ src: getThumbnailUrl(u, 1600), width: 1600, height: 1600, thumb: getThumbnailUrl(u, 300) })),
      index: start, pswpModule: PhotoSwipe, bgOpacity: 0.95, loop: true, preload: [1,2],
      closeOnVerticalDrag: true, pinchToClose: true, tapToClose: true,
      arrowKeys: true, closeOnScroll: false, imageClickAction: 'zoom',
      toggleControlsOnTap: true, showHideAnimationType: 'fade', zoom: true, doubleTapAction: 'zoom'
    }).init().loadAndOpen(start);
  } catch (err) { console.error(err); alert('Could not open gallery'); }
}

// ==================== PROVIDERS ====================
async function loadProviders(reset = false) {
  if (reset) { state.lastVisible = null; $.homeGrid.innerHTML = ''; }
  if (state.loadingMore) return;
  state.loadingMore = true;
  try {
    let q = query(collection(db, 'users'), orderBy('rating', 'desc'), limit(6));
    if (state.lastVisible) q = query(q, startAfter(state.lastVisible));
    const snap = await getDocs(q);
    if (!snap.empty) {
      state.lastVisible = snap.docs[snap.docs.length - 1];
      snap.forEach(d => addProviderCard(d.id, d.data(), 'home'));
    }
  } finally { state.loadingMore = false; }
}

function addProviderCard(id, d, src) {
  const dist = calculateDistance(d.location);
  const card = document.createElement('div');
  card.className = 'provider-card';
  card.innerHTML = `
    <img class="card-img" src="${getThumbnailUrl(d.profileImage, 400)}" loading="lazy">
    <div class="business-name">${d.businessName}</div>
    <div class="rating-row"><span class="star">⭐</span> ${d.rating} (${d.reviewCount})</div>
    <div class="distance" data-id="${id}" data-lat="${d.location?.latitude}" data-lng="${d.location?.longitude}" data-source="${src}">${dist} km</div>
    <div class="skills">${d.skills.slice(0,2).join(', ')}${d.skills.length>2?'…':''}</div>
  `;
  card.addEventListener('click', (e) => { if (!e.target.classList.contains('distance')) openQuickView(id, d); });
  $.homeGrid.appendChild(card);
}

function calculateDistance(loc) {
  if (!loc) return (Math.random()*3+0.5).toFixed(1);
  return Math.sqrt(((loc.latitude-7.0667)*111)**2 + ((loc.longitude-6.2667)*111)**2).toFixed(1);
}

async function loadAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  state.allUsers = [];
  snap.forEach(d => {
    state.allUsers.push({ id: d.id, ...d.data() });
    state.userCache.set(d.id, d.data());
  });
  return state.allUsers;
}

function filterUsers() {
  return state.allUsers.filter(u => {
    if (!u.location) return false;
    if (state.aktuellesSuchwort) {
      const word = state.aktuellesSuchwort.toLowerCase();
      if (!u.skills?.some(s => s.toLowerCase().includes(word))) return false;
    }
    const dist = Math.sqrt(((u.location.latitude-7.0667)*111)**2 + ((u.location.longitude-6.2667)*111)**2);
    return dist <= state.aktuellerRadius;
  });
}

async function updateMapAndList() {
  const filtered = filterUsers();
  state.mapMarkers.forEach(m => state.map.removeLayer(m));
  state.mapMarkers = [];

  filtered.forEach(u => {
    const icon = L.divIcon({
      html: `<div class="marker-container"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" class="marker-pin"><div class="rating-badge">${u.rating||0}</div></div>`,
      className: 'custom-marker', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [0,-41]
    });
    const m = L.marker([u.location.latitude, u.location.longitude], { icon }).addTo(state.map);
    m.bindPopup(`<b>${u.businessName}</b><br>⭐ ${u.rating} (${u.reviewCount})<br><button class="quick-view-btn" data-id="${u.id}" style="background:#666;color:white;border:none;border-radius:20px;padding:8px 16px;margin-top:8px;width:100%">View</button>`);
    m.on('popupopen', () => document.querySelector('.quick-view-btn')?.addEventListener('click', (e) => { openQuickView(e.target.dataset.id, u); state.map.closePopup(); }));
    state.mapMarkers.push(m);
  });

  $.providerListDrawer.innerHTML = filtered.length ? '<div class="pull-handle"></div>' : `<div class="pull-handle"></div><div class="empty-state">No providers found matching "${state.aktuellesSuchwort||'all services'}" within ${state.aktuellerRadius}km</div>`;
  
  filtered.forEach(u => {
    const dist = Math.sqrt(((u.location.latitude-7.0667)*111)**2 + ((u.location.longitude-6.2667)*111)**2).toFixed(1);
    const item = document.createElement('div');
    item.className = 'provider-list-item';
    item.innerHTML = `<img src="${getThumbnailUrl(u.profileImage,100)}"><div><strong>${u.businessName}</strong><br><span style="color:#6b7280">⭐ ${u.rating} (${u.reviewCount}) · <span class="distance" data-id="${u.id}" data-lat="${u.location.latitude}" data-lng="${u.location.longitude}" data-source="search">${dist}km</span></span></div>`;
    item.addEventListener('click', (e) => { if (!e.target.classList.contains('distance')) openQuickView(u.id, u); });
    $.providerListDrawer.appendChild(item);
  });
}

// ==================== CHAT ====================
function showStartChatModal(id, name, img) {
  state.pendingChatUserId = id;
  state.pendingChatUserName = name;
  state.pendingChatUserImage = img;
  $.startChatModalTitle.textContent = `Start chat with ${name}?`;
  $.startChatModalMessage.textContent = `Send a message to ${name}`;
  $.startChatModal.classList.remove('hidden');
}

async function startChat() {
  if (!state.pendingChatUserId) return;
  $.startChatModal.classList.add('hidden');
  if (!state.currentUser) return;
  
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', state.currentUser.uid));
  const snap = await getDocs(q);
  let existing = null;
  snap.forEach(d => { if (d.data().participants.includes(state.pendingChatUserId)) existing = { id: d.id, ...d.data() }; });
  
  state.currentChatId = existing ? existing.id : (await addDoc(collection(db, 'chats'), {
    participants: [state.currentUser.uid, state.pendingChatUserId],
    createdAt: Timestamp.now(), lastMessage: '', lastMessageTimestamp: Timestamp.now(), lastMessageSender: ''
  })).id;
  
  state.currentChatPartner = { id: state.pendingChatUserId, name: state.pendingChatUserName, image: state.pendingChatUserImage };
  switchTab('messages');
  setTimeout(openChat, 100);
}

async function getUsersBatch(ids) {
  const users = [];
  const uncached = ids.filter(id => id != null).filter(id => {
    if (state.userCache.has(id)) { users.push({ id, ...state.userCache.get(id) }); return false; }
    return true;
  });
  if (uncached.length) {
    const snap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', uncached.slice(0,10))));
    snap.forEach(d => { state.userCache.set(d.id, d.data()); users.push({ id: d.id, ...d.data() }); });
  }
  return users;
}

async function loadConversations() {
  if (!state.currentUser) return;
  $.conversationsList.innerHTML = '<div class="empty-state">Loading...</div>';
  if (state.unsubscribeConversations) state.unsubscribeConversations();
  
  state.unsubscribeConversations = onSnapshot(
    query(collection(db, 'chats'), where('participants', 'array-contains', state.currentUser.uid), orderBy('lastMessageTimestamp', 'desc'), limit(20)),
    async (snap) => {
      if (snap.empty) { $.conversationsList.innerHTML = '<div class="empty-state">No conversations yet</div>'; return; }
      
      const chats = [];
      snap.forEach(d => {
        const chat = d.data();
        chats.push({ id: d.id, ...chat, otherUserId: chat.participants.find(id => id !== state.currentUser.uid) });
      });
      
      const users = await getUsersBatch(chats.map(c => c.otherUserId));
      const userMap = new Map(users.map(u => [u.id, u]));
      
      $.conversationsList.innerHTML = chats.map(c => {
        const u = userMap.get(c.otherUserId);
        if (!u) return '';
        const time = c.lastMessageTimestamp?.toDate() || new Date();
        return `<div class="conversation-item" data-chat-id="${c.id}" data-user-id="${c.otherUserId}" data-user-name="${u.businessName}" data-user-image="${u.profileImage}">
          <img src="${getThumbnailUrl(u.profileImage,100)}" class="conversation-img" loading="lazy">
          <div class="conversation-details"><div class="conversation-name">${u.businessName}</div><div class="last-message">${c.lastMessageSender===state.currentUser.uid?'<span class="blue-tick">✓✓</span> ':''}${c.lastMessage||'No messages yet'}</div></div>
          <div class="timestamp">${time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
        </div>`;
      }).join('');
      
      document.querySelectorAll('.conversation-item').forEach(el => {
        el.addEventListener('click', () => {
          state.currentChatId = el.dataset.chatId;
          state.currentChatPartner = { id: el.dataset.userId, name: el.dataset.userName, image: el.dataset.userImage };
          openChat();
        });
      });
    }
  );
}

function openChat() {
  $.chatPartnerImg.src = getThumbnailUrl(state.currentChatPartner.image, 100);
  $.chatPartnerName.textContent = state.currentChatPartner.name;
  $.messagesTab.classList.add('hidden');
  $.mainApp.classList.add('hidden');
  $.chatView.classList.remove('hidden');
  
  if (state.unsubscribeMessages) state.unsubscribeMessages();
  
  $.messagesContainer.innerHTML = '<div class="empty-state">Loading messages...</div>';
  state.unsubscribeMessages = onSnapshot(
    query(collection(db, 'messages'), where('chatId', '==', state.currentChatId), orderBy('timestamp', 'asc')),
    async (snap) => {
      if (snap.empty) { $.messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Say hello!</div>'; return; }
      
      const batch = writeBatch(db);
      let unread = false;
      snap.forEach(d => {
        const msg = d.data();
        if (msg.senderId !== state.currentUser.uid && !msg.read) { batch.update(d.ref, { read: true }); unread = true; }
      });
      if (unread) await batch.commit();
      
      $.messagesContainer.innerHTML = snap.docs.map(d => {
        const msg = d.data();
        const time = msg.timestamp?.toDate() || new Date();
        const sent = msg.senderId === state.currentUser.uid;
        return `<div class="message ${sent ? 'sent' : 'received'}"><div>${msg.text}</div><div class="message-time">${time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} ${sent ? `<span class="${msg.read ? 'tick-red' : 'tick-white'}">✓✓</span>` : ''}</div></div>`;
      }).join('');
      $.messagesContainer.scrollTop = $.messagesContainer.scrollHeight;
    }
  );
}

async function sendMessage() {
  const text = $.messageInput.value.trim();
  if (!text || !state.currentChatId || !state.currentUser) return;
  $.messageInput.value = '';
  try {
    await addDoc(collection(db, 'messages'), { chatId: state.currentChatId, senderId: state.currentUser.uid, text, timestamp: Timestamp.now(), read: false });
    await updateDoc(doc(db, 'chats', state.currentChatId), { lastMessage: text, lastMessageTimestamp: Timestamp.now(), lastMessageSender: state.currentUser.uid });
  } catch (err) { console.error(err); alert('Failed to send message'); $.messageInput.value = text; }
}

// ==================== MAP ====================
async function initMap() {
  if (state.map) return;
  state.map = L.map('map').setView([7.0667, 6.2667], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap, © CartoDB', subdomains: 'abcd', maxZoom: 20 }).addTo(state.map);
  await loadAllUsers();
  await updateMapAndList();
}

// ==================== FILE UPLOAD ====================
$.fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  
  if (state.currentUploadType === 'portfolio') {
    for (const f of files) {
      const url = await uploadToImageKit(f, 'portfolio');
      if (url) await updateDoc(doc(db, 'users', auth.currentUser.uid), { portfolioImages: arrayUnion(url) });
    }
    await loadProfileData();
  } else if (state.currentUploadType === 'profile' && files[0]) {
    const url = await uploadToImageKit(files[0], 'profile');
    if (url) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { profileImage: url });
      $.profileImage.src = getThumbnailUrl(url, 200);
    }
  }
  $.fileInput.value = '';
});

$.uploadProfilePicBtn?.addEventListener('click', () => {
  if (!state.currentUser) { alert('Please log in first'); return; }
  state.currentUploadType = 'profile';
  $.fileInput.removeAttribute('multiple');
  $.fileInput.click();
});

$.addPortfolioBtn?.addEventListener('click', () => {
  if (!state.currentUser) { alert('Please log in first'); return; }
  state.currentUploadType = 'portfolio';
  $.fileInput.setAttribute('multiple', 'multiple');
  $.fileInput.click();
});

// ==================== TAB FUNCTIONS ====================
function saveCurrentTab(t) { localStorage.setItem('currentTab', t); }
function getSavedTab() { return localStorage.getItem('currentTab') || 'home'; }

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  id(tabId + 'Tab')?.classList.remove('hidden');
  document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-item[data-tab="${tabId}"]`)?.classList.add('active');
  saveCurrentTab(tabId);
  if (tabId === 'home') loadProviders(true);
  if (tabId === 'profile') loadProfileData();
  if (tabId === 'search') setTimeout(initMap, 100);
  if (tabId === 'messages') loadConversations();
  if (tabId === 'admin') loadPendingSkills();
}

let lastTap = { time: 0, tab: '' };
document.querySelectorAll('.tab-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = btn.dataset.tab;
    const el = id(tab + 'Tab');
    if (!el) return;
    const now = Date.now();
    const active = !el.classList.contains('hidden');
    
    if (active && tab === lastTap.tab && now - lastTap.time < 500) {
      if (tab === 'home') loadProviders(true);
      if (tab === 'search') loadAllUsers().then(() => updateMapAndList());
      if (tab === 'messages') loadConversations();
    } else if (active) el.scrollTop = 0;
    else switchTab(tab);
    
    lastTap = { time: now, tab };
  });
});

// ==================== EDGE SWIPE ====================
let touchStart = { x: 0, y: 0 };
document.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  state.touchOnMap = !!id('map')?.contains(e.target);
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (state.touchOnMap) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dy) < 70 && (touchStart.x < window.innerWidth * 0.15 || touchStart.x > window.innerWidth * 0.85)) {
    const tabs = ['home','search','messages','profile','admin'];
    let current = tabs.find(t => !id(t + 'Tab')?.classList.contains('hidden'));
    if (!current) return;
    const idx = tabs.indexOf(current);
    if (dx > 0 && idx > 0) switchTab(tabs[idx-1]);
    else if (dx < 0 && idx < tabs.length-1) switchTab(tabs[idx+1]);
  }
}, { passive: true });

// ==================== EVENT HANDLERS ====================
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('distance')) {
    highlightProviderOnMap(parseFloat(e.target.dataset.lat), parseFloat(e.target.dataset.lng), e.target.dataset.id);
  }
});

$.sheetOverlay.addEventListener('click', closeQuickView);

// Auth UI
const toggle = (active, inactive, show, hide) => {
  active.classList.add('active'); inactive.classList.remove('active');
  show.classList.remove('hidden'); hide.classList.add('hidden');
};
$.toggleEmailSignup?.addEventListener('click', () => toggle($.toggleEmailSignup, $.togglePhoneSignup, $.emailSignupView, $.phoneSignupView));
$.togglePhoneSignup?.addEventListener('click', () => toggle($.togglePhoneSignup, $.toggleEmailSignup, $.phoneSignupView, $.emailSignupView));

$.gotoLoginFromSignup?.addEventListener('click', () => { $.emailSignupView.classList.add('hidden'); $.phoneSignupView.classList.add('hidden'); $.loginView.classList.remove('hidden'); });
$.gotoLoginFromPhone?.addEventListener('click', () => { $.emailSignupView.classList.add('hidden'); $.phoneSignupView.classList.add('hidden'); $.loginView.classList.remove('hidden'); });
$.gotoSignupFromLogin?.addEventListener('click', () => { $.loginView.classList.add('hidden'); $.emailSignupView.classList.remove('hidden'); $.phoneSignupView.classList.add('hidden'); });

// Skills
document.querySelectorAll('#emailSkillsContainer .skill-tag').forEach(t => {
  t.addEventListener('click', () => {
    const s = t.dataset.skill;
    if (state.selectedEmailSkills.has(s)) { state.selectedEmailSkills.delete(s); t.classList.remove('selected'); }
    else { state.selectedEmailSkills.add(s); t.classList.add('selected'); }
  });
});

// Signup
$.signupWithEmailBtn?.addEventListener('click', async () => {
  const name = $.emailBusinessName.value, email = $.emailAddress.value, pass = $.emailPassword.value;
  const selected = Array.from(state.selectedEmailSkills);
  const custom = $.customSkillInput.value.split(',').map(s => s.trim()).filter(s => s);
  const all = [...selected, ...custom];
  
  if (!name || !email || !pass || !all.length) {
    $.authError.textContent = 'Business name, email, password and at least one service are required';
    return;
  }
  
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      businessName: name, email, phoneNumber: '', skills: all,
      skillsWithStatus: [...selected.map(s => ({ name: s, approved: true })), ...custom.map(s => ({ name: s, approved: false }))],
      pendingSkills: custom, profileImage: DEFAULT_AVATAR, rating: 0, reviewCount: 0, jobsDone: 0,
      location: new GeoPoint(7.0667, 6.2667), createdAt: Date.now(),
      portfolioImages: Array(3).fill('https://ik.imagekit.io/GigsCourt/sample'),
      bio: '', signupMethod: 'email', emailVerified: false, phoneVerified: false
    });
    if (custom.length) alert(`Your custom services (${custom.join(', ')}) have been submitted for approval.`);
    await sendEmailVerification(cred.user);
    $.emailSignupView.classList.add('hidden'); $.phoneSignupView.classList.add('hidden'); $.verifyView.classList.remove('hidden');
  } catch (err) { $.authError.textContent = err.message; }
});

// Login
$.loginBtn?.addEventListener('click', async () => {
  try { await signInWithEmailAndPassword(auth, $.loginEmail.value, $.loginPassword.value); }
  catch (err) { $.loginError.textContent = err.message; }
});

// Verification
$.checkVerificationBtn?.addEventListener('click', async () => {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      $.verifyView.classList.add('hidden'); $.authContainer.classList.add('hidden'); $.mainApp.classList.remove('hidden');
      switchTab(getSavedTab());
    } else alert('Email not verified yet');
  }
});
$.resendVerifyBtn?.addEventListener('click', async () => { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); alert('Verification email resent!'); } });

// Logout/DELETE
const logout = async () => { await signOut(auth); window.location.reload(); };
$.editLogoutBtn?.addEventListener('click', logout);
setTimeout(() => id('logoutBtn')?.addEventListener('click', logout), 1000);

$.editDeleteAccountBtn?.addEventListener('click', () => $.deleteModal.classList.remove('hidden'));
$.cancelDeleteBtn?.addEventListener('click', () => $.deleteModal.classList.add('hidden'));
$.confirmDeleteBtn?.addEventListener('click', async () => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid));
    await deleteUser(auth.currentUser);
    $.deleteModal.classList.add('hidden');
  } catch { alert('Error deleting account'); }
});

// Bio/Review
$.saveBioBtn?.addEventListener('click', async () => {
  if (auth.currentUser && $.bioTextarea) {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { bio: $.bioTextarea.value });
    alert('Bio saved');
  }
});
$.submitReviewBtn?.addEventListener('click', () => alert('Review submitted (demo)'));

// Search controls
let sliderTimeout;
$.radiusSlider?.addEventListener('input', (e) => {
  state.aktuellerRadius = parseInt(e.target.value);
  $.radiusValue.textContent = state.aktuellerRadius;
  clearTimeout(sliderTimeout);
  sliderTimeout = setTimeout(async () => { if (state.map) await updateMapAndList(); }, 150);
});
$.skillSearch?.addEventListener('input', async (e) => { state.aktuellesSuchwort = e.target.value; if (state.map) await updateMapAndList(); });

// Chat controls
$.sendMessageBtn?.addEventListener('click', sendMessage);
$.messageInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
$.backToConversations?.addEventListener('click', () => {
  $.chatView.classList.add('hidden');
  $.mainApp.classList.remove('hidden');
  $.messagesTab.classList.remove('hidden');
  if (state.unsubscribeMessages) state.unsubscribeMessages();
});

// Keyboard dismiss
document.addEventListener('touchstart', (e) => {
  if (!$.chatView.classList.contains('hidden') && e.target !== $.messageInput && e.target !== $.sendMessageBtn) $.messageInput.blur();
}, { passive: true });

// Chat modal
$.cancelStartChatBtn?.addEventListener('click', () => { $.startChatModal.classList.add('hidden'); state.pendingChatUserId = null; });
$.confirmStartChatBtn?.addEventListener('click', startChat);

// Infinite scroll
new IntersectionObserver((e) => { if (e[0].isIntersecting && !state.loadingMore) loadProviders(); }, { threshold: 0.1 }).observe(id('sentinel'));

// ==================== ADMIN ====================
async function loadPendingSkills() {
  if (!state.currentUser || state.currentUser.email !== 'agboghidiaugust@gmail.com') return;
  $.adminTab.innerHTML = '<div style="padding:20px"><h2>Pending Services</h2><div id="pendingList"></div></div>';
  
  const html = [];
  (await getDocs(collection(db, 'users'))).forEach(d => {
    const data = d.data();
    if (data.pendingSkills?.length) {
      html.push(`<div style="background:#f0f0f0;margin:10px;padding:10px;border-radius:10px"><h3>${data.businessName}</h3>`);
      data.pendingSkills.forEach(s => {
        html.push(`<div style="margin:5px 0"><span style="background:#ffd700;padding:5px">${s}</span>
          <button onclick="approveSkill('${d.id}','${s}')" style="background:green;color:white;margin:5px">✓ Approve</button>
          <button onclick="editSkill('${d.id}','${s}')" style="background:blue;color:white;margin:5px">✎ Edit</button></div>`);
      });
      html.push('</div>');
    }
  });
  id('pendingList').innerHTML = html.length ? html.join('') : '<p>No pending services</p>';
}

window.approveSkill = async (userId, skill) => {
  const ref = doc(db, 'users', userId);
  const data = (await getDoc(ref)).data();
  await updateDoc(ref, { pendingSkills: data.pendingSkills.filter(s => s !== skill), skills: [...(data.skills||[]), skill] });
  
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', state.currentUser.uid));
    let chatId = null;
    (await getDocs(q)).forEach(d => { if (d.data().participants.includes(userId)) chatId = d.id; });
    if (!chatId) chatId = (await addDoc(collection(db, 'chats'), {
      participants: [state.currentUser.uid, userId], createdAt: Timestamp.now(),
      lastMessage: `Your service "${skill}" was approved!`, lastMessageTimestamp: Timestamp.now(), lastMessageSender: state.currentUser.uid
    })).id;
    await addDoc(collection(db, 'messages'), { chatId, senderId: state.currentUser.uid, text: `✅ Your service "${skill}" has been approved!`, timestamp: Timestamp.now(), read: false });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: `✅ Your service "${skill}" was approved`, lastMessageTimestamp: Timestamp.now(), lastMessageSender: state.currentUser.uid });
  } catch (err) { console.error(err); }
  
  alert(`Service "${skill}" approved!`);
  loadPendingSkills();
};

window.editSkill = async (userId, old) => {
  const newSkill = prompt('Edit service:', old);
  if (!newSkill) return;
  const ref = doc(db, 'users', userId);
  const data = (await getDoc(ref)).data();
  await updateDoc(ref, { pendingSkills: data.pendingSkills.map(s => s === old ? newSkill : s) });
  
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', state.currentUser.uid));
    let chatId = null;
    (await getDocs(q)).forEach(d => { if (d.data().participants.includes(userId)) chatId = d.id; });
    if (!chatId) chatId = (await addDoc(collection(db, 'chats'), {
      participants: [state.currentUser.uid, userId], createdAt: Timestamp.now(),
      lastMessage: `Your service suggestion was updated`, lastMessageTimestamp: Timestamp.now(), lastMessageSender: state.currentUser.uid
    })).id;
    await addDoc(collection(db, 'messages'), { chatId, senderId: state.currentUser.uid, text: `✏️ Your service "${old}" updated to "${newSkill}"`, timestamp: Timestamp.now(), read: false });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: `✏️ Your service was updated to "${newSkill}"`, lastMessageTimestamp: Timestamp.now(), lastMessageSender: state.currentUser.uid });
  } catch (err) { console.error(err); }
  
  alert(`Service updated!`);
  loadPendingSkills();
};

// ==================== AUTH STATE ====================
onAuthStateChanged(auth, async (user) => {
  state.currentUser = user;
  if (user && user.emailVerified) {
    $.adminTabBtn.style.display = user.email === 'agboghidiaugust@gmail.com' ? 'flex' : 'none';
    $.authContainer.classList.add('hidden');
    $.mainApp.classList.remove('hidden');
    switchTab(getSavedTab());
    await loadProfileData();
    setTimeout(initPullToRefresh, 500);
    setTimeout(initProfilePullToRefresh, 1000);
  } else if (user && !user.emailVerified) {
    $.authContainer.classList.remove('hidden');
    $.mainApp.classList.add('hidden');
    $.emailSignupView.classList.add('hidden');
    $.phoneSignupView.classList.add('hidden');
    $.loginView.classList.add('hidden');
    $.verifyView.classList.remove('hidden');
  } else {
    $.authContainer.classList.remove('hidden');
    $.mainApp.classList.add('hidden');
    $.emailSignupView.classList.remove('hidden');
    $.phoneSignupView.classList.add('hidden');
    $.loginView.classList.add('hidden');
    $.verifyView.classList.add('hidden');
  }
});

// ==================== EDIT PROFILE ====================
$.editProfileBtn?.addEventListener('click', () => {
  loadEditProfileData();
  $.profileTab.classList.add('hidden');
  $.editProfileScreen.classList.remove('hidden');
});

$.backFromEditBtn?.addEventListener('click', () => {
  $.editProfileScreen.classList.add('hidden');
  $.profileTab.classList.remove('hidden');
});

async function loadEditProfileData() {
  if (!state.currentUser) return;
  const data = (await getDoc(doc(db, 'users', state.currentUser.uid))).data();
  $.editProfileImage.src = getThumbnailUrl(data.profileImage, 200);
  $.editBusinessName.value = data.businessName || '';
  $.editUsername.value = data.username || '';
  $.editBio.value = data.bio || '';
  $.editPhone.value = data.phoneNumber || '';
  $.editAddress.value = data.address || '';
  renderSkills(data.skills || []);
  checkNameTimers(data);
}

function renderSkills(skills) {
  $.editSkillsContainer.innerHTML = '';
  skills.forEach(s => {
    const tag = document.createElement('span');
    tag.style.cssText = 'display:inline-flex;align-items:center;background:#f0f3f8;padding:8px 12px;border-radius:40px;font-size:14px';
    tag.innerHTML = `${s}<span style="margin-left:8px;cursor:pointer;color:#dc2626;font-weight:bold" onclick="removeSkill('${s}')">×</span>`;
    $.editSkillsContainer.appendChild(tag);
  });
}

window.removeSkill = async (skill) => {
  if (!state.currentUser) return;
  const ref = doc(db, 'users', state.currentUser.uid);
  const data = (await getDoc(ref)).data();
  const updated = (data.skills || []).filter(s => s !== skill);
  await updateDoc(ref, { skills: updated });
  renderSkills(updated);
};

$.addSkillBtn?.addEventListener('click', async () => {
  const newSkill = $.newSkillInput.value.trim();
  if (!newSkill || !state.currentUser) return;
  const ref = doc(db, 'users', state.currentUser.uid);
  const data = (await getDoc(ref)).data();
  const updated = [...(data.skills || []), newSkill];
  await updateDoc(ref, { skills: updated });
  renderSkills(updated);
  $.newSkillInput.value = '';
});

function checkNameTimers(data) {
  const now = Date.now();
  const days = 14 * 24 * 60 * 60 * 1000;
  if (data.businessNameLastChanged) {
    const left = Math.ceil((data.businessNameLastChanged + days - now) / (24*60*60*1000));
    $.businessNameTimer.textContent = left > 0 ? `Can change again in ${left} days` : '';
    $.editBusinessName.disabled = left > 0;
  }
  if (data.usernameLastChanged) {
    const left = Math.ceil((data.usernameLastChanged + days - now) / (24*60*60*1000));
    $.usernameTimer.textContent = left > 0 ? `Can change again in ${left} days` : '';
    $.editUsername.disabled = left > 0;
  }
}

$.saveEditProfileBtn?.addEventListener('click', async () => {
  if (!state.currentUser) return;
  const ref = doc(db, 'users', state.currentUser.uid);
  const data = (await getDoc(ref)).data();
  const updates = {};
  const now = Date.now();
  const days = 14 * 24 * 60 * 60 * 1000;
  
  if ($.editBusinessName.value !== data.businessName) {
    if (!data.businessNameLastChanged || now - data.businessNameLastChanged > days) {
      updates.businessName = $.editBusinessName.value;
      updates.businessNameLastChanged = now;
    } else alert('Business name can only be changed every 14 days');
  }
  if ($.editUsername.value !== data.username) {
    if (!data.usernameLastChanged || now - data.usernameLastChanged > days) {
      updates.username = $.editUsername.value;
      updates.usernameLastChanged = now;
    } else alert('Username can only be changed every 14 days');
  }
  
  updates.bio = $.editBio.value;
  updates.phoneNumber = $.editPhone.value;
  updates.address = $.editAddress.value;
  
  await updateDoc(ref, updates);
  await loadProfileData();
  $.editProfileScreen.classList.add('hidden');
  $.profileTab.classList.remove('hidden');
  alert('Profile updated!');
});
