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

// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM Loaded");
    
    // Setup all buttons
    setupButtons();
    
    // Check auth
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            showPage('loginPage');
        }
    });
});

// Setup Buttons
function setupButtons() {
    console.log("Setting up buttons...");
    
    // Login buttons
    const tutorBtn = document.getElementById('tutorBtn');
    const guardianBtn = document.getElementById('guardianBtn');
    const guestBtn = document.getElementById('guestBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (tutorBtn) tutorBtn.onclick = () => openLoginModal('tutor');
    if (guardianBtn) guardianBtn.onclick = () => openLoginModal('guardian');
    if (guestBtn) guestBtn.onclick = loginAsGuest;
    if (adminBtn) adminBtn.onclick = () => openLoginModal('admin');
    
    // Modal buttons
    const closeModal = document.getElementById('closeModal');
    const googleBtn = document.getElementById('googleBtn');
    const closeControl = document.getElementById('closeControl');
    const controlIcon = document.getElementById('controlIcon');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    
    if (closeModal) closeModal.onclick = closeModalFunc;
    if (googleBtn) googleBtn.onclick = handleGoogleLogin;
    if (closeControl) closeControl.onclick = toggleControlPanel;
    if (controlIcon) controlIcon.onclick = toggleControlPanel;
    if (saveBtn) saveBtn.onclick = saveSettings;
    if (logoutBtn) logoutBtn.onclick = logout;
    if (submitReviewBtn) submitReviewBtn.onclick = submitReview;
    
    console.log("✅ Buttons setup complete");
}

// Show Page
function showPage(pageId) {
    const loginPage = document.getElementById('loginPage');
    const homePage = document.getElementById('homePage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (homePage) homePage.style.display = 'none';
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
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
    if (modalTitle) modalTitle.innerText = titles[role] || 'লগইন';
    
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
}

// Close Modal
function closeModalFunc() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

// Handle Google Login
function handleGoogleLogin() {
    console.log("Google login clicked");
    
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        console.log("User:", user.email);
        
        if (loginRole === 'admin' && user.email !== OWNER_EMAIL) {
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut();
            closeModalFunc();
            return;
        }
        
        db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName,
            role: loginRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            closeModalFunc();
        });
    }).catch(error => {
        console.error("Login error:", error);
        alert("লগইন ব্যর্থ: " + error.message);
    });
}

// Load User Data
function loadUserData(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            showHome();
        } else {
            logout();
        }
    });
}

// Show Home
function showHome() {
    console.log("Showing home, role:", currentUserRole);
    showPage('homePage');
    
    // Control icon
    const controlIcon = document.getElementById('controlIcon');
    if (controlIcon) {
        controlIcon.style.display = currentUserRole === 'admin' ? 'flex' : 'none';
    }
    
    // Review form
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
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
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
        }
    }
}

// Upload Logo
function uploadLogo() {
    const fileInput = document.getElementById('logoInput');
    if (!fileInput || !fileInput.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        const logo = document.getElementById('logo');
        if (logo) logo.src = e.target.result;
        db.collection('settings').doc('main').update({ logoUrl: e.target.result });
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// Save Settings
function saveSettings() {
    const brandingInput = document.getElementById('brandingInput');
    const mottoInput = document.getElementById('mottoInput');
    const branding = document.getElementById('branding');
    const motto = document.getElementById('motto');
    
    const newBranding = brandingInput ? brandingInput.value : '';
    const newMotto = mottoInput ? mottoInput.value : '';
    
    if (branding) branding.innerText = newBranding;
    if (motto) motto.innerText = newMotto;
    
    db.collection('settings').doc('main').update({
        branding: newBranding,
        motto: newMotto
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
            db.collection('settings').doc('main').set({
                branding: "Tutors Valley",
                motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর"
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
    
    db.collection('reviews').add({
        text: reviewText.value,
        userName: currentUser.displayName || currentUser.email,
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        reviewText.value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (modal && event.target === modal) {
        closeModalFunc();
    }
};
