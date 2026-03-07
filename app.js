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
        'Poppins',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Arial',
        'Georgia',
        'Verdana',
        'Calibri',
        'Times New Roman'
    ],
    bangla: [
        'Hind Siliguri',
        'Noto Sans Bengali',
        'SolaimanLipi',
        'Baloo Da 2',
        'Mukta',
        'Poppins',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat'
    ]
};

// Default Data
const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"] },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"] },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"] },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"] },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"] },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"] }
];

// Guest Login
function guestLogin() {
    auth.signInAnonymously().then(() => {
        currentUserRole = 'guest';
    }).catch(error => {
        alert("Error: " + error.message);
    });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
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
    
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) {
        adminIcon.style.display = currentUserRole === 'admin' ? 'flex' : 'none';
    }
    
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) {
        reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    }
    
    loadAllSettings();
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

// Toggle Control Panel
function toggleControl() {
    const panel = document.getElementById('controlPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        loadControlPanel();
    }
}

// Load All Settings
function loadAllSettings() {
    // Load Header Settings
    db.collection('settings').doc('header').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.logoUrl) document.getElementById('logo').src = data.logoUrl;
            if (data.branding) document.getElementById('branding').innerText = data.branding;
            if (data.motto) document.getElementById('motto').innerText = data.motto;
            if (data.fbUrl) document.getElementById('fbBtn').href = data.fbUrl;
            if (data.fbText) document.getElementById('fbText').innerText = data.fbText;
            if (data.headerBg) document.getElementById('headerSection').style.background = data.headerBg;
        } else {
            db.collection('settings').doc('header').set({
                logoUrl: document.getElementById('logo').src,
                branding: "Tutors Valley",
                motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
                fbUrl: "#",
                fbText: "fb page",
                headerBg: "#001f3f"
            });
        }
    });
    
    // Load Zone Settings
    db.collection('settings').doc('zones').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.title) document.getElementById('zoneTitle').innerText = data.title;
        } else {
            db.collection('settings').doc('zones').set({
                title: "আমাদের এলাকা সমূহ"
            });
        }
    });
    
    loadZones();
    
    // Load Review Settings
    db.collection('settings').doc('reviews').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.title) document.getElementById('reviewTitle').innerText = data.title;
        } else {
            db.collection('settings').doc('reviews').set({
                title: "রিভিউ সমূহ"
            });
        }
    });
    
    loadReviews();
    
    // Load CEO Settings
    db.collection('settings').doc('ceo').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.imageUrl) document.getElementById('ceoImg').src = data.imageUrl;
            if (data.name) document.getElementById('ceoName').innerText = data.name;
            if (data.title) document.getElementById('ceoTitle').innerText = data.title;
            if (data.desc) document.getElementById('ceoDesc').innerText = data.desc;
        } else {
            db.collection('settings').doc('ceo').set({
                imageUrl: document.getElementById('ceoImg').src,
                name: "CEO Name",
                title: "Founder & CEO",
                desc: "CEO description here..."
            });
        }
    });
    
    // Load Footer Settings
    db.collection('settings').doc('footer').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.copyright) document.getElementById('copyright').innerText = data.copyright;
            if (data.bgColor) document.getElementById('footerSection').style.background = data.bgColor;
        } else {
            db.collection('settings').doc('footer').set({
                copyright: "© 2026 Tutors Valley. সর্বস্বত্ব সংরক্ষিত।",
                bgColor: "#001f3f"
            });
        }
    });
}

// Load Control Panel
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    body.innerHTML = '';
    
    // Header Settings
    body.innerHTML += `
        <div class="control-section">
            <h3><i class="fas fa-header"></i> হেডার সেটিংস</h3>
            
            <div class="control-group">
                <label>লোগো আপলোড:</label>
                <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং টেক্সট:</label>
                <input type="text" id="brandInput" value="${document.getElementById('branding').innerText}" oninput="updateText('branding', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto টেক্সট:</label>
                <input type="text" id="mottoInput" value="${document.getElementById('motto').innerText}" oninput="updateText('motto', this.value)">
            </div>
            
            <div class="control-group">
                <label>হেডার ব্যাকগ্রাউন্ড কালার:</label>
                <input type="color" id="headerBgInput" value="#001f3f" onchange="updateColor('headerSection', 'background', this.value)">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং ফন্ট:</label>
                <select id="brandFont" onchange="updateFont('branding', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং সাইজ (px):</label>
                <input type="number" id="brandSize" value="32" min="10" max="100" onchange="updateSize('branding', this.value)">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং কালার:</label>
                <input type="color" id="brandColor" value="#ffffff" onchange="updateColor('branding', 'color', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto ফন্ট:</label>
                <select id="mottoFont" onchange="updateFont('motto', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>মotto সাইজ (px):</label>
                <input type="number" id="mottoSize" value="18" min="10" max="60" onchange="updateSize('motto', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto কালার:</label>
                <input type="color" id="mottoColor" value="#ffd700" onchange="updateColor('motto', 'color', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fab fa-facebook"></i> ফেসবুক সেটিংস</h3>
            
            <div class="control-group">
                <label>ফেসবুক পেজ URL:</label>
                <input type="url" id="fbUrlInput" placeholder="https://facebook.com/yourpage" onchange="updateFbUrl(this.value)">
            </div>
            
            <div class="control-group">
                <label>বাটন টেক্সট:</label>
                <input type="text" id="fbTextInput" value="fb page" oninput="updateText('fbText', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-map-marker-alt"></i> জোন কার্ড সেটিংস</h3>
            
            <div class="control-group">
                <label>সেকশন শিরোনাম:</label>
                <input type="text" id="zoneTitleInput" value="${document.getElementById('zoneTitle').innerText}" oninput="updateText('zoneTitle', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম ফন্ট:</label>
                <select id="zoneTitleFont" onchange="updateFont('zoneTitle', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>শিরোনাম সাইজ (px):</label>
                <input type="number" id="zoneTitleSize" value="32" min="10" max="80" onchange="updateSize('zoneTitle', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম কালার:</label>
                <input type="color" id="zoneTitleColor" value="#001f3f" onchange="updateColor('zoneTitle', 'color', this.value)">
            </div>
            
            <div id="zoneCardsSettings"></div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-comments"></i> রিভিউ সেকশন</h3>
            
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" id="reviewTitleInput" value="${document.getElementById('reviewTitle').innerText}" oninput="updateText('reviewTitle', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম ফন্ট:</label>
                <select id="reviewTitleFont" onchange="updateFont('reviewTitle', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>শিরোনাম সাইজ (px):</label>
                <input type="number" id="reviewTitleSize" value="32" min="10" max="80" onchange="updateSize('reviewTitle', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম কালার:</label>
                <input type="color" id="reviewTitleColor" value="#001f3f" onchange="updateColor('reviewTitle', 'color', this.value)">
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
                <input type="text" id="ceoNameInput" value="${document.getElementById('ceoName').innerText}" oninput="updateText('ceoName', this.value)">
            </div>
            
            <div class="control-group">
                <label>CEO পদবী:</label>
                <input type="text" id="ceoTitleInput" value="${document.getElementById('ceoTitle').innerText}" oninput="updateText('ceoTitle', this.value)">
            </div>
            
            <div class="control-group">
                <label>CEO বিবরণ:</label>
                <textarea id="ceoDescInput" rows="3" oninput="updateText('ceoDesc', this.value)">${document.getElementById('ceoDesc').innerText}</textarea>
            </div>
            
            <div class="control-group">
                <label>CEO নাম ফন্ট:</label>
                <select id="ceoNameFont" onchange="updateFont('ceoName', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>CEO নাম সাইজ (px):</label>
                <input type="number" id="ceoNameSize" value="24" min="10" max="60" onchange="updateSize('ceoName', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-copyright"></i> ফুটার সেটিংস</h3>
            
            <div class="control-group">
                <label>কপিরাইট টেক্সট:</label>
                <input type="text" id="copyrightInput" value="${document.getElementById('copyright').innerText}" oninput="updateText('copyright', this.value)">
            </div>
            
            <div class="control-group">
                <label>ফুটার ব্যাকগ্রাউন্ড:</label>
                <input type="color" id="footerBgInput" value="#001f3f" onchange="updateColor('footerSection', 'background', this.value)">
            </div>
            
            <div class="control-group">
                <label>কপিরাইট ফন্ট:</label>
                <select id="copyrightFont" onchange="updateFont('copyright', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions()}
                </select>
            </div>
            
            <div class="control-group">
                <label>কপিরাইট সাইজ (px):</label>
                <input type="number" id="copyrightSize" value="14" min="10" max="40" onchange="updateSize('copyright', this.value)">
            </div>
        </div>
    `;
    
    loadZoneCardsSettings();
}

// Generate Font Options
function generateFontOptions() {
    let options = '<optgroup label="English Fonts">';
    fonts.english.forEach(font => {
        options += `<option value="${font}">${font}</option>`;
    });
    options += '</optgroup><optgroup label="Bangla Fonts">';
    fonts.bangla.forEach(font => {
        options += `<option value="${font}">${font}</option>`;
    });
    options += '</optgroup>';
    return options;
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
    document.getElementById(elementId).innerText = value;
    saveSetting(elementId.replace('Input', ''), 'text', value);
}

function updateFont(elementId, font) {
    document.getElementById(elementId).style.fontFamily = font;
    saveSetting(elementId, 'font', font);
}

function updateSize(elementId, size) {
    document.getElementById(elementId).style.fontSize = size + 'px';
    saveSetting(elementId, 'size', size);
}

function updateColor(elementId, property, color) {
    document.getElementById(elementId).style[property] = color;
    saveSetting(elementId, 'color', color);
}

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

function saveSetting(section, field, value) {
    const updates = {};
    updates[field] = value;
    db.collection('settings').doc(section).update(updates).catch(() => {
        db.collection('settings').doc(section).set(updates);
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
