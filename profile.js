// profile.js - Profile display, editing, reviews, and saved profiles

// Global profile state
let profilePreviousScreen = null;
let currentPortfolioImages = [];

function loadProfileTab(profileUserId = null, hideTabBar = false) {
    if (hideTabBar) {
        const tabBar = document.querySelector('.tab-bar');
        if (tabBar) tabBar.style.display = 'none';
    } else {
        const tabBar = document.querySelector('.tab-bar');
        if (tabBar) tabBar.style.display = 'flex';
        window.currentTab = 'profile';
    }
    
    const container = document.getElementById('tab-content');
    if (!container) return;
    
    const targetUserId = profileUserId || firebase.auth().currentUser.uid;
    const isOwnProfile = targetUserId === firebase.auth().currentUser.uid;
    
    try {
        const profileDoc = await firebase.firestore().collection('users').doc(targetUserId).get();
        if (!profileDoc.exists) {
            container.innerHTML = '<div class="error-state">Profile not found</div>';
            return;
        }
        
        const profile = profileDoc.data();
        profile.id = targetUserId;
        
        let savedCount = 0;
        let savesCount = 0;
        
        if (isOwnProfile) {
            savedCount = Object.keys(profile.savedProfiles || {}).length;
            const savesSnapshot = await firebase.firestore()
                .collection('users')
                .where(`savedProfiles.${targetUserId}`, '==', true)
                .get();
            savesCount = savesSnapshot.size;
        } else {
            const currentUserDoc = await firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get();
            savesCount = Object.keys(currentUserDoc.data()?.savedProfiles || {}).length;
            const savesSnapshot = await firebase.firestore()
                .collection('users')
                .where(`savedProfiles.${targetUserId}`, '==', true)
                .get();
            savedCount = savesSnapshot.size;
        }
        
        container.innerHTML = `
<div class="profile-container">
    <div class="profile-fixed-header">
        ${hideTabBar ? '<button class="back-btn" onclick="goBack()" style="position:absolute; top:20px; left:20px; font-size:24px; background:none; border:none; z-index:10; cursor:pointer;">←</button>' : ''}
        <div class="profile-stats-row">
            <div class="profile-picture">
                <img src="${profile.profileImage ? profile.profileImage + '?tr=w-80,h-80,format-webp' : 'https://via.placeholder.com/80'}" alt="${profile.businessName}">
                ${isOwnProfile ? '<div class="camera-icon" onclick="openImageUpload()">📷</div>' : ''}
            </div>
            <div class="profile-info-right">
                <h1 class="profile-business-name">${profile.businessName || 'Business Name'}</h1>
                <div class="stats-grid">
                    <div class="stat-item"><span class="stat-number">${profile.jobsDone || 0}</span><span class="stat-label">Gigs</span></div>
                    <div class="stat-item clickable" onclick="showProviderReviews('${profile.id}')"><span class="stat-number">${profile.rating || 0}</span><span class="stat-label">★ Rating</span></div>
                    ${isOwnProfile ? `<div class="stat-item clickable" onclick="openSavedModal()"><span class="stat-number">${savedCount}</span><span class="stat-label">Saved</span></div>` : ''}
                    <div class="stat-item ${isOwnProfile ? 'clickable' : ''}" onclick="${isOwnProfile ? 'openSavesModal()' : ''}"><span class="stat-number">${savesCount}</span><span class="stat-label">Saves</span></div>
                </div>
            </div>
        </div>
        ${isOwnProfile ? `<div class="profile-actions-header"><button class="register-job-btn" onclick="showRegisterJobModal()">Register Gig (3 pts)</button></div>` : ''}
        <div class="profile-meta">Joined ${profile.createdAt ? new Date(profile.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'} • ${profile.jobsThisMonth || 0} gigs this month</div>
    </div>
    <div class="profile-scrollable">
        <div class="profile-bio">${profile.bio || 'No bio yet.'}</div>
        ${profile.phoneNumber ? `<div class="profile-contact"><span class="contact-icon">📞</span><span class="contact-text">${profile.phoneNumber}</span></div>` : ''}
        ${profile.locationGeo ? `<div class="profile-contact ${!isOwnProfile ? 'clickable-location' : ''}" ${!isOwnProfile ? `onclick="getDirectionsToProvider('${profile.id}')"` : ''}><span class="contact-icon">📍</span><span class="contact-text">${profile.locationDescription || `${profile.locationGeo.latitude}, ${profile.locationGeo.longitude}`}</span></div>` : ''}
        <div class="profile-section"><h3 class="section-title">Services</h3><div class="services-horizontal">${(profile.services || []).map(service => `<span class="service-pill-static">${service}</span>`).join('')}${(profile.pendingServices || []).map(service => `<span class="service-pill-static pending">${service} (pending)</span>`).join('')}</div></div>
        <div class="profile-actions">${isOwnProfile ? `<button class="btn" onclick="openEditProfile()">Edit Profile</button><button class="btn btn-outline" onclick="shareProfile()">Share</button>` : `<button class="btn" onclick="messageUser('${profile.id}', 'profile')">Message</button><button class="btn" onclick="toggleSaveProfile('${profile.id}')" id="save-btn-${profile.id}">Save</button><button class="btn btn-outline" onclick="shareProfile('${profile.id}')">Share</button></div>`}
        <div class="profile-section"><div class="section-header"><h3 class="section-title">Portfolio ${profile.portfolioImages?.length ? `(${profile.portfolioImages.length})` : ''}</h3>${isOwnProfile ? '<button class="btn-small" onclick="addPortfolioImages()">+ Add</button>' : ''}</div><div class="portfolio-grid">${(profile.portfolioImages || []).map((img, index) => `<div class="portfolio-item" onclick="openPhotoSwipe(${index})"><img src="${img}?tr=w-150,h-150,format-webp" loading="lazy">${isOwnProfile ? '<div class="delete-overlay" onclick="deleteImage(event, \'' + img + '\')">✕</div>' : ''}</div>`).join('')}${!profile.portfolioImages?.length ? '<p class="empty-portfolio">No portfolio images yet</p>' : ''}</div></div>
    </div>
</div>
`;
        
        container.style.display = 'none';
        container.offsetHeight;
        container.style.display = '';
        
        if (isOwnProfile) {
            setupOwnProfileListeners(profile);
        } else {
            setupOtherProfileListeners(profile);
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        container.innerHTML = '<div class="error-state">Error loading profile</div>';
    }
}

function setupOwnProfileListeners(profile) {
    // Placeholder for own profile listeners
}

function setupOtherProfileListeners(profile) {
    checkIfSaved(profile.id);
}

window.toggleSaveProfile = async function(profileId) {
    const currentUserId = firebase.auth().currentUser.uid;
    if (currentUserId === profileId) {
        alert('You cannot save your own profile');
        return;
    }
    
    const saveBtn = document.getElementById(`save-btn-${profileId}`);
    const isSaved = saveBtn.textContent === 'Saved';
    const currentUserName = currentUserData?.businessName || 'Someone';
    
    try {
        const userRef = firebase.firestore().collection('users').doc(currentUserId);
        const userDoc = await userRef.get();
        const currentSaved = userDoc.data()?.savedProfiles || {};
        
        if (isSaved) {
            delete currentSaved[profileId];
            await userRef.update({
                savedProfiles: currentSaved
            });
            saveBtn.textContent = 'Save';
            saveBtn.classList.remove('saved');
        } else {
            currentSaved[profileId] = true;
            await userRef.update({
                savedProfiles: currentSaved
            });
            saveBtn.textContent = 'Saved';
            saveBtn.classList.add('saved');
            
            try {
                const targetUserDoc = await firebase.firestore().collection('users').doc(profileId).get();
                const targetToken = targetUserDoc.data()?.fcmToken;
                
                if (targetToken) {
                    const workerUrl = 'https://gigscourtnotification.agboghidiaugust.workers.dev';
                    await fetch(workerUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientToken: targetToken,
                            title: 'Someone Saved Your Profile',
                            body: `${currentUserName} saved your profile`,
                            chatId: ''
                        })
                    });
                }
            } catch (notifyError) {
                console.log('Failed to send profile save notification:', notifyError);
            }
        }
        
        loadProfileTab(profileId, true);
        
    } catch (error) {
        console.error('Error toggling save:', error);
        alert('Failed to save/unsave profile');
    }
};

async function checkIfSaved(profileId) {
    const currentUserId = firebase.auth().currentUser.uid;
    if (currentUserId === profileId) return;
    
    const btn = document.getElementById(`save-btn-${profileId}`);
    if (!btn) return;
    
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUserId).get();
        const savedProfiles = userDoc.data()?.savedProfiles || {};
        
        if (savedProfiles[profileId]) {
            btn.textContent = 'Saved';
            btn.classList.add('saved');
        } else {
            btn.textContent = 'Save';
            btn.classList.remove('saved');
        }
    } catch (error) {
        console.error('Error checking save status:', error);
    }
}

window.openSavedModal = async function() {
    const currentUserId = firebase.auth().currentUser.uid;
    
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUserId).get();
        const savedProfiles = userDoc.data()?.savedProfiles || {};
        const savedUserIds = Object.keys(savedProfiles);
        
        if (savedUserIds.length === 0) {
            alert('You haven\'t saved any profiles yet');
            return;
        }
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-container';
        
        let html = `
            <div class="modal-header">
                <h2>Saved Profiles</h2>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-list">
        `;
        
        for (const userId of savedUserIds) {
            const userDoc = await firebase.firestore().collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                html += `
                    <div class="modal-item" onclick="viewProfileFromModal('${userId}')">
                        <img src="${userData.profileImage ? userData.profileImage + '?tr=w-50,h-50' : 'https://via.placeholder.com/50'}" class="modal-item-image">
                        <div class="modal-item-info">
                            <div class="modal-item-name">${userData.businessName || 'Business Name'}</div>
                            <div class="modal-item-rating">⭐ ${userData.rating || '0.0'}</div>
                        </div>
                        <button class="modal-unsave-btn" onclick="unsaveProfile(event, '${userId}')">Unsave</button>
                    </div>
                `;
            }
        }
        
        html += `</div>`;
        modalContent.innerHTML = html;
        document.body.appendChild(modalContent);
        
    } catch (error) {
        console.error('Error opening saved modal:', error);
        alert('Failed to load saved profiles');
    }
};

window.openSavesModal = async function() {
    const currentUserId = firebase.auth().currentUser.uid;
    
    try {
        const savesSnapshot = await firebase.firestore()
            .collection('users')
            .where(`savedProfiles.${currentUserId}`, '==', true)
            .get();
        
        if (savesSnapshot.empty) {
            alert('No one has saved your profile yet');
            return;
        }
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-container';
        
        let html = `
            <div class="modal-header">
                <h2>People who saved you</h2>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-list">
        `;
        
        for (const doc of savesSnapshot.docs) {
            const userData = doc.data();
            html += `
                <div class="modal-item" onclick="viewProfileFromModal('${doc.id}')">
                    <img src="${userData.profileImage ? userData.profileImage + '?tr=w-50,h-50' : 'https://via.placeholder.com/50'}" class="modal-item-image">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${userData.businessName || 'Business Name'}</div>
                        <div class="modal-item-rating">⭐ ${userData.rating || '0.0'}</div>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        modalContent.innerHTML = html;
        document.body.appendChild(modalContent);
        
    } catch (error) {
        console.error('Error opening saves modal:', error);
        alert('Failed to load saves');
    }
};

window.unsaveProfile = async function(event, savedUserId) {
    event.stopPropagation();
    
    const currentUserId = firebase.auth().currentUser.uid;
    
    try {
        const userRef = firebase.firestore().collection('users').doc(currentUserId);
        const userDoc = await userRef.get();
        const savedProfiles = userDoc.data()?.savedProfiles || {};
        
        delete savedProfiles[savedUserId];
        await userRef.update({ savedProfiles: savedProfiles });
        
        closeModal();
        window.openSavedModal();
        
        if (document.querySelector('.profile-container')) {
            loadProfileTab(currentUserId, true);
        }
        
    } catch (error) {
        console.error('Error unsaving:', error);
        alert('Failed to unsave profile');
    }
};

window.closeModal = function() {
    const modal = document.querySelector('.modal-container');
    if (modal) modal.remove();
};

window.viewProfileFromModal = function(userId) {
    profilePreviousScreen = 'saved';
    closeModal();
    switchTab('profile');
    loadProfileTab(userId, true);
};

window.shareProfile = async function(profileId) {
    const targetId = profileId || firebase.auth().currentUser.uid;
    
    const profileDoc = await firebase.firestore().collection('users').doc(targetId).get();
    if (!profileDoc.exists) return;
    
    const profile = profileDoc.data();
    const businessName = profile.businessName || 'GigsCourt Profile';
    const bio = profile.bio ? profile.bio.substring(0, 100) : 'Check out my profile on GigsCourt';
    const profileUrl = `${window.location.origin}/user/${targetId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: businessName,
                text: bio,
                url: profileUrl
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyProfileLink(profileUrl);
            }
        }
    } else {
        copyProfileLink(profileUrl);
    }
};

async function copyProfileLink(url) {
    try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
    } catch (err) {
        alert('Could not copy link. Please copy manually: ' + url);
    }
}

window.openPhotoSwipe = function(index) {
    if (window.currentPortfolioImages && window.currentPortfolioImages.length > 0) {
        const images = window.currentPortfolioImages.map((imgUrl, i) => ({
            href: imgUrl,
            title: `Portfolio image ${i + 1}`,
            type: 'image'
        }));
        
        const lightbox = GLightbox({
            elements: images,
            startAt: index,
            loop: true,
            touchNavigation: true,
            autoplayVideos: false,
            closeButton: true,
            closeOnOutsideClick: true,
            zoomable: true,
            draggable: true,
            slideEffect: 'fade',
            openEffect: 'fade',
            closeEffect: 'fade',
            onOpen: function() {
                document.body.style.overflow = 'hidden';
            },
            onClose: function() {
                document.body.style.overflow = '';
            }
        });
        
        lightbox.open();
        return;
    }
    
    const portfolioItems = document.querySelectorAll('.portfolio-item img');
    const images = [];
    
    portfolioItems.forEach((img, i) => {
        let imgUrl = img.src;
        if (imgUrl.includes('?tr=')) {
            imgUrl = imgUrl.split('?tr=')[0];
        }
        images.push({
            href: imgUrl,
            title: `Portfolio image ${i + 1}`,
            type: 'image'
        });
    });
    
    if (images.length === 0) return;
    
    const lightbox = GLightbox({
        elements: images,
        startAt: index,
        loop: true,
        touchNavigation: true,
        autoplayVideos: false,
        closeButton: true,
        closeOnOutsideClick: true,
        zoomable: true,
        draggable: true,
        slideEffect: 'fade',
        openEffect: 'fade',
        closeEffect: 'fade',
        onOpen: function() {
            document.body.style.overflow = 'hidden';
        },
        onClose: function() {
            document.body.style.overflow = '';
        }
    });
    
    lightbox.open();
};

window.goBack = function() {
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
        tabBar.style.display = 'flex';
    }
    
    if (profilePreviousScreen === 'chat') {
        loadMessagesTab();
        setTimeout(() => {
            if (currentChatId) {
                openChat(currentChatId, null, {});
            }
        }, 100);
    } else if (profilePreviousScreen === 'saved') {
        openSavedModal();
    } else if (profilePreviousScreen === 'home') {
        switchTab('home');
    } else if (profilePreviousScreen === 'search') {
        switchTab('search');
    } else {
        window.history.back();
    }
    
    profilePreviousScreen = null;
};

window.viewProfile = (id, fromScreen = 'home') => {
    profilePreviousScreen = fromScreen;
    switchTab('profile');
    loadProfileTab(id, true);
};
