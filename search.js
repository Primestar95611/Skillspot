// search.js - Map search and provider discovery

// Global search state
let map = null;
let userMarker = null;
let providerMarkers = [];
let routingControl = null;
let searchProviders = [];
let radiusCircle = null;
let currentRadius = 10;
let searchLastDoc = null;
let searchHasMore = true;
let searchLoading = false;
let searchCache = null;
let searchCacheTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let userLocation = null;

function loadSearchTab() {
    const container = document.getElementById('tab-content');
    if (!container) return;
    
    container.innerHTML = `
<div class="search-container">
    <div class="search-controls">
        <div class="search-input-container">
            <input type="text" id="search-input" class="search-input" placeholder="Search by service...">
        </div>
        
        <div class="radius-control">
            <span class="radius-icon">📍</span>
            <span class="radius-value" id="radius-value">${currentRadius} km</span>
            <input type="range" id="radius-slider" class="radius-slider" min="1" max="200" value="${currentRadius}" step="1">
        </div>
    </div>
    
    <div id="search-map" class="search-map"></div>
    
    <div class="provider-drawer">
        <div class="drawer-handle"></div>
        <div id="provider-list" class="provider-list"></div>
        <div id="drawer-loading" class="drawer-loading hidden">
            <div class="spinner-small"></div>
        </div>
    </div>
</div>
`;
    window.currentTab = 'search';
    
    getUserLocation();
    setupSearchListeners();
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                localStorage.setItem('userLocation', JSON.stringify(userLocation));
                initializeMap();
                loadNearbyProviders(true);
            },
            (error) => {
                console.error('Geolocation error:', error);
                const savedLocation = localStorage.getItem('userLocation');
                if (savedLocation) {
                    userLocation = JSON.parse(savedLocation);
                } else {
                    userLocation = { lat: 6.5244, lng: 3.3792 };
                }
                initializeMap();
                loadNearbyProviders(true);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            userLocation = JSON.parse(savedLocation);
        } else {
            userLocation = { lat: 6.5244, lng: 3.3792 };
        }
        initializeMap();
        loadNearbyProviders(true);
    }
}

function initializeMap() {
    setTimeout(() => {
        const mapContainer = document.getElementById('search-map');
        if (!mapContainer) return;
        
        if (map) {
            map.remove();
            map = null;
        }
        
        map = L.map('search-map', {
            center: [userLocation.lat, userLocation.lng],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        
        userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        
        updateRadiusCircle();
        
        map.on('moveend', onMapMoved);
        
    }, 300);
}

function updateRadiusCircle() {
    if (!map || !userLocation) return;
    
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    
    radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: currentRadius * 1000,
        color: '#000000',
        weight: 1,
        fillColor: '#000000',
        fillOpacity: 0.1,
        lineCap: 'round'
    }).addTo(map);
    
    map.fitBounds(radiusCircle.getBounds(), { padding: [20, 20] });
}

async function loadNearbyProviders(reset = true) {
    if (!userLocation) return;
    if (searchLoading) return;
    
    const listContainer = document.getElementById('provider-list');
    const loadingEl = document.getElementById('drawer-loading');
    
    if (reset) {
        searchProviders = [];
        searchLastDoc = null;
        searchHasMore = true;
        document.getElementById('provider-list').innerHTML = '';
    }
    
    if (!searchHasMore) {
        if (loadingEl) loadingEl.classList.add('hidden');
        return;
    }
    
    searchLoading = true;
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    try {
        if (reset && searchCache && searchCacheTime) {
            const now = new Date().getTime();
            if (now - searchCacheTime < CACHE_DURATION) {
                console.log('Using cached providers');
                searchProviders = [...searchCache];
                renderProviderList();
                updateMapMarkers();
                searchLoading = false;
                if (loadingEl) loadingEl.classList.add('hidden');
                return;
            }
        }
        
        let query = firebase.firestore().collection('users')
            .where('emailVerified', '==', true)
            .where('locationGeo', '!=', null)
            .limit(20);
        
        if (searchLastDoc) {
            query = query.startAfter(searchLastDoc);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            searchHasMore = false;
        } else {
            searchLastDoc = snapshot.docs[snapshot.docs.length - 1];
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    data.locationGeo.latitude,
                    data.locationGeo.longitude
                );
                
                if (distance <= currentRadius) {
                    const providerLocation = {
                        lat: data.locationGeo.latitude,
                        lng: data.locationGeo.longitude
                    };
                    
                    searchProviders.push({
                        id: doc.id,
                        ...data,
                        distance: distance.toFixed(1),
                        location: providerLocation
                    });
                }
            });
            
            searchProviders.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            
            if (reset) {
                searchCache = [...searchProviders];
                searchCacheTime = new Date().getTime();
            }
            
            renderProviderList();
            updateMapMarkers();
        }
        
    } catch (error) {
        console.error('Error loading providers:', error);
    }
    
    searchLoading = false;
    if (loadingEl) loadingEl.classList.add('hidden');
}

function updateMapMarkers() {
    providerMarkers.forEach(marker => map.removeLayer(marker));
    providerMarkers = [];
    
    searchProviders.forEach(provider => {
        const markerHtml = `
            <div class="provider-marker">
                <div class="marker-pin"></div>
                <div class="rating-badge">⭐ ${provider.rating || '0.0'}</div>
            </div>
        `;
        
        const markerIcon = L.divIcon({
            className: 'provider-marker-container',
            html: markerHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
        
        const lat = provider.location?.lat || userLocation.lat;
        const lng = provider.location?.lng || userLocation.lng;
        
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        
        marker.bindPopup(`
            <div class="map-popup">
                <strong>${provider.businessName}</strong><br>
                ⭐ ${provider.rating || '0.0'} (${provider.reviewCount || 0})<br>
                📍 ${provider.distance} km<br>
                <button class="popup-btn" onclick="viewProviderFromMap('${provider.id}')">View</button>
            </div>
        `);
        
        providerMarkers.push(marker);
    });
}

function renderProviderList() {
    const listContainer = document.getElementById('provider-list');
    if (!listContainer) return;
    
    if (searchProviders.length === 0) {
        listContainer.innerHTML = '<div class="empty-list">No providers found within radius</div>';
        return;
    }
    
    listContainer.innerHTML = searchProviders.map(provider => `
        <div class="provider-list-item" onclick="openQuickViewFromSearch('${provider.id}')">
            <img src="${provider.profileImage ? provider.profileImage + '?tr=w-40,h-40,format-webp' : 'https://via.placeholder.com/40'}" class="list-item-image">
            <div class="list-item-info">
                <div class="list-item-name">${provider.businessName}</div>
                <div class="list-item-details">
                    <span>⭐ ${provider.rating || '0.0'}</span>
                    <span>(${provider.reviewCount || 0})</span>
                    <span>• ${provider.distance} km</span>
                </div>
            </div>
        </div>
    `).join('');
}

function setupSearchListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterProviders(searchTerm);
        });
    }
    
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValue = document.getElementById('radius-value');
    
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', (e) => {
            currentRadius = parseInt(e.target.value);
            radiusValue.textContent = `${currentRadius} km`;
        });
        
        radiusSlider.addEventListener('change', () => {
            updateRadiusCircle();
            loadNearbyProviders(true);
        });
    }
    
    const providerDrawer = document.querySelector('.provider-drawer');
    if (providerDrawer) {
        providerDrawer.addEventListener('scroll', () => {
            if (providerDrawer.scrollTop + providerDrawer.clientHeight >= providerDrawer.scrollHeight - 100) {
                if (!searchLoading && searchHasMore) {
                    loadNearbyProviders(false);
                }
            }
        });
    }
}

function filterProviders(searchTerm) {
    const items = document.querySelectorAll('.provider-list-item');
    
    items.forEach(item => {
        const name = item.querySelector('.list-item-name')?.textContent.toLowerCase() || '';
        if (name.includes(searchTerm) || searchTerm === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

window.getDirections = function(providerId) {
    const provider = searchProviders.find(p => p.id === providerId);
    if (!provider || !userLocation) return;
    
    switchTab('search');
    
    setTimeout(() => {
        if (!map) return;
        
        if (routingControl) {
            map.removeControl(routingControl);
        }
        
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation.lat, userLocation.lng),
                L.latLng(provider.location?.lat || userLocation.lat, provider.location?.lng || userLocation.lng)
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: '#000000', opacity: 0.8, weight: 4 }]
            },
            createMarker: function() { return null; }
        }).addTo(map);
        
        const directionsBtn = document.createElement('button');
        directionsBtn.className = 'directions-toggle-btn';
        directionsBtn.textContent = 'Hide';
        directionsBtn.onclick = toggleDirections;
        document.querySelector('.search-container').appendChild(directionsBtn);
    }, 500);
};

window.toggleDirections = function() {
    if (routingControl) {
        const container = routingControl.getContainer();
        if (container.style.display === 'none') {
            container.style.display = 'block';
            event.target.textContent = 'Hide';
        } else {
            container.style.display = 'none';
            event.target.textContent = 'Show';
        }
    }
};

window.viewProviderFromMap = function(providerId) {
    const provider = searchProviders.find(p => p.id === providerId);
    if (provider) {
        openQuickView(provider);
    }
};

window.openQuickViewFromSearch = function(providerId) {
    const provider = searchProviders.find(p => p.id === providerId);
    if (provider) {
        openQuickView(provider);
    }
};

function onMapMoved() {
    // Placeholder for future functionality
}

window.getDirectionsToProvider = async function(providerId) {
    try {
        const providerDoc = await firebase.firestore().collection('users').doc(providerId).get();
        const provider = providerDoc.data();
        
        if (!provider.locationGeo) {
            alert('Provider has not set their location');
            return;
        }
        
        window.directionsTarget = {
            id: providerId,
            location: {
                lat: provider.locationGeo.latitude,
                lng: provider.locationGeo.longitude
            },
            name: provider.businessName
        };
        
        switchTab('search');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkMapReady = setInterval(() => {
            attempts++;
            
            if (map && userLocation) {
                clearInterval(checkMapReady);
                showDirectionsToTarget();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkMapReady);
                alert('Map is taking too long to load. Please try again.');
            }
        }, 500);
        
    } catch (error) {
        alert('ERROR: ' + error.message);
    }
};

function showDirectionsToTarget() {
    if (!window.directionsTarget) {
        alert('No destination selected');
        return;
    }
    
    if (!userLocation) {
        alert('Your location not found');
        return;
    }
    
    const target = window.directionsTarget;
    
    if (routingControl) {
        map.removeControl(routingControl);
    }
    
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(target.location.lat, target.location.lng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{ color: '#0000FF', opacity: 0.8, weight: 5 }]
        },
        createMarker: function() { return null; }
    }).addTo(map);
    
    setTimeout(() => {
        map.fitBounds([
            [userLocation.lat, userLocation.lng],
            [target.location.lat, target.location.lng]
        ], { padding: [50, 50] });
    }, 500);
    
    window.directionsTarget = null;
}
