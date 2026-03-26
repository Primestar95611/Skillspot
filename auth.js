// auth.js - Authentication and user state

// Global state variables
let currentUser = null;
let currentUserData = null;

// Setup push notifications with FCM
async function setupNotifications(userId) {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            
            const token = await messaging.getToken({
                vapidKey: "BJRlkPoQeveLqWzxp3CxzpkO4__sXqaCaA8loG9KCpN0z7rlh8aYr3d_tav7LB0Ra3LG50m0EUyVokh66p_9TO4",
                serviceWorkerRegistration: registration
            });
            
            if (token) {
                alert('✅ Token received! Check Firestore.');
                const toast = document.createElement('div');
                toast.textContent = '✅ Notifications enabled!';
                toast.style.cssText = 'position:fixed;bottom:100px;left:20px;right:20px;background:#4CAF50;color:white;padding:12px;text-align:center;border-radius:8px;z-index:9999;';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
                
                await firebase.firestore().collection('users').doc(userId).update({
                    fcmToken: token
                });
                console.log('FCM token saved:', token);
            } else {
                alert('❌ No token received');
                const toast = document.createElement('div');
                toast.textContent = '❌ Could not get notification token';
                toast.style.cssText = 'position:fixed;bottom:100px;left:20px;right:20px;background:#FF0000;color:white;padding:12px;text-align:center;border-radius:8px;z-index:9999;';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }
        }
    } catch (error) {
        console.log('Notification setup failed:', error);
        alert('Error: ' + error.message);
    }
}

// Auth state listener
firebase.auth().onAuthStateChanged(async (user) => {
    currentUser = user;
    const app = document.getElementById('app');
    
    if (user) {
        if (user.emailVerified) {
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    loadMainApp();
                } else {
                    window.location.hash = 'complete-profile';
                    loadProfileCompletion();
                }
            } catch (error) {
                console.error('Error fetching user document:', error);
                alert('Error loading your profile. Please try again.');
                firebase.auth().signOut();
            }
        } else {
            loadVerification();
        }
    } else {
        loadAuthScreen();
    }
});

function loadProfileCompletion() {
    document.getElementById('app').innerHTML = `
        <div class="profile-completion-container">
            <div class="completion-header">
                <h1>Complete Your Profile</h1>
                <p>We noticed your profile needs setup</p>
            </div>
            
            <div class="completion-form">
                <div class="form-group">
                    <label>Business Name</label>
                    <input type="text" id="complete-business" value="${firebase.auth().currentUser?.displayName || ''}" placeholder="Your business name">
                </div>
                
                <div class="form-group">
                    <label>Services Offered</label>
                    <div class="service-presets">
                        <button type="button" class="service-pill" onclick="toggleService('Barber')">Barber</button>
                        <button type="button" class="service-pill" onclick="toggleService('Tech')">Tech</button>
                        <button type="button" class="service-pill" onclick="toggleService('Design')">Design</button>
                        <button type="button" class="service-pill" onclick="toggleService('Marketing')">Marketing</button>
                    </div>
                    
                    <div id="selected-services" class="selected-services"></div>
                </div>
                
                <div class="form-group">
                    <label>Bio (optional)</label>
                    <textarea id="complete-bio" rows="3" placeholder="Tell customers about yourself"></textarea>
                </div>
                
                <button class="btn btn-full" onclick="saveProfile()">Save Profile</button>
                <button class="btn btn-outline btn-full" onclick="firebase.auth().signOut()">Sign Out</button>
            </div>
        </div>
    `;
}

window.saveProfile = async function() {
    const businessName = document.getElementById('complete-business').value;
    const bio = document.getElementById('complete-bio').value;
    
    if (!businessName) {
        alert('Business name is required');
        return;
    }
    
    try {
        await firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).set({
            businessName: businessName,
            email: firebase.auth().currentUser.email,
            services: window.selectedServices || [],
            pendingServices: [],
            bio: bio,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: true,
            phoneVerified: false,
            signupMethod: 'email',
            rating: 0,
            reviewCount: 0,
            jobsDone: 0,
            profileImage: '',
            portfolioImages: [],
            location: null,
            locationGeo: null,
            savedProfiles: {}
        });
        
        loadMainApp();
    } catch (error) {
        alert('Error saving profile: ' + error.message);
    }
};

// ========== AUTH SCREENS ==========
function loadAuthScreen() {
    document.getElementById('app').innerHTML = `
        <div class="auth-container">
            <div class="auth-header">
                <h1>GigsCourt</h1>
                <p>Find local services, instantly</p>
            </div>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="showLogin()">Login</button>
                <button class="auth-tab" onclick="showSignup()">Sign Up</button>
            </div>
            
            <div id="auth-content"></div>
        </div>
    `;
    showLogin();
}

function loadVerification() {
    document.getElementById('app').innerHTML = `
        <div class="verification-container">
            <div class="verification-icon">✉️</div>
            <h2>Verify your email</h2>
            <p>We sent a verification link to:</p>
            <p class="email">${firebase.auth().currentUser?.email}</p>
            <p class="small">Click the link in the email to verify your account</p>
            
            <button class="btn" onclick="checkVerification()">I've verified</button>
            <button class="btn btn-outline" onclick="resendVerification()">Resend email</button>
            <button class="btn btn-outline" onclick="firebase.auth().signOut()">Back to login</button>
        </div>
    `;
}

window.showLogin = function() {
    const content = document.getElementById('auth-content');
    if (!content) return;
    
    content.innerHTML = `
        <form id="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="login-email" required placeholder="your@email.com">
            </div>
            
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="login-password" required placeholder="••••••••">
            </div>
            
            <button type="submit" class="btn btn-full">Login</button>
        </form>
        
        <div class="auth-divider">
            <span>or</span>
        </div>
        
        <button class="btn btn-outline btn-full" onclick="alert('Phone signup coming soon!')">
            Continue with Phone (Coming Soon)
        </button>
    `;
    
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[onclick="showLogin()"]').classList.add('active');
};

window.showSignup = function() {
    const content = document.getElementById('auth-content');
    if (!content) return;
    
    content.innerHTML = `
        <form id="signup-form" onsubmit="handleSignup(event)">
            <div class="form-group">
                <label>Business Name</label>
                <input type="text" id="signup-business" required placeholder="Your business name">
            </div>
            
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="signup-email" required placeholder="your@email.com">
            </div>
            
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="signup-password" required placeholder="At least 6 characters">
                <small class="hint">Minimum 6 characters</small>
            </div>
            
            <div class="form-group">
                <label>Services Offered</label>
                <div class="service-presets">
                    <button type="button" class="service-pill" onclick="toggleService('Barber')">Barber</button>
                    <button type="button" class="service-pill" onclick="toggleService('Tech')">Tech</button>
                    <button type="button" class="service-pill" onclick="toggleService('Design')">Design</button>
                    <button type="button" class="service-pill" onclick="toggleService('Marketing')">Marketing</button>
                </div>
                
                <div class="form-group" style="margin-top: 15px;">
                    <label>Or add custom services (separate with commas)</label>
                    <input type="text" id="custom-services" placeholder="e.g., Photography, Consulting">
                </div>
                
                <div id="selected-services" class="selected-services"></div>
                <input type="hidden" id="services-input">
            </div>
            
            <button type="submit" class="btn btn-full">Sign Up</button>
        </form>
        
        <p class="terms-text">
            By signing up, you agree to our Terms of Service
        </p>
    `;
    
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[onclick="showSignup()"]').classList.add('active');
};

window.selectedServices = [];

window.toggleService = function(service) {
    const index = window.selectedServices.indexOf(service);
    if (index === -1) {
        window.selectedServices.push(service);
    } else {
        window.selectedServices.splice(index, 1);
    }
    
    const container = document.getElementById('selected-services');
    if (container) {
        container.innerHTML = window.selectedServices.map(s => 
            `<span class="service-tag">${s}</span>`
        ).join('');
    }
    
    document.querySelectorAll('.service-pill').forEach(btn => {
        if (window.selectedServices.includes(btn.textContent)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

window.handleLogin = async function(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
};

window.handleSignup = async function(event) {
    event.preventDefault();
    
    const businessName = document.getElementById('signup-business').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const customServices = document.getElementById('custom-services').value;
    
    let services = [...window.selectedServices];
    
    if (customServices.trim()) {
        const customList = customServices.split(',').map(s => s.trim()).filter(s => s);
        services = [...services, ...customList];
    }
    
    services = [...new Set(services)];
    
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.sendEmailVerification();
        
        await firebase.firestore().collection('users').doc(user.uid).set({
            businessName: businessName,
            email: email,
            services: services.filter(s => ['Barber', 'Tech', 'Design', 'Marketing'].includes(s)),
            pendingServices: services.filter(s => !['Barber', 'Tech', 'Design', 'Marketing'].includes(s)),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false,
            phoneVerified: false,
            signupMethod: 'email',
            rating: 0,
            reviewCount: 0,
            jobsDone: 0,
            profileImage: '',
            portfolioImages: [],
            bio: '',
            locationGeo: null,
            points: 15,
            jobsThisMonth: 0,
            savedProfiles: {}
        });
        
        alert('Account created! Please check your email for verification.');
        
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
};

window.checkVerification = function() {
    firebase.auth().currentUser?.reload().then(() => {
        if (firebase.auth().currentUser?.emailVerified) {
            loadMainApp();
        } else {
            alert('Email not verified yet.');
        }
    });
};

window.resendVerification = function() {
    firebase.auth().currentUser?.sendEmailVerification()
        .then(() => alert('Verification email sent!'))
        .catch(error => alert('Error: ' + error.message));
};

window.logout = function() {
    searchCache = null;
    searchCacheTime = null;
    searchProviders = [];
    searchLastDoc = null;
    searchHasMore = true;
    firebase.auth().signOut();
};

window.deleteAccount = function() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        const user = firebase.auth().currentUser;
        user.delete().catch(error => {
            alert('Error: ' + error.message);
        });
    }
}
