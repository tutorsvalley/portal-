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

// On Load
window.onload = function() {
    console.log("App loaded");
    checkAuth();
};

// Check Auth
function checkAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            showPage('loginPage');
        }
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

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// Open Login Modal
function openLoginModal(role) {
    loginRole = role;
    const titles = {
        'tutor': 'টিউটর লগইন',
        'guardian': 'অভিভাবক লগইন',
        'admin': 'এডমিন লগইন'
    };
    document.getElementById('modalTitle').innerText = titles[role];
    document.getElementById('loginModal').style.display = 'block';
}

// Close Modal
function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// Google Login
document.getElementById('googleBtn').onclick = function() {
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        
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
            closeModal();
        });
    }).catch(error => {
        alert("লগইন ব্যর্থ: " + error.message);
        console.error(error);
    });
};

// Guest Login
function loginAsGuest() {
    auth.signInAnonymously().then(() => {
        currentUserRole = 'guest';
        showHome();
    });
}

// Show Home
function showHome() {
    showPage('homePage');
    
    // Show control icon for admin only
    const controlIcon = document.getElementById('controlIcon');
    if (currentUserRole === 'admin') {
        controlIcon.style.display = 'flex';
    } else {
        controlIcon.style.display = 'none';
    }
    
    // Show review form for tutor/guardian
    const reviewForm = document.getElementById('reviewForm');
    if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
        reviewForm.style.display = 'block';
    } else {
        reviewForm.style.display = 'none';
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
        document.getElementById('controlIcon').style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControlPanel() {
    document.getElementById('controlPanel').classList.toggle('active');
}

// Upload Logo
function uploadLogo() {
    const file = document.getElementById('logoInput').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('logo').src = e.target.result;
        db.collection('settings').doc('main').update({ logoUrl: e.target.result });
    };
    reader.readAsDataURL(file);
}

// Update Branding
function updateBranding(value) {
    document.getElementById('branding').innerText = value;
}

// Update Motto
function updateMotto(value) {
    document.getElementById('motto').innerText = value;
}

// Save Settings
function saveSettings() {
    db.collection('settings').doc('main').update({
        branding: document.getElementById('brandingInput').value,
        motto: document.getElementById('mottoInput').value
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
            if (data.branding) document.getElementById('branding').innerText = data.branding;
            if (data.motto) document.getElementById('motto').innerText = data.motto;
            if (data.logoUrl) document.getElementById('logo').src = data.logoUrl;
            
            // Fill control panel inputs
            document.getElementById('brandingInput').value = data.branding || '';
            document.getElementById('mottoInput').value = data.motto || '';
        } else {
            db.collection('settings').doc('main').set({
                branding: "Tutors Valley",
                motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
                logoUrl: document.getElementById('logo').src
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
    container.innerHTML = '';
    
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        
        let areasHtml = '';
        if (zone.areas) {
            areasHtml = zone.areas.map(area => `<span class="area-tag">${area}</span>`).join('');
        }
        
        card.innerHTML = `
            <h3>${zone.title}</h3>
            <div class="area-tags">${areasHtml}</div>
        `;
        
        container.appendChild(card);
    });
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(10).get().then(snapshot => {
        const container = document.getElementById('reviewsList');
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <h4>${review.userName || 'Anonymous'}</h4>
                <p>${review.text}</p>
            `;
            container.appendChild(card);
        });
    });
}

// Submit Review
function submitReview() {
    const text = document.getElementById('reviewText').value;
    if (!text.trim()) {
        alert("রিভিউ লিখুন");
        return;
    }
    
    db.collection('reviews').add({
        text: text,
        userName: currentUser.displayName || currentUser.email,
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal();
    }
};
