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
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: "", femaleLink: "", mixedLink: "" }
];

// Guest Login - FIXED
function guestLogin() {
    console.log("Guest login clicked");
    
    auth.signInAnonymously()
        .then((userCredential) => {
            console.log("Guest logged in successfully");
            currentUser = userCredential.user;
            currentUserRole = 'guest';
            
            // Save guest user data
            return db.collection('users').doc(userCredential.user.uid).set({
                email: 'guest@tutorsvalley.com',
                displayName: 'Guest User',
                role: 'guest',
                isGuest: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        })
        .then(() => {
            console.log("Guest data saved");
            showHome();
        })
        .catch((error) => {
            console.error("Guest login error:", error);
            alert("গেস্ট লগইন ব্যর্থ: " + error.message);
        });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded");
    
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User authenticated:", user.email || 'Anonymous');
            currentUser = user;
            loadUser(user.uid);
        } else {
            console.log("No user - showing login page");
            showPage('loginPage');
        }
    });
});

// Load User Data
function loadUser(uid) {
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

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    console.log("Showing page:", pageId);
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

// Show Home - GEAR ICON ONLY FOR ADMIN
function showHome() {
    console.log("Showing home page, role:", currentUserRole);
    showPage('homePage');
    
    // Show admin icon ONLY for admin (NOT for subadmin, tutor, guardian, or guest)
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) {
        if (currentUserRole === 'admin') {
            adminIcon.style.display = 'flex';
            console.log("✅ Admin icon shown - user is admin");
        } else {
            adminIcon.style.display = 'none';
            console.log("❌ Admin icon hidden - user role:", currentUserRole);
        }
    }
    
    // Show review form for tutor and guardian ONLY (NOT for guest)
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) {
        if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
            reviewBox.style.display = 'block';
        } else {
            reviewBox.style.display = 'none';
        }
    }
    
    loadAllSettings();
    loadZones();
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        const adminIcon = document.getElementById('adminIcon');
        if (adminIcon) adminIcon.style.display = 'none';
        showPage('loginPage');
        console.log("User logged out");
    });
}

// Toggle Control Panel
function toggleControl() {
    const panel = document.getElementById('controlPanel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
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
            if (data.brandFont) document.getElementById('branding').style.fontFamily = data.brandFont;
            if (data.brandSize) document.getElementById('branding').style.fontSize = data.brandSize + 'px';
            if (data.brandColor) document.getElementById('branding').style.color = data.brandColor;
            if (data.mottoFont) document.getElementById('motto').style.fontFamily = data.mottoFont;
            if (data.mottoSize) document.getElementById('motto').style.fontSize = data.mottoSize + 'px';
            if (data.mottoColor) document.getElementById('motto').style.color = data.mottoColor;
        } else {
            createDefaultHeaderSettings();
        }
    }).catch(() => {
        createDefaultHeaderSettings();
    });
    
    // Load Zone Settings
    db.collection('settings').doc('zones').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.title) document.getElementById('zoneTitle').innerText = data.title;
            if (data.titleFont) document.getElementById('zoneTitle').style.fontFamily = data.titleFont;
            if (data.titleSize) document.getElementById('zoneTitle').style.fontSize = data.titleSize + 'px';
            if (data.titleColor) document.getElementById('zoneTitle').style.color = data.titleColor;
        } else {
            db.collection('settings').doc('zones').set({
                title: "আমাদের এলাকা সমূহ",
                titleFont: "",
                titleSize: 32,
                titleColor: "#001f3f"
            });
        }
    });
    
    // Load Review Settings
    db.collection('settings').doc('reviews').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.title) document.getElementById('reviewTitle').innerText = data.title;
            if (data.titleFont) document.getElementById('reviewTitle').style.fontFamily = data.titleFont;
            if (data.titleSize) document.getElementById('reviewTitle').style.fontSize = data.titleSize + 'px';
            if (data.titleColor) document.getElementById('reviewTitle').style.color = data.titleColor;
        } else {
            db.collection('settings').doc('reviews').set({
                title: "রিভিউ সমূহ",
                titleFont: "",
                titleSize: 32,
                titleColor: "#001f3f"
            });
        }
    });
    
    // Load CEO Settings
    db.collection('settings').doc('ceo').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.imageUrl) document.getElementById('ceoImg').src = data.imageUrl;
            if (data.name) document.getElementById('ceoName').innerText = data.name;
            if (data.title) document.getElementById('ceoTitle').innerText = data.title;
            if (data.desc) document.getElementById('ceoDesc').innerText = data.desc;
            if (data.nameFont) document.getElementById('ceoName').style.fontFamily = data.nameFont;
            if (data.nameSize) document.getElementById('ceoName').style.fontSize = data.nameSize + 'px';
            if (data.titleFont) document.getElementById('ceoTitle').style.fontFamily = data.titleFont;
            if (data.descFont) document.getElementById('ceoDesc').style.fontFamily = data.descFont;
        } else {
            db.collection('settings').doc('ceo').set({
                imageUrl: "",
                name: "CEO Name",
                title: "Founder & CEO",
                desc: "CEO description here...",
                nameFont: "",
                nameSize: 24,
                titleFont: "",
                descFont: ""
            });
        }
    });
    
    // Load Footer Settings
    db.collection('settings').doc('footer').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.copyright) document.getElementById('copyright').innerText = data.copyright;
            if (data.bgColor) document.getElementById('footerSection').style.background = data.bgColor;
            if (data.copyrightFont) document.getElementById('copyright').style.fontFamily = data.copyrightFont;
            if (data.copyrightSize) document.getElementById('copyright').style.fontSize = data.copyrightSize + 'px';
        } else {
            db.collection('settings').doc('footer').set({
                copyright: "© 2026 Tutors Valley. সর্বস্বত্ব সংরক্ষিত।",
                bgColor: "#001f3f",
                copyrightFont: "",
                copyrightSize: 14
            });
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
        headerBg: "#001f3f",
        brandFont: "",
        brandSize: 32,
        brandColor: "#ffffff",
        mottoFont: "",
        mottoSize: 18,
        mottoColor: "#ffd700"
    });
}

// Load Control Panel
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    body.innerHTML = '';
    
    // Get current values
    const currentHeaderBg = document.getElementById('headerSection').style.background || '#001f3f';
    const currentBrandFont = document.getElementById('branding').style.fontFamily || '';
    const currentBrandSize = parseInt(document.getElementById('branding').style.fontSize) || 32;
    const currentBrandColor = document.getElementById('branding').style.color || '#ffffff';
    const currentMottoFont = document.getElementById('motto').style.fontFamily || '';
    const currentMottoSize = parseInt(document.getElementById('motto').style.fontSize) || 18;
    const currentMottoColor = document.getElementById('motto').style.color || '#ffd700';
    const currentFbUrl = document.getElementById('fbBtn').href || '#';
    const currentFbText = document.getElementById('fbText').innerText || 'fb page';
    
    // Header Settings
    body.innerHTML += `
        <div class="control-section">
            <h3><i class="fas fa-header"></i> হেডার সেটিংস</h3>
            
            <div class="control-group">
                <label>লোগো আপলোড:</label>
                <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()">
                <small>বর্তমান লোগো দেখতে পাবেন হেডারে</small>
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং টেক্সট:</label>
                <input type="text" id="brandInput" value="${document.getElementById('branding').innerText}" oninput="updateText('branding', this.value); saveSetting('header', 'branding', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto টেক্সট:</label>
                <input type="text" id="mottoInput" value="${document.getElementById('motto').innerText}" oninput="updateText('motto', this.value); saveSetting('header', 'motto', this.value)">
            </div>
            
            <div class="control-group">
                <label>হেডার ব্যাকগ্রাউন্ড কালার:</label>
                <input type="color" id="headerBgInput" value="${rgbToHex(currentHeaderBg)}" onchange="updateColor('headerSection', 'background', this.value); saveSetting('header', 'headerBg', this.value)">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং ফন্ট:</label>
                <select id="brandFont" onchange="updateFont('branding', this.value); saveSetting('header', 'brandFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(currentBrandFont)}
                </select>
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং সাইজ (px):</label>
                <input type="number" id="brandSize" value="${currentBrandSize}" min="10" max="100" onchange="updateSize('branding', this.value); saveSetting('header', 'brandSize', this.value)">
            </div>
            
            <div class="control-group">
                <label>ব্র্যান্ডিং কালার:</label>
                <input type="color" id="brandColor" value="${rgbToHex(currentBrandColor)}" onchange="updateColor('branding', 'color', this.value); saveSetting('header', 'brandColor', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto ফন্ট:</label>
                <select id="mottoFont" onchange="updateFont('motto', this.value); saveSetting('header', 'mottoFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(currentMottoFont)}
                </select>
            </div>
            
            <div class="control-group">
                <label>মotto সাইজ (px):</label>
                <input type="number" id="mottoSize" value="${currentMottoSize}" min="10" max="60" onchange="updateSize('motto', this.value); saveSetting('header', 'mottoSize', this.value)">
            </div>
            
            <div class="control-group">
                <label>মotto কালার:</label>
                <input type="color" id="mottoColor" value="${rgbToHex(currentMottoColor)}" onchange="updateColor('motto', 'color', this.value); saveSetting('header', 'mottoColor', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fab fa-facebook"></i> ফেসবুক সেটিংস</h3>
            
            <div class="control-group">
                <label>ফেসবুক পেজ URL:</label>
                <input type="url" id="fbUrlInput" value="${currentFbUrl}" placeholder="https://facebook.com/yourpage" onchange="updateFbUrl(this.value)">
            </div>
            
            <div class="control-group">
                <label>বাটন টেক্সট:</label>
                <input type="text" id="fbTextInput" value="${currentFbText}" oninput="updateText('fbText', this.value); saveSetting('header', 'fbText', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-map-marker-alt"></i> জোন কার্ড সেটিংস</h3>
            
            <div class="control-group">
                <label>সেকশন শিরোনাম:</label>
                <input type="text" id="zoneTitleInput" value="${document.getElementById('zoneTitle').innerText}" oninput="updateText('zoneTitle', this.value); saveSetting('zones', 'title', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম ফন্ট:</label>
                <select id="zoneTitleFont" onchange="updateFont('zoneTitle', this.value); saveSetting('zones', 'titleFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('zoneTitle').style.fontFamily)}
                </select>
            </div>
            
            <div class="control-group">
                <label>শিরোনাম সাইজ (px):</label>
                <input type="number" id="zoneTitleSize" value="${parseInt(document.getElementById('zoneTitle').style.fontSize) || 32}" min="10" max="80" onchange="updateSize('zoneTitle', this.value); saveSetting('zones', 'titleSize', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম কালার:</label>
                <input type="color" id="zoneTitleColor" value="${rgbToHex(document.getElementById('zoneTitle').style.color) || '#001f3f'}" onchange="updateColor('zoneTitle', 'color', this.value); saveSetting('zones', 'titleColor', this.value)">
            </div>
            
            <div id="zoneCardsSettings"></div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-comments"></i> রিভিউ সেকশন</h3>
            
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" id="reviewTitleInput" value="${document.getElementById('reviewTitle').innerText}" oninput="updateText('reviewTitle', this.value); saveSetting('reviews', 'title', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম ফন্ট:</label>
                <select id="reviewTitleFont" onchange="updateFont('reviewTitle', this.value); saveSetting('reviews', 'titleFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('reviewTitle').style.fontFamily)}
                </select>
            </div>
            
            <div class="control-group">
                <label>শিরোনাম সাইজ (px):</label>
                <input type="number" id="reviewTitleSize" value="${parseInt(document.getElementById('reviewTitle').style.fontSize) || 32}" min="10" max="80" onchange="updateSize('reviewTitle', this.value); saveSetting('reviews', 'titleSize', this.value)">
            </div>
            
            <div class="control-group">
                <label>শিরোনাম কালার:</label>
                <input type="color" id="reviewTitleColor" value="${rgbToHex(document.getElementById('reviewTitle').style.color) || '#001f3f'}" onchange="updateColor('reviewTitle', 'color', this.value); saveSetting('reviews', 'titleColor', this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-user-tie"></i> CEO সেকশন</h3>
            
            <div class="control-group">
                <label>CEO ইমেজ আপলোড:</label>
                <input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()">
                <small>বর্তমান CEO ইমেজ দেখতে পাবেন CEO সেকশনে</small>
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
            
            <div class="control-group">
                <label>CEO নাম ফন্ট:</label>
                <select id="ceoNameFont" onchange="updateFont('ceoName', this.value); saveSetting('ceo', 'nameFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('ceoName').style.fontFamily)}
                </select>
            </div>
            
            <div class="control-group">
                <label>CEO নাম সাইজ (px):</label>
                <input type="number" id="ceoNameSize" value="${parseInt(document.getElementById('ceoName').style.fontSize) || 24}" min="10" max="60" onchange="updateSize('ceoName', this.value); saveSetting('ceo', 'nameSize', this.value)">
            </div>
            
            <div class="control-group">
                <label>CEO পদবী ফন্ট:</label>
                <select id="ceoTitleFont" onchange="updateFont('ceoTitle', this.value); saveSetting('ceo', 'titleFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('ceoTitle').style.fontFamily)}
                </select>
            </div>
            
            <div class="control-group">
                <label>CEO বিবরণ ফন্ট:</label>
                <select id="ceoDescFont" onchange="updateFont('ceoDesc', this.value); saveSetting('ceo', 'descFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('ceoDesc').style.fontFamily)}
                </select>
            </div>
        </div>
        
        <div class="control-section">
            <h3><i class="fas fa-copyright"></i> ফুটার সেটিংস</h3>
            
            <div class="control-group">
                <label>কপিরাইট টেক্সট:</label>
                <input type="text" id="copyrightInput" value="${document.getElementById('copyright').innerText}" oninput="updateText('copyright', this.value); saveSetting('footer', 'copyright', this.value)">
            </div>
            
            <div class="control-group">
                <label>ফুটার ব্যাকগ্রাউন্ড:</label>
                <input type="color" id="footerBgInput" value="${rgbToHex(document.getElementById('footerSection').style.background) || '#001f3f'}" onchange="updateColor('footerSection', 'background', this.value); saveSetting('footer', 'bgColor', this.value)">
            </div>
            
            <div class="control-group">
                <label>কপিরাইট ফন্ট:</label>
                <select id="copyrightFont" onchange="updateFont('copyright', this.value); saveSetting('footer', 'copyrightFont', this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(document.getElementById('copyright').style.fontFamily)}
                </select>
            </div>
            
            <div class="control-group">
                <label>কপিরাইট সাইজ (px):</label>
                <input type="number" id="copyrightSize" value="${parseInt(document.getElementById('copyright').style.fontSize) || 14}" min="10" max="40" onchange="updateSize('copyright', this.value); saveSetting('footer', 'copyrightSize', this.value)">
            </div>
        </div>
    `;
    
    loadZoneCardsSettings();
}

// Generate Font Options
function generateFontOptions(currentFont) {
    let options = '<optgroup label="English Fonts">';
    fonts.english.forEach(font => {
        const selected = (font === currentFont) ? 'selected' : '';
        options += `<option value="${font}" ${selected}>${font}</option>`;
    });
    options += '</optgroup><optgroup label="Bangla Fonts">';
    fonts.bangla.forEach(font => {
        const selected = (font === currentFont) ? 'selected' : '';
        options += `<option value="${font}" ${selected}>${font}</option>`;
    });
    options += '</optgroup>';
    return options;
}

// RGB to Hex
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
    
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#000000';
    
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
    document.getElementById(elementId).innerText = value;
}

function updateFont(elementId, font) {
    document.getElementById(elementId).style.fontFamily = font;
}

function updateSize(elementId, size) {
    document.getElementById(elementId).style.fontSize = size + 'px';
}

function updateColor(elementId, property, color) {
    document.getElementById(elementId).style[property] = color;
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

// Load Zone Cards Settings - WITH URL LINKS
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
                        <label>পুরুষ গ্রুপ লিঙ্ক (URL):</label>
                        <input type="url" value="${zone.maleLink || ''}" placeholder="https://chat.whatsapp.com/..." onchange="updateZone(${zone.id}, 'maleLink', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>মহিলা গ্রুপ লিঙ্ক (URL):</label>
                        <input type="url" value="${zone.femaleLink || ''}" placeholder="https://chat.whatsapp.com/..." onchange="updateZone(${zone.id}, 'femaleLink', this.value)">
                    </div>
                    
                    <div class="control-group">
                        <label>মিক্সড গ্রুপ লিঙ্ক (URL):</label>
                        <input type="url" value="${zone.mixedLink || ''}" placeholder="https://chat.whatsapp.com/..." onchange="updateZone(${zone.id}, 'mixedLink', this.value)">
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

// Load Zones - WITH BUTTON VISIBILITY BASED ON ROLE
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
        
        // ONLY TUTORS can see and click the group buttons
        let buttonsHtml = '';
        if (currentUserRole === 'tutor') {
            if (zone.maleLink) {
                buttonsHtml += `<a href="${zone.maleLink}" target="_blank" class="group-btn male-btn"><i class="fab fa-whatsapp"></i> পুরুষ গ্রুপ</a>`;
            }
            if (zone.femaleLink) {
                buttonsHtml += `<a href="${zone.femaleLink}" target="_blank" class="group-btn female-btn"><i class="fab fa-whatsapp"></i> মহিলা গ্রুপ</a>`;
            }
            if (zone.mixedLink) {
                buttonsHtml += `<a href="${zone.mixedLink}" target="_blank" class="group-btn mixed-btn"><i class="fab fa-whatsapp"></i> মিক্সড গ্রুপ</a>`;
            }
        }
        
        card.innerHTML = `
            <h3>${zone.title}</h3>
            <div class="area-tags">${areasHtml}</div>
            ${buttonsHtml ? `<div class="group-buttons" style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">${buttonsHtml}</div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

// Load Reviews - EVERYONE CAN SEE
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(20).get().then(snapshot => {
        const container = document.getElementById('reviewList');
        if (!container) return;
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const card = document.createElement('div');
            card.className = 'review-card';
            
            const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            
            card.innerHTML = `
                <h4>${review.userName || 'Anonymous'} ${review.userRole ? '(' + review.userRole + ')' : ''}</h4>
                <small style="color:#999;">${date}</small>
                <p>${review.text}</p>
            `;
            container.appendChild(card);
        });
    });
}

// Submit Review - ONLY TUTORS & GUARDIANS CAN WRITE
function submitReview() {
    // Double check user role
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
        console.error("Error submitting review:", error);
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
