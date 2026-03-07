// Firebase Config
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
const provider = new firebase.auth.GoogleAuthProvider();

// Variables
let currentUser = null;
let currentUserRole = null;
let loginRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Default Data
const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"] },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"] },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"] },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"] },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"] },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"] }
];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    initializeApp();
});

// Initialize App
function initializeApp() {
    console.log("Initializing app...");
    
    // Setup login buttons
    setupLoginButtons();
    
    // Setup google login button
    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.onclick = handleGoogleLogin;
    }
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            showPage('loginPage');
        }
    });
}

// Setup Login Buttons
function setupLoginButtons() {
    const tutorBtn = document.querySelector('.tutor-btn');
    const guardianBtn = document.querySelector('.guardian-btn');
    const guestBtn = document.querySelector('.guest-btn');
    const adminBtn = document.querySelector('.admin-btn');
    
    if (tutorBtn) tutorBtn.onclick = () => openLoginModal('tutor');
    if (guardianBtn) guardianBtn.onclick = () => openLoginModal('guardian');
    if (guestBtn) guestBtn.onclick = loginAsGuest;
    if (adminBtn) adminBtn.onclick = () => openLoginModal('admin');
}

// Show Page
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Open Login Modal
function openLoginModal(role) {
    loginRole = role;
    const titles = {
        'tutor': 'টিউটর লগইন',
        'guardian': 'অভিভাবক লগইন',
        'admin': 'এডমিন লগইন'
    };
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.innerText = titles[role] || 'লগইন';
    }
    
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle Google Login
function handleGoogleLogin() {
    console.log("Google login clicked, role:", loginRole);
    
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        console.log("User signed in:", user.email);
        
        if (loginRole === 'admin' && user.email !== OWNER_EMAIL) {
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut();
            closeModal();
            return;
        }
        
        db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName,
            role: loginRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            console.log("User data saved");
            closeModal();
        });
    }).catch(error => {
        console.error("Login error:", error);
        alert("লগইন ব্যর্থ: " + error.message);
    });
}

// Load User Data
function loadUserData(uid) {
    console.log("Loading user data for:", uid);
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("User role:", currentUserRole);
            showHome();
        } else {
            console.log("No user doc found");
            logout();
        }
    }).catch(error => {
        console.error("Error loading user:", error);
    });
}

// Show Home
function showHome() {
    console.log("Showing home page");
    showPage('homePage');
    
    // Show control icon for admin only
    const controlIcon = document.getElementById('controlIcon');
    if (controlIcon) {
        if (currentUserRole === 'admin') {
            controlIcon.style.display = 'flex';
        } else {
            controlIcon.style.display = 'none';
        }
    }
    
    // Show review form for tutor/guardian
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
            reviewForm.style.display = 'block';
        } else {
            reviewForm.style.display = 'none';
        }
    }
    
    loadSettings();
    loadZones();
    loadReviews();
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        const controlIcon = document.getElementById('controlIcon');
        if (controlIcon) controlIcon.style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControlPanel() {
    const panel = document.getElementById('controlPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// Upload Logo
function uploadLogo() {
    const fileInput = document.getElementById('logoInput');
    if (!fileInput || !fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        const logo = document.getElementById('logo');
        if (logo) {
            logo.src = e.target.result;
        }
        db.collection('settings').doc('main').update({ logoUrl: e.target.result });
    };
    reader.readAsDataURL(file);
}

// Update Branding
function updateBranding(value) {
    const branding = document.getElementById('branding');
    if (branding) branding.innerText = value;
}

// Update Motto
function updateMotto(value) {
    const motto = document.getElementById('motto');
    if (motto) motto.innerText = value;
}

// Save Settings
function saveSettings() {
    const brandingInput = document.getElementById('brandingInput');
    const mottoInput = document.getElementById('mottoInput');
    
    db.collection('settings').doc('main').update({
        branding: brandingInput ? brandingInput.value : '',
        motto: mottoInput ? mottoInput.value : ''
    }).then(() => {
        alert("সেটিংস সেভ হয়েছে");
        toggleControlPanel();
    });
}

// Load Settings
function loadSettings() {
    db.collection('settings').doc('main').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const branding = document.getElementById('branding');
            const motto = document.getElementById('motto');
            const logo = document.getElementById('logo');
            const brandingInput = document.getElementById('brandingInput');
            const mottoInput = document.getElementById('mottoInput');
            
            if (data.branding && branding) branding.innerText = data.branding;
            if (data.motto && motto) motto.innerText = data.motto;
            if (data.logoUrl && logo) logo.src = data.logoUrl;
            
            if (brandingInput) brandingInput.value = data.branding || '';
            if (mottoInput) mottoInput.value = data.motto || '';
        } else {
            // Create default settings
            db.collection('settings').doc('main').set({
                branding: "Tutors Valley",
                motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
                logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230074D9'/%3E%3Ctext x='50' y='55' font-size='40' text-anchor='middle' fill='white'%3ETV%3C/text%3E%3C/svg%3E"
            });
        }
    });
}

// Load Zones
function loadZones() {
    db.collection('zones').get().then(snapshot => {
        if (snapshot.empty) {
            defaultZones.forEach(zone => {
                db.collection('zones').doc(zone.id.toString()).set(zone);
            });
            renderZones(defaultZones);
        } else {
            const zones = [];
            snapshot.forEach(doc => zones.push(doc.data()));
            renderZones(zones);
        }
    });
}

// Render Zones
function renderZones(zones) {
    const container = document.getElementById('zoneCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        
        let areasHtml = '';
        if (zone.areas && Array.isArray(zone.areas)) {
            areasHtml = zone.areas.map(area => `<span class="area-tag">${area}</span>`).join('');
        }
        
        card.innerHTML = `
            <h3>${zone.title || 'Zone'}</h3>
            <div class="area-tags">${areasHtml}</div>
        `;
        
        container.appendChild(card);
    });
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(10).get().then(snapshot => {
        const container = document.getElementById('reviewsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <h4>${review.userName || 'Anonymous'}</h4>
                <p>${review.text || ''}</p>
            `;
            container.appendChild(card);
        });
    });
}

// Submit Review
function submitReview() {
    const reviewText = document.getElementById('reviewText');
    if (!reviewText || !reviewText.value.trim()) {
        alert("রিভিউ লিখুন");
        return;
    }
    
    const text = reviewText.value;
    
    db.collection('reviews').add({
        text: text,
        userName: currentUser.displayName || currentUser.email,
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        reviewText.value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (modal && event.target === modal) {
        closeModal();
    }
};
