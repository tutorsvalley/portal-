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
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Global Variables
let currentUser = null;
let currentUserRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Default Zone Cards
const defaultZoneCards = [
    { id: 1, zoneTitle: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী", "রূপনগর"] },
    { id: 2, zoneTitle: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর", "শ্যামলী"] },
    { id: 3, zoneTitle: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা", "নিকেতন"] },
    { id: 4, zoneTitle: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর", "কেরানীগঞ্জ"] },
    { id: 5, zoneTitle: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ", "রমনা"] },
    { id: 6, zoneTitle: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "গাজীপুর", "সাভার"] }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, checking auth...");
    checkAuthState();
});

// Auth State Observer
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        console.log("Auth state changed:", user ? user.email : "No user");
        if (user) {
            currentUser = user;
            determineUserRole(user);
        } else {
            showPage('loginPage');
        }
    });
}
// Determine User Role
function determineUserRole(user) {
    console.log("Determining role for:", user.email);
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("User role:", currentUserRole);
            initializeApp();
        } else {
            console.log("No user doc found, logging out");
            logout();
        }
    }).catch((error) => {
        console.error("Error getting user role:", error);
        logout();
    });
}

// Show Google Login Modal
function showGoogleLogin(role) {
    console.log("Showing login for role:", role);
    currentUserRole = role;
    
    const titles = {
        'tutor': 'টিউটর লগইন',
        'guardian': 'অভিভাবক লগইন',
        'admin': 'এডমিন লগইন'
    };
    
    document.getElementById('googleLoginTitle').innerText = titles[role] || 'লগইন';
    document.getElementById('googleLoginModal').style.display = 'block';
    
    document.getElementById('googleSignInBtn').onclick = function() {
        console.log("Google sign in clicked for:", role);
        signInWithGoogle(role);
    };
}

// Google Sign In
function signInWithGoogle(role) {
    console.log("Signing in with Google as:", role);
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            const user = result.user;
            console.log("User signed in:", user.email);
            
            // Admin check
            if (role === 'admin') {
                if (user.email !== OWNER_EMAIL) {
                    alert("শুধুমাত্র মালিক এইমেইল দিয়ে admin লগইন করতে পারবেন!");                    console.log("Admin login rejected:", user.email);
                    auth.signOut();
                    closeModal('googleLoginModal');
                    return;
                }
            }
            
            // Save user data
            db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: role === 'admin' ? 'admin' : role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(() => {
                console.log("User data saved");
                closeModal('googleLoginModal');
                // initializeApp will be called by auth state change
            }).catch((error) => {
                console.error("Error saving user:", error);
                alert("ডাটা সংরক্ষণ ব্যর্থ: " + error.message);
            });
        })
        .catch((error) => {
            console.error("Google sign in error:", error);
            alert("লগইন ব্যর্থ: " + error.message);
        });
}

// Guest Login
function loginAsGuest() {
    console.log("Guest login");
    currentUserRole = 'guest';
    auth.signInAnonymously()
        .then(() => {
            console.log("Guest signed in");
            // initializeApp will be called by auth state change
        })
        .catch((error) => {
            console.error("Guest login error:", error);
            alert("গেস্ট লগইন ব্যর্থ: " + error.message);
        });
}

// Initialize App
function initializeApp() {
    console.log("Initializing app for role:", currentUserRole);
    showPage('homePage');
    
    // Show control panel icon for admin ONLY    const controlIcon = document.getElementById('controlPanelIcon');
    if (currentUserRole === 'admin') {
        controlIcon.style.display = 'flex';
        console.log("Control panel icon shown for admin");
    } else {
        controlIcon.style.display = 'none';
    }
    
    // Show review form for tutor and guardian
    const reviewForm = document.getElementById('reviewFormContainer');
    if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
        reviewForm.style.display = 'block';
    } else {
        reviewForm.style.display = 'none';
    }
    
    loadSettings();
    loadZoneCards();
    loadReviews();
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    console.log("Showing page:", pageId);
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Logout
function logout() {
    console.log("Logging out");
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        document.getElementById('controlPanelIcon').style.display = 'none';
        showPage('loginPage');
    }).catch((error) => {
        console.error("Logout error:", error);
    });
}

// Toggle Control Panel
function toggleControlPanel() {    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('active');
    console.log("Control panel toggled");
}

// Update Logo Size
function updateLogoSize(value) {
    const logo = document.getElementById('siteLogo');
    if (logo) {
        logo.style.width = value + 'px';
        logo.style.height = value + 'px';
    }
}

// Update Text
function updateText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = value;
    }
}

// Upload Image
function uploadImage(type) {
    const fileInput = document.getElementById(type + 'Upload');
    const file = fileInput.files[0];
    if (!file) {
        alert("অনুগ্রহ করে একটি ফাইল সিলেক্ট করুন");
        return;
    }
    
    if (file.size > 1024 * 1024) {
        alert("ফাইল সাইজ 1MB এর কম হতে হবে");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        if (type === 'logo') {
            document.getElementById('siteLogo').src = base64;
        } else if (type === 'ceo') {
            document.getElementById('ceoImage').src = base64;
        }
        
        db.collection('settings').doc('main').update({ [type + 'Url']: base64 })
            .then(() => {
                alert("ইমেজ আপলোড হয়েছে");
            })
            .catch((error) => {                console.error("Upload error:", error);
                alert("আপলোড ব্যর্থ: " + error.message);
            });
    };
    reader.onerror = (error) => {
        alert("ফাইল পড়া যায়নি: " + error);
    };
    reader.readAsDataURL(file);
}

// Load Settings
function loadSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            console.log("Settings loaded:", data);
            if (data.branding) document.getElementById('brandingText').innerText = data.branding;
            if (data.motto) document.getElementById('mottoText').innerText = data.motto;
            if (data.logoUrl) document.getElementById('siteLogo').src = data.logoUrl;
            if (data.logoSize) {
                document.getElementById('siteLogo').style.width = data.logoSize + 'px';
                document.getElementById('siteLogo').style.height = data.logoSize + 'px';
                if(document.getElementById('logoSize')) {
                    document.getElementById('logoSize').value = data.logoSize;
                }
            }
        } else {
            console.log("No settings found, creating defaults");
            createDefaultSettings();
        }
    }).catch((error) => {
        console.error("Load settings error:", error);
    });
}

// Create Default Settings
function createDefaultSettings() {
    const defaultSettings = {
        branding: "Tutors Valley",
        motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
        logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%230074D9'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='white'%3ETV%3C/text%3E%3C/svg%3E",
        logoSize: 100
    };
    
    db.collection('settings').doc('main').set(defaultSettings)
        .then(() => {
            console.log("Default settings created");
        })
        .catch((error) => {
            console.error("Create settings error:", error);        });
}

// Save All Settings
function saveAllSettings() {
    const settings = {
        branding: document.getElementById('brandingInput').value || document.getElementById('brandingText').innerText,
        motto: document.getElementById('mottoInput').value || document.getElementById('mottoText').innerText,
        logoSize: parseInt(document.getElementById('logoSize').value) || 100
    };
    
    db.collection('settings').doc('main').update(settings)
        .then(() => {
            alert("সেটিংস সংরক্ষিত হয়েছে");
            toggleControlPanel();
        })
        .catch((error) => {
            alert("সেটিংস সংরক্ষণ ব্যর্থ: " + error.message);
        });
}

// Load Zone Cards
function loadZoneCards() {
    console.log("Loading zone cards...");
    db.collection('zoneCards').get().then((snapshot) => {
        console.log("Zone cards snapshot size:", snapshot.size);
        if (snapshot.empty) {
            console.log("Creating default zone cards");
            defaultZoneCards.forEach(card => {
                db.collection('zoneCards').doc(card.id.toString()).set(card);
            });
            renderZoneCards(defaultZoneCards);
        } else {
            const cards = [];
            snapshot.forEach(doc => {
                cards.push(doc.data());
            });
            renderZoneCards(cards);
        }
    }).catch((error) => {
        console.error("Load zone cards error:", error);
    });
}

// Render Zone Cards
function renderZoneCards(cards) {
    const container = document.getElementById('zoneCardsContainer');
    if (!container) {
        console.error("Zone cards container not found");
        return;    }
    
    container.innerHTML = '';
    console.log("Rendering", cards.length, "zone cards");
    
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'zone-card';
        
        let areasHtml = '';
        if (card.areas && Array.isArray(card.areas)) {
            areasHtml = card.areas.map(area => `<span class="area-tag">${area}</span>`).join('');
        }
        
        cardDiv.innerHTML = `
            <h3 class="zone-title">${card.zoneTitle || 'Zone'}</h3>
            <div class="area-tags">${areasHtml}</div>
        `;
        
        container.appendChild(cardDiv);
    });
}

// Load Reviews
function loadReviews() {
    console.log("Loading reviews...");
    db.collection('reviews').orderBy('createdAt', 'desc').limit(10).get().then((snapshot) => {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        console.log("Reviews loaded:", snapshot.size);
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-card';
            
            const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            
            reviewDiv.innerHTML = `
                <div class="reviewer-name">${review.userName || 'Anonymous'} ${review.userRole ? '(' + review.userRole + ')' : ''}</div>
                <div class="review-date">${date}</div>
                <div class="review-text">${review.text}</div>
            `;
            
            container.appendChild(reviewDiv);
        });
    }).catch((error) => {
        console.error("Load reviews error:", error);    });
}

// Submit Review
function submitReview() {
    const text = document.getElementById('reviewText').value;
    if (!text || !text.trim()) {
        alert("অনুগ্রহ করে রিভিউ লিখুন");
        return;
    }
    
    console.log("Submitting review...");
    db.collection('reviews').add({
        text: text,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log("Review submitted");
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা দেওয়া হয়েছে");
    }).catch((error) => {
        console.error("Submit review error:", error);
        alert("রিভিউ জমা ব্যর্থ: " + error.message);
    });
}
