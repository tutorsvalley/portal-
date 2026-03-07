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

// Fonts List
const fonts = {
    english: [
        'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
        'Arial', 'Georgia', 'Verdana', 'Calibri', 'Times New Roman'
    ],
    bangla: [
        'Hind Siliguri', 'Noto Sans Bengali', 'SolaimanLipi',
        'Baloo Da 2', 'Mukta', 'Poppins', 'Roboto',
        'Open Sans', 'Lato', 'Montserrat'
    ]
};

// Default Data
const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: "", femaleLink: "", mixedLink: "" }
];

// Guest Login - OPTIMIZED
function guestLogin() {
    console.log("Guest login clicked");
    
    auth.signInAnonymously()
        .then((userCredential) => {
            console.log("Guest logged in");
            currentUser = userCredential.user;
            currentUserRole = 'guest';
            
            return db.collection('users').doc(userCredential.user.uid).set({
                email: 'guest@tutorsvalley.com',
                displayName: 'Guest User',
                role: 'guest',
                isGuest: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        })
        .then(() => {
            showHome();
        })
        .catch((error) => {
            console.error("Guest error:", error);
            alert("গেস্ট লগইন ব্যর্থ: " + error.message);
        });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Page loaded");
    
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User:", user.email || 'Anonymous');
            currentUser = user;
            loadUser(user.uid);
        } else {
            showPage('loginPage');
        }
    });
});

// Load User Data - OPTIMIZED
function loadUser(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("Role:", currentUserRole);
            showHome();
        } else {
            logout();
        }
    }).catch(error => {
        console.error("Load user error:", error);
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

// Show Home - OPTIMIZED FOR SPEED
function showHome() {
    console.log("Showing home, role:", currentUserRole);
    showPage('homePage');
    
    // Show admin icon ONLY for admin
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) {
        adminIcon.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    }
    
    // Load all data in PARALLEL (faster)
    Promise.all([
        loadAllSettings(),
        loadZones(),
        loadReviews()
    ]).then(() => {
        console.log("✅ All data loaded");
    }).catch(error => {
        console.error("Error loading data:", error);
    });
    
    // Show review form for tutor and guardian only
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) {
        reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    }
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        const adminIcon = document.getElementById('adminIcon');
        if (adminIcon) adminIcon.style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel - FIXED
function toggleControl() {
    const panel = document.getElementById('controlPanel');
    if (!panel) {
        console.error("Control panel not found!");
        return;
    }
    
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        console.log("Loading control panel...");
        panel.style.display = 'block';
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            loadControlPanel();
        }, 100);
    }
}

// Load All Settings - OPTIMIZED
function loadAllSettings() {
    return Promise.all([
        db.collection('settings').doc('header').get(),
        db.collection('settings').doc('zones').get(),
        db.collection('settings').doc('reviews').get(),
        db.collection('settings').doc('ceo').get(),
        db.collection('settings').doc('footer').get()
    ]).then(results => {
        const [headerDoc, zonesDoc, reviewsDoc, ceoDoc, footerDoc] = results;
        
        // Header
        if (headerDoc.exists) {
            const data = headerDoc.data();
            if (data.logoUrl) document.getElementById('logo').src = data.logoUrl;
            if (data.branding) document.getElementById('branding').innerText = data.branding;
            if (data.motto) document.getElementById('motto').innerText = data.motto;
            if (data.fbUrl) document.getElementById('fbBtn').href = data.fbUrl;
            if (data.fbText) document.getElementById('fbText').innerText = data.fbText;
            if (data.headerBg) document.getElementById('headerSection').style.background = data.headerBg;
        } else {
            createDefaultHeaderSettings();
        }
        
        // Zones title
        if (zonesDoc.exists) {
            const data = zonesDoc.data();
            if (data.title) document.getElementById('zoneTitle').innerText = data.title;
        }
        
        // Reviews title
        if (reviewsDoc.exists) {
            const data = reviewsDoc.data();
            if (data.title) document.getElementById('reviewTitle').innerText = data.title;
        }
        
        // CEO
        if (ceoDoc.exists) {
            const data = ceoDoc.data();
            if (data.imageUrl) document.getElementById('ceoImg').src = data.imageUrl;
            if (data.name) document.getElementById('ceoName').innerText = data.name;
            if (data.title) document.getElementById('ceoTitle').innerText = data.title;
            if (data.desc) document.getElementById('ceoDesc').innerText = data.desc;
        }
        
        // Footer
        if (footerDoc.exists) {
            const data = footerDoc.data();
            if (data.copyright) document.getElementById('copyright').innerText = data.copyright;
            if (data.bgColor) document.getElementById('footerSection').style.background = data.bgColor;
        }
    });
}

function createDefaultHeaderSettings() {
    db.collection('settings').doc('header').set({
        logoUrl: "",
        branding: "Tutors Valley",
        motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
        fbUrl: "#",
        fbText: "fb page",
        headerBg: "#001f3f"
    });
}

// Load Control Panel - FIXED & OPTIMIZED
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) {
        console.error("Control body not found!");
        return;
    }
    
    console.log("Building control panel...");
    
    // Get current values safely
    const branding = document.getElementById('branding');
    const motto = document.getElementById('motto');
    const headerSection = document.getElementById('headerSection');
    const zoneTitle = document.getElementById('zoneTitle');
    const reviewTitle = document.getElementById('reviewTitle');
    const copyright = document.getElementById('copyright');
    const footerSection = document.getElementById('footerSection');
    const fbBtn = document.getElementById('fbBtn');
    const fbText = document.getElementById('fbText');
    
    body.innerHTML = `
        <div class="control-section">
            <h3><i class="fas fa-header"></i> হেডার সেটিংস</h3>
            
            <div class="control-group">
                <label>লোগো আপলোড:</label>
                <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং টেক্সট:</label>
                <input type="text" id="brandInput" value="${branding ? branding.innerText : 'Tutors Valley'}" oninput="updateText('branding', this.value); saveSetting('header', 'branding', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto টেক্সট:</label>
                <input type="text" id="mottoInput" value="${motto ? motto.innerText : ''}" oninput="updateText('motto', this.value); saveSetting('header', 'motto', this.value)">
            </div>
            
            <div class="control-group">
                <label>হেডার ব্যাকগ্রাউন্ড কালার:</label>
                <input type="color" id="headerBgInput" value="${headerSection ? rgbToHex(headerSection.style.background) : '#001f3f'}" onchange="updateColor('headerSection', 'background', this.value); saveSetting('header', 'headerBg', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fab fa-facebook"></i> ফেসবুক সেটিংস</h3>
            
            <div class="control-group">
                <label>ফেসবুক পেজ URL:</label>
                <input type="url" id="fbUrlInput" value="${fbBtn ? fbBtn.href : '#'}" onchange="updateFbUrl(this.value)">
            </div>
            
            <div class="control-group">
                <label>বাটন টেক্সট:</label>
                <input type="text" id="fbTextInput" value="${fbText ? fbText.innerText : 'fb page'}" oninput="updateText('fbText', this.value); saveSetting('header', 'fbText', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-map-marker-alt"></i> জোন কার্ড সেটিংস</h3>
            
            <div class="control-group">
                <label>সেকশন শিরোনাম:</label>
                <input type="text" id="zoneTitleInput" value="${zoneTitle ? zoneTitle.innerText : ''}" oninput="updateText('zoneTitle', this.value); saveSetting('zones', 'title', this.value)">
            </div>
            
            <div id="zoneCardsSettings"></div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-comments"></i> রিভিউ সেকশন</h3>
            
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" id="reviewTitleInput" value="${reviewTitle ? reviewTitle.innerText : ''}" oninput="updateText('reviewTitle', this.value); saveSetting('reviews', 'title', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-user-tie"></i> CEO সেকশন</h3>
            
            <div class="control-group">
                <label>CEO ইমেজ আপলোড:</label>
                <input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()">
            </div>
            
            <div class="control-group">
                <label>CEO নাম:</label>
                <input type="text" id="ceoNameInput" value="${document.getElementById('ceoName').innerText}" oninput="updateText('ceoName', this.value); saveSetting('ceo', 'name', this.value)">
            </div>
            
            <div class="control-group">
                <label>CEO পদবী:</label>
                <input type="text" id="ceoTitleInput" value="${document.getElementById('ceoTitle').innerText}" oninput="updateText('ceoTitle', this.value); saveSetting('ceo', 'title', this.value)">
            </div>
            
            <div class="control-group">
                <label>CEO বিবরণ:</label>
                <textarea id="ceoDescInput" rows="3" oninput="updateText('ceoDesc', this.value); saveSetting('ceo', 'desc', this.value)">${document.getElementById('ceoDesc').innerText}</textarea>
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-copyright"></i> ফুটার সেটিংস</h3>
            
            <div class="control-group">
                <label>কপিরাইট টেক্সট:</label>
                <input type="text" id="copyrightInput" value="${copyright ? copyright.innerText : ''}" oninput="updateText('copyright', this.value); saveSetting('footer', 'copyright', this.value)">
            </div>
            
            <div class="control-group">
                <label>ফুটার ব্যাকগ্রাউন্ড:</label>
                <input type="color" id="footerBgInput" value="${footerSection ? rgbToHex(footerSection.style.background) : '#001f3f'}" onchange="updateColor('footerSection', 'background', this.value); saveSetting('footer', 'bgColor', this.value)">
            </div>
        </div>
    `;
    
    loadZoneCardsSettings();
    console.log("✅ Control panel loaded");
}

// RGB to Hex
function rgbToHex(rgb) {
    if (!rgb || rgb === '' || rgb.startsWith('#')) return rgb || '#001f3f';
    
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#001f3f';
    
    return "#" + ((1 << 24) + (parseInt(rgbValues[0]) << 16) + (parseInt(rgbValues[1]) << 8) + parseInt(rgbValues[2])).toString(16).slice(1);
}

// Update Functions
function updateLogo() {
    const file = document.getElementById('logoInput').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('logo').src = e.target.result;
        db.collection('settings').doc('header').update({ logoUrl: e.target.result });
    };
    reader.readAsDataURL(file);
}

function updateCeoImage() {
    const file = document.getElementById('ceoImageInput').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('ceoImg').src = e.target.result;
        db.collection('settings').doc('ceo').update({ imageUrl: e.target.result });
    };
    reader.readAsDataURL(file);
}

function updateText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = value;
}

function updateColor(elementId, property, color) {
    const el = document.getElementById(elementId);
    if (el) el.style[property] = color;
}

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

function saveSetting(collection, field, value) {
    db.collection('settings').doc(collection).update({ [field]: value })
        .catch(() => {
            db.collection('settings').doc(collection).set({ [field]: value });
        });
}

// Load Zone Cards Settings
function loadZoneCardsSettings() {
    db.collection('zones').get().then(snapshot => {
        const container = document.getElementById('zoneCardsSettings');
        if (!container) return;
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const zone = doc.data();
            container.innerHTML += `
                <div style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px; background:white;">
                    <h4 style="margin-bottom:10px; color:#001f3f;">জোন #${zone.id}</h4>
                    
                    <div class="control-group">
                        <label>শিরোনাম:</label>
                        <input type="text" value="${zone.title}" onchange="updateZone(${zone.id}, 'title', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>এলাকা (কমা দিয়ে আলাদা করুন):</label>
                        <input type="text" value="${zone.areas ? zone.areas.join(', ') : ''}" onchange="updateZone(${zone.id}, 'areas', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>পুরুষ গ্রুপ লিঙ্ক:</label>
                        <input type="url" value="${zone.maleLink || ''}" onchange="updateZone(${zone.id}, 'maleLink', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>মহিলা গ্রুপ লিঙ্ক:</label>
                        <input type="url" value="${zone.femaleLink || ''}" onchange="updateZone(${zone.id}, 'femaleLink', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>মিক্সড গ্রুপ লিঙ্ক:</label>
                        <input type="url" value="${zone.mixedLink || ''}" onchange="updateZone(${zone.id}, 'mixedLink', this.value)">
                    </div>
                </div>
            `;
        });
    });
}

// Update Zone
function updateZone(id, field, value) {
    if (field === 'areas') {
        value = value.split(',').map(a => a.trim()).filter(a => a);
    }
    db.collection('zones').doc(id.toString()).update({ [field]: value });
}

// Load Zones
function loadZones() {
    return db.collection('zones').get().then(snapshot => {
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

// Render Zones - ONLY TUTORS SEE BUTTONS
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
        
        let buttonsHtml = '';
        if (currentUserRole === 'tutor') {
            if (zone.maleLink) {
                buttonsHtml += `<a href="${zone.maleLink}" target="_blank" class="group-btn male-btn">পুরুষ গ্রুপ</a>`;
            }
            if (zone.femaleLink) {
                buttonsHtml += `<a href="${zone.femaleLink}" target="_blank" class="group-btn female-btn">মহিলা গ্রুপ</a>`;
            }
            if (zone.mixedLink) {
                buttonsHtml += `<a href="${zone.mixedLink}" target="_blank" class="group-btn mixed-btn">মিক্সড গ্রুপ</a>`;
            }
        }
        
        card.innerHTML = `
            <h3>${zone.title}</h3>
            <div class="area-tags">${areasHtml}</div>
            ${buttonsHtml ? `<div style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">${buttonsHtml}</div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

// Load Reviews - EVERYONE CAN SEE
function loadReviews() {
    return db.collection('reviews').orderBy('createdAt', 'desc').limit(20).get().then(snapshot => {
        const container = document.getElementById('reviewList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">এখনও কোনো রিভিউ নেই</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <h4>${review.userName || 'Anonymous'} ${review.userRole ? '(' + review.userRole + ')' : ''}</h4>
                <small style="color:#999; display:block; margin-bottom:8px;">${date}</small>
                <p style="line-height:1.6;">${review.text}</p>
            `;
            container.appendChild(card);
        });
    });
}

// Submit Review - ONLY TUTORS & GUARDIANS
function submitReview() {
    if (currentUserRole !== 'tutor' && currentUserRole !== 'guardian') {
        alert("শুধুমাত্র টিউটর এবং অভিভাবক রিভিউ দিতে পারবেন");
        return;
    }
    
    const text = document.getElementById('reviewText').value;
    if (!text.trim()) {
        alert("রিভিউ লিখুন");
        return;
    }
    
    db.collection('reviews').add({
        text: text,
        userName: currentUser.displayName || currentUser.email || 'Anonymous',
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    }).catch(error => {
        console.error("Review error:", error);
        alert("রিভিউ জমা ব্যর্থ: " + error.message);
    });
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal();
    }
};
