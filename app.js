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
let currentLoginRole = null;
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

// Guest Login - MUST BE FIRST
function guestLogin() {
    console.log("Guest login clicked");
    auth.signInAnonymously().then(() => {
        currentUserRole = 'guest';
        console.log("Guest logged in");
    }).catch(error => {
        console.error("Guest error:", error);
        alert("Error: " + error.message);
    });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Page loaded");
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUser(user.uid);
        } else {
            showPage('loginPage');
        }
    });
});

// Load User Data
function loadUser(uid) {
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
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

// Open Modal
function openModal(role) {
    currentLoginRole = role;
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
function googleLogin() {
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        
        if (currentLoginRole === 'admin' && user.email !== OWNER_EMAIL) {
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut();
            closeModal();
            return;
        }
        
        db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName,
            role: currentLoginRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            closeModal();
        });
    }).catch(error => {
        alert("Login failed: " + error.message);
    });
}

// Show Home
function showHome() {
    showPage('homePage');
    
    // Show admin icon for admin only
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) {
        adminIcon.style.display = currentUserRole === 'admin' ? 'flex' : 'none';
    }
    
    // Show review box for tutor/guardian
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) {
        reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
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
        document.getElementById('adminIcon').style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControl() {
    const panel = document.getElementById('controlPanel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// Update Logo
function updateLogo() {
    const file = document.getElementById('logoInput').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('logo').src = e.target.result;
        db.collection('settings').doc('main').update({ logoUrl: e.target.result });
    };
    reader.readAsDataURL(file);
}

// Update Brand
function updateBrand(value) {
    document.getElementById('branding').innerText = value;
}

// Update Motto
function updateMotto(value) {
    document.getElementById('motto').innerText = value;
}

// Save Settings
function saveSettings() {
    const brand = document.getElementById('brandInput').value;
    const motto = document.getElementById('mottoInput').value;
    
    document.getElementById('branding').innerText = brand;
    document.getElementById('motto').innerText = motto;
    
    db.collection('settings').doc('main').update({
        branding: brand,
        motto: motto
    }).then(() => {
        alert("সেটিংস সেভ হয়েছে");
        toggleControl();
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
            
            document.getElementById('brandInput').value = data.branding || '';
            document.getElementById('mottoInput').value = data.motto || '';
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
    const container = document.getElementById('zoneContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        
        let areasHtml = '';
        if (zone.areas) {
            areasHtml = zone.areas.map(a => `<span class="area-tag">${a}</span>`).join('');
        }
        
        card.innerHTML = `<h3>${zone.title}</h3><div>${areasHtml}</div>`;
        container.appendChild(card);
    });
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(10).get().then(snapshot => {
        const container = document.getElementById('reviewList');
        if (!container) return;
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `<h4>${review.userName || 'Anonymous'}</h4><p>${review.text}</p>`;
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

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal();
    }
};
