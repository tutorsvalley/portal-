// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Global Variables
let currentUser = null;
let currentUserType = null;
let isAdmin = false;
const ADMIN_EMAIL = "kabirhasanat7@gmail.com";

// --- EXTERNAL BROWSER DETECTION LOGIC ---
function checkEmbeddedBrowser() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const warningDiv = document.getElementById('externalBrowserWarning');
    const isFacebook = /FBAN|FBAV/i.test(userAgent);
    const isInstagram = /Instagram/i.test(userAgent);
    const isMessenger = /Messenger/i.test(userAgent);
    const isTwitter = /Twitter/i.test(userAgent);
    const isLinkedIn = /LinkedIn/i.test(userAgent);
    
    // Check if running inside any social app webview
    if (isFacebook || isInstagram || isMessenger || isTwitter || isLinkedIn) {
        warningDiv.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        return true;
    } else {
        warningDiv.style.display = 'none';
        document.body.style.overflow = 'auto';
        return false;
    }
}

function forceOpenBrowser() {
    // Try to open the current URL in a new tab/window which often triggers external browser
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
    
    // Fallback instruction
    alert("If it didn't open automatically, please tap the menu (⋮ or ⋯) at the top corner and select 'Open in Browser' or 'Open in Chrome'.");
}

// Run detection immediately
checkEmbeddedBrowser();
// ----------------------------------------

// Default Zone Cards Data
let zoneCards = [
    {
        id: 1,
        zone: "মিরপুর",
        areas: ["মিরপুর ১", "মিরপুর ২", "মিরপুর ১০", "মিরপুর ১১"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink1",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink1"
    },
    {
        id: 2,
        zone: "উত্তরা",
        areas: ["উত্তরা সেক্টর ১", "উত্তরা সেক্টর ৪", "উত্তরা সেক্টর ৭"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink2",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink2"
    },
    {
        id: 3,
        zone: "ধানমন্ডি",
        areas: ["ধানমন্ডি ৩", "ধানমন্ডি ৮", "ধানমন্ডি ২৭"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink3",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink3"
    },
    {
        id: 4,
        zone: "গুলশান",
        areas: ["গুলশান ১", "গুলশান ২", "বনানী"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink4",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink4"
    },
    {
        id: 5,
        zone: "মোহাম্মদপুর",
        areas: ["মোহাম্মদপুর ১", "মোহাম্মদপুর ২", "আদাবর"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink5",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink5"
    },
    {
        id: 6,
        zone: "বনশ্রী",
        areas: ["বনশ্রী এ", "বনশ্রী বি", "রামপুরা"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink6",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink6"
    }
];

// Default Settings
let appSettings = {
    bannerColor: "#001f3f",
    watermarkOpacity: 30,
    logoSize: 150,
    ceoSize: 150,
    fbLink: "https://facebook.com/tutorsvalley",
    texts: {
        brandingText: { content: "Tutors Valley", font: "'Hind Siliguri', sans-serif", size: 32, color: "#ffffff" },
        mottoText: { content: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর", font: "'Hind Siliguri', sans-serif", size: 18, color: "#ffffff" },
        zoneTitle: { content: "Our Zones & Areas", font: "'Hind Siliguri', sans-serif", size: 32, color: "#001f3f" },
        reviewsTitle: { content: "Reviews", font: "'Hind Siliguri', sans-serif", size: 32, color: "#001f3f" },
        ceoName: { content: "CEO Name", font: "'Hind Siliguri', sans-serif", size: 28, color: "#001f3f" },
        ceoDescription: { content: "CEO Description", font: "'Hind Siliguri', sans-serif", size: 16, color: "#555555" },
        copyrightText: { content: "© 2026 Tutors Valley. All rights reserved.", font: "'Hind Siliguri', sans-serif", size: 14, color: "#ffffff" },
        fbButtonText: { content: "Facebook", font: "'Hind Siliguri', sans-serif", size: 14, color: "#ffffff" }
    }
};

// Loading Animation
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.remove('active');
    }, 2000);
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Page Navigation
function showPage(pageId) {
    showLoading();
    setTimeout(() => {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        hideLoading();
    }, 2000);
}

// Login Modal
function showLoginModal(type) {
    // Double check if still in embedded browser before allowing login
    if(checkEmbeddedBrowser()) {
        alert("Please open in external browser first to login properly.");
        return;
    }
    currentUserType = type;
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('modalTitle').textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' Login';
}

function closeModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
}

// Admin Login Trigger
function showAdminLogin() {
    if(checkEmbeddedBrowser()) {
        alert("Please open in external browser first to login properly.");
        return;
    }
    document.getElementById('adminModal').classList.add('active');
}

// Google Login
function googleLogin() {
    showLoading();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            currentUser = user;
            
            if (currentUserType === 'tutor') {
                saveUserData(user, 'tutor');
                showPage('homePage');
                setupHomePage('tutor');
            } else if (currentUserType === 'guardian') {
                saveUserData(user, 'guardian');
                showPage('homePage');
                setupHomePage('guardian');
            }
            
            closeModal();
            hideLoading();
        })
        .catch((error) => {
            // Specific error for embedded browser
            if (error.code === 'auth/popup-closed-by-user' || error.message.includes('popup')) {
                alert("Login popup blocked. Please open this link in Chrome or Safari browser.");
            } else {
                document.getElementById('loginStatus').textContent = error.message;
            }
            hideLoading();
        });
}

// Guest Login
function guestLogin() {
    showLoading();
    setTimeout(() => {
        currentUserType = 'guest';
        showPage('homePage');
        setupHomePage('guest');
        hideLoading();
    }, 2000);
}

// Admin Login
function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    showLoading();
    
    if (email === ADMIN_EMAIL) {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                currentUser = userCredential.user;
                isAdmin = true;
                closeAdminModal();
                showPage('homePage');
                setupHomePage('admin');
                hideLoading();
            })
            .catch((error) => {
                document.getElementById('adminStatus').textContent = error.message;
                hideLoading();
            });
    } else {
        document.getElementById('adminStatus').textContent = "Invalid admin email";
        hideLoading();
    }
}

// Save User Data
function saveUserData(user, type) {
    db.collection('users').doc(user.uid).set({
        email: user.email,
        name: user.displayName,
        type: type,
        photoURL: user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// Setup Home Page
function setupHomePage(userType) {
    currentUserType = userType;
    
    // Show gear icon for admin only
    document.getElementById('gearIcon').style.display = isAdmin ? 'block' : 'none';
    
    // Show tutor controls ONLY for tutor
    const tutorControls = document.getElementById('tutorControls');
    if (userType === 'tutor') {
        tutorControls.style.display = 'flex';
        // Reset dropdown on load
        document.getElementById('genderSelect').value = "";
        // Hide all buttons initially
        document.querySelectorAll('.group-btn').forEach(btn => btn.classList.add('hidden'));
    } else {
        tutorControls.style.display = 'none';
        // For Guardian/Guest, show all buttons or none based on your preference
        // Currently keeping them hidden until logic is defined, or you can show all:
        document.querySelectorAll('.group-btn').forEach(btn => btn.classList.remove('hidden'));
    }
    
    // Show review form for tutor and guardian
    document.getElementById('reviewForm').style.display = (userType === 'tutor' || userType === 'guardian') ? 'block' : 'none';
    
    // Load settings
    loadSettings();
    
    // Render zone cards
    renderZoneCards();
    
    // Load reviews
    loadReviews();
}

// Handle Gender Select (Tutor Only Logic)
function handleGenderSelect() {
    const gender = document.getElementById('genderSelect').value;
    
    // Show loading animation for 2 seconds
    showLoading();
    
    setTimeout(() => {
        // Hide all buttons first
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.add('hidden');
        });
        
        // Show specific gender buttons
        if (gender === 'male') {
            document.querySelectorAll('.male-group').forEach(btn => {
                btn.classList.remove('hidden');
            });
        } else if (gender === 'female') {
            document.querySelectorAll('.female-group').forEach(btn => {
                btn.classList.remove('hidden');
            });
        }
        
        hideLoading();
    }, 2000);
}

// Render Zone Cards
function renderZoneCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    zoneCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'zone-card';
        cardDiv.id = `card-${card.id}`;
        
        let areaTags = '';
        card.areas.forEach(area => {
            areaTags += `<span class="area-tag">${area}</span>`;
        });
        
        cardDiv.innerHTML = `
            <h3 class="zone-title" data-cardid="${card.id}" data-field="zone">${card.zone}</h3>
            <div class="area-tags" data-cardid="${card.id}" data-field="areas">
                ${areaTags}
            </div>
            <button class="group-btn male-group hidden" onclick="joinGroup('${card.maleGroup}')">
                💬 Join our whatsapp group (Male)
            </button>
            <button class="group-btn female-group hidden" onclick="joinGroup('${card.femaleGroup}')">
                💬 Join our whatsapp group (Female)
            </button>
        `;
        
        container.appendChild(cardDiv);
    });
}

// Join Group
function joinGroup(link) {
    showLoading();
    setTimeout(() => {
        window.open(link, '_blank');
        hideLoading();
    }, 2000);
}

// Submit Review
function submitReview() {
    const text = document.getElementById('reviewText').value;
    if (!text.trim()) {
        alert('Please write a review');
        return;
    }
    
    showLoading();
    
    db.collection('reviews').add({
        text: text,
        userId: currentUser ? currentUser.uid : 'guest',
        userName: currentUser ? currentUser.displayName : 'Guest',
        userType: currentUserType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        hideLoading();
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(20)
        .onSnapshot((snapshot) => {
            const container = document.getElementById('reviewsContainer');
            container.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const review = doc.data();
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review-card';
                reviewDiv.innerHTML = `
                    <div class="reviewer">${review.userName} (${review.userType})</div>
                    <div class="review-text">${review.text}</div>
                `;
                container.appendChild(reviewDiv);
            });
        });
}

// Control Panel
function openControlPanel() {
    if (!isAdmin) return;
    document.getElementById('controlPanel').classList.add('active');
    loadControlSettings();
}

function closeControlPanel() {
    document.getElementById('controlPanel').classList.remove('active');
}

// Load Control Settings
function loadControlSettings() {
    document.getElementById('bannerColor').value = appSettings.bannerColor;
    document.getElementById('watermarkOpacity').value = appSettings.watermarkOpacity;
    document.getElementById('logoSize').value = appSettings.logoSize;
    document.getElementById('ceoSize').value = appSettings.ceoSize;
    document.getElementById('fbLink').value = appSettings.fbLink;
}

// Update Banner Color
function updateBannerColor() {
    const color = document.getElementById('bannerColor').value;
    document.getElementById('bannerSection').style.background = color;
    appSettings.bannerColor = color;
}

// Upload Watermark (Storage Enabled)
function uploadWatermark() {
    const file = document.getElementById('watermarkUpload').files[0];
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('watermarks/' + Date.now() + '.jpg');
    storageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((url) => {
            document.getElementById('watermarkImage').src = url;
            document.getElementById('watermarkImage').style.display = 'block';
            appSettings.watermarkUrl = url;
            hideLoading();
        });
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update Watermark Opacity
function updateWatermarkOpacity() {
    const opacity = document.getElementById('watermarkOpacity').value;
    document.getElementById('watermarkImage').style.opacity = opacity / 100;
    appSettings.watermarkOpacity = opacity;
}

// Upload Logo (Storage Enabled)
function uploadLogo() {
    const file = document.getElementById('logoUpload').files[0];
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('logos/' + Date.now() + '.jpg');
    storageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((url) => {
            document.getElementById('logoImage').src = url;
            document.getElementById('logoImage').style.display = 'block';
            appSettings.logoUrl = url;
            hideLoading();
        });
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update Logo Size
function updateLogoSize() {
    const size = document.getElementById('logoSize').value;
    document.getElementById('logoImage').style.maxWidth = size + 'px';
    appSettings.logoSize = size;
}

// Upload CEO Image (Storage Enabled)
function uploadCeoImage() {
    const file = document.getElementById('ceoUpload').files[0];
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('ceo/' + Date.now() + '.jpg');
    storageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((url) => {
            document.getElementById('ceoImage').src = url;
            document.getElementById('ceoImage').style.display = 'block';
            appSettings.ceoUrl = url;
            hideLoading();
        });
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update CEO Size
function updateCeoSize() {
    const size = document.getElementById('ceoSize').value;
    document.getElementById('ceoImage').style.maxWidth = size + 'px';
    appSettings.ceoSize = size;
}

// Load Text Settings
function loadTextSettings() {
    const section = document.getElementById('textSection').value;
    const settings = appSettings.texts[section];
    
    document.getElementById('textContent').value = settings.content;
    document.getElementById('fontFamily').value = settings.font;
    document.getElementById('fontSize').value = settings.size;
    document.getElementById('fontColor').value = settings.color;
}

// Update Text Content
function updateTextContent() {
    const section = document.getElementById('textSection').value;
    const content = document.getElementById('textContent').value;
    document.getElementById(section).textContent = content;
    appSettings.texts[section].content = content;
}

// Update Text Font
function updateTextFont() {
    const section = document.getElementById('textSection').value;
    const font = document.getElementById('fontFamily').value;
    document.getElementById(section).style.fontFamily = font;
    appSettings.texts[section].font = font;
}

// Update Text Size
function updateTextSize() {
    const section = document.getElementById('textSection').value;
    const size = document.getElementById('fontSize').value;
    document.getElementById(section).style.fontSize = size + 'px';
    appSettings.texts[section].size = size;
}

// Update Text Color
function updateTextColor() {
    const section = document.getElementById('textSection').value;
    const color = document.getElementById('fontColor').value;
    document.getElementById(section).style.color = color;
    appSettings.texts[section].color = color;
}

// Update FB Link
function updateFbLink() {
    const link = document.getElementById('fbLink').value;
    document.getElementById('fbButton').href = link;
    appSettings.fbLink = link;
}

// Add New Card
function addNewCard() {
    const newId = zoneCards.length + 1;
    zoneCards.push({
        id: newId,
        zone: "New Zone",
        areas: ["Area 1", "Area 2"],
        maleGroup: "https://chat.whatsapp.com/newmalelink",
        femaleGroup: "https://chat.whatsapp.com/newfemalelink"
    });
    renderZoneCards();
    saveSettings();
}

// Save All Settings
function saveAllSettings() {
    showLoading();
    
    db.collection('settings').doc('main').set({
        bannerColor: appSettings.bannerColor,
        watermarkOpacity: appSettings.watermarkOpacity,
        logoSize: appSettings.logoSize,
        ceoSize: appSettings.ceoSize,
        fbLink: appSettings.fbLink,
        watermarkUrl: appSettings.watermarkUrl,
        logoUrl: appSettings.logoUrl,
        ceoUrl: appSettings.ceoUrl,
        texts: appSettings.texts,
        zoneCards: zoneCards,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Settings saved successfully!');
        closeControlPanel();
        hideLoading();
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Load Settings
function loadSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            if (data.bannerColor) {
                document.getElementById('bannerSection').style.background = data.bannerColor;
                appSettings.bannerColor = data.bannerColor;
            }
            
            if (data.watermarkUrl) {
                document.getElementById('watermarkImage').src = data.watermarkUrl;
                document.getElementById('watermarkImage').style.display = 'block';
                appSettings.watermarkUrl = data.watermarkUrl;
            }
            
            if (data.watermarkOpacity) {
                document.getElementById('watermarkImage').style.opacity = data.watermarkOpacity / 100;
                appSettings.watermarkOpacity = data.watermarkOpacity;
            }
            
            if (data.logoUrl) {
                document.getElementById('logoImage').src = data.logoUrl;
                document.getElementById('logoImage').style.display = 'block';
                appSettings.logoUrl = data.logoUrl;
            }
            
            if (data.logoSize) {
                document.getElementById('logoImage').style.maxWidth = data.logoSize + 'px';
                appSettings.logoSize = data.logoSize;
            }
            
            if (data.ceoUrl) {
                document.getElementById('ceoImage').src = data.ceoUrl;
                document.getElementById('ceoImage').style.display = 'block';
                appSettings.ceoUrl = data.ceoUrl;
            }
            
            if (data.ceoSize) {
                document.getElementById('ceoImage').style.maxWidth = data.ceoSize + 'px';
                appSettings.ceoSize = data.ceoSize;
            }
            
            if (data.fbLink) {
                document.getElementById('fbButton').href = data.fbLink;
                appSettings.fbLink = data.fbLink;
            }
            
            if (data.texts) {
                appSettings.texts = data.texts;
                Object.keys(data.texts).forEach(key => {
                    const el = document.getElementById(key);
                    if (el) {
                        el.textContent = data.texts[key].content;
                        el.style.fontFamily = data.texts[key].font;
                        el.style.fontSize = data.texts[key].size + 'px';
                        el.style.color = data.texts[key].color;
                    }
                });
            }
            
            if (data.zoneCards) {
                zoneCards = data.zoneCards;
                renderZoneCards();
            }
        }
    }).catch((error) => {
        console.log('Error loading settings:', error);
    });
}

// Save Settings
function saveSettings() {
    db.collection('settings').doc('main').set({
        zoneCards: zoneCards,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// Logout
function logout() {
    showLoading();
    
    auth.signOut().then(() => {
        currentUser = null;
        currentUserType = null;
        isAdmin = false;
        showPage('loginPage');
        hideLoading();
    }).catch((error) => {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Go Back
function goBack() {
    showPage('homePage');
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User signed in:', user.email);
    } else {
        console.log('User signed out');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tutors Valley initialized');
    // Re-check on load just in case
    checkEmbeddedBrowser();
});
