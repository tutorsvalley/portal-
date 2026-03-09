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
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase Initialized");
} catch (error) {
    console.error("❌ Firebase Init Error:", error);
}

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let currentUserRole = null;
let currentLoginRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

const fonts = {
    bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'Baloo Da 2', 'Mukta', 'Tiro Bangla', 'Kalam', 'Khand', 'Yantramanav', 'Amita', 'Akaya Telivigala'],
    english: ['Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Arial', 'Georgia', 'Verdana', 'Calibri', 'Times New Roman']
};

const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "", whatsappNumber: "" },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "", whatsappNumber: "" },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "", whatsappNumber: "" },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: "", femaleLink: "", whatsappNumber: "" },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: "", femaleLink: "", whatsappNumber: "" },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: "", femaleLink: "", whatsappNumber: "" }
];

// Loading
function showLoading(msg = "লোড হচ্ছে...") {
    hideLoading();
    const div = document.createElement('div');
    div.id = 'loadingScreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 0.3s;';    div.innerHTML = `<div style="width:50px;height:50px;border:4px solid #eee;border-top:4px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:15px;color:#333;font-family:sans-serif;">${msg}</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(div);
    void div.offsetWidth;
    div.style.opacity = '1';
    div.autoHide = setTimeout(() => hideLoading(), 6000);
}

function hideLoading() {
    const div = document.getElementById('loadingScreen');
    if (div) {
        if (div.autoHide) clearTimeout(div.autoHide);
        div.style.opacity = '0';
        setTimeout(() => { if(div.parentNode) div.remove(); }, 300);
    }
}

// Guest Login
function guestLogin() {
    console.log("🟢 Guest login started");
    showLoading("লগইন হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;
    
    auth.signOut().then(() => {
        return auth.signInAnonymously();
    }).then((userCredential) => {
        currentUser = userCredential.user;
        currentUserRole = 'guest';
        
        return db.collection('users').doc(currentUser.uid).set({
            email: 'guest@tutorsvalley.com',
            displayName: 'Guest User',
            role: 'guest',
            isGuest: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }).then(() => {
        console.log("✅ Guest logged in");
        hideLoading();
        showHome();
    }).catch((error) => {
        console.error("❌ Guest login error:", error);
        hideLoading();
        alert("লগইন ব্যর্থ: " + error.message);
        showPage('loginPage');
    });
}

// DOM Loaded Eventdocument.addEventListener('DOMContentLoaded', () => {
    console.log("📄 Page Loaded");
    showLoading("অ্যাপ লোড হচ্ছে...");
    
    // Handle Redirect Result (Mobile Google Login) - FIXED LOOP ISSUE
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            console.log("✅ Redirect result received");
            const savedRole = sessionStorage.getItem('loginRole') || 'tutor';
            currentLoginRole = savedRole;
            sessionStorage.removeItem('loginRole');
            handleLoginSuccess(result.user);
        }
    }).catch((error) => {
        console.error("❌ Redirect error:", error);
        hideLoading();
    });

    // Auth State Observer
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            // Only load user if role is not set yet to prevent loop
            if (!currentUserRole) {
                loadUser(user.uid);
            }
        } else {
            // User signed out
            if(currentUserRole) {
                hideLoading();
                showPage('loginPage');
            }
        }
    });
});

// Handle Login Success
function handleLoginSuccess(user) {
    console.log("🎉 Login success:", user.email);
    
    if (currentLoginRole === 'admin' && user.email !== OWNER_EMAIL) {
        alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
        auth.signOut();
        closeModal();
        hideLoading();
        showPage('loginPage');
        return;
    }

    currentUser = user;    currentUserRole = currentLoginRole;

    db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        role: currentLoginRole,
        provider: 'google',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        console.log("✅ User data saved");
        closeModal();
        hideLoading();
        showHome();
    }).catch((error) => {
        console.error("❌ Save error:", error);
        hideLoading();
        alert("ডাটা সেভ ব্যর্থ: " + error.message);
    });
}

// Load User Data
function loadUser(uid) {
    db.collection('users').doc(uid).get().then((doc) => {
        hideLoading();
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("✅ Role loaded:", currentUserRole);
            showHome();
        } else {
            logout();
        }
    }).catch((error) => {
        console.error("❌ Load user error:", error);
        hideLoading();
        logout();
    });
}

// Show Page
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    const page = document.getElementById(id);
    if (page) {
        page.style.display = 'block';
        page.classList.add('active');
        window.scrollTo(0, 0);
    }}

function openModal(role) {
    currentLoginRole = role;
    const titles = { 'tutor': 'টিউটর লগইন', 'guardian': 'অভিভাবক লগইন', 'admin': 'এডমিন লগইন' };
    const modalTitle = document.getElementById('modalTitle');
    const loginModal = document.getElementById('loginModal');
    
    if (modalTitle) modalTitle.innerText = titles[role] || 'লগইন';
    if (loginModal) loginModal.style.display = 'flex';
}

function closeModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'none';
}

// Google Login
function googleLogin() {
    if (!currentLoginRole) {
        alert("দয়া করে একটি রোল সিলেক্ট করুন");
        return;
    }
    console.log("🔵 Google login started for:", currentLoginRole);
    showLoading("Google লগইন হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;

    auth.signOut().then(() => {
        const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
        if (isMobile) {
            sessionStorage.setItem('loginRole', currentLoginRole);
            return auth.signInWithRedirect(provider);
        } else {
            return auth.signInWithPopup(provider);
        }
    }).then((result) => {
        if (result && result.user) handleLoginSuccess(result.user);
    }).catch((error) => {
        if (!/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            hideLoading();
            alert("লগইন ব্যর্থ: " + error.message);
            showPage('loginPage');
        }
    });
}

// Show Home Page
function showHome() {    console.log("🏠 Showing Home for:", currentUserRole);
    showPage('homePage');
    
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) adminIcon.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    
    Promise.all([loadAllSettings(), loadZones(), loadReviews()]).then(() => {
        console.log("✅ Home data loaded");
        updateFloatingWhatsapp(); // Update floating button on home load
    }).catch(err => console.error("❌ Home load error:", err));
}

// Logout
function logout() {
    console.log("🚪 Logout initiated");
    showLoading("লগআউট হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;
    
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) adminIcon.style.display = 'none';
    
    auth.signOut().then(() => {
        console.log("✅ Logged out");
        hideLoading();
        showPage('loginPage');
    }).catch((error) => {
        console.error("❌ Logout error:", error);
        hideLoading();
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControl() {
    const p = document.getElementById('controlPanel');
    if (!p) return;
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    if (p.style.display === 'block') setTimeout(loadControlPanel, 100);
}

// Helper Functions
function generateFontOptions(current) {
    let h = '<option value="">ডিফল্ট</option>';
    fonts.bangla.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f} (বাংলা)</option>`);
    fonts.english.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f}</option>`);    return h;
}

function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#001f3f';
    const v = rgb.match(/\d+/g);
    if (!v) return '#001f3f';
    return "#" + ((1<<24)+(parseInt(v[0])<<16)+(parseInt(v[1])<<8)+parseInt(v[2])).toString(16).slice(1);
}

function getStyle(id, prop) {
    const el = document.getElementById(id);
    return el ? (el.style[prop] || '') : '';
}

function getText(id) {
    const el = document.getElementById(id);
    return el ? el.innerText : '';
}

function getFontValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    const dataFont = el.getAttribute('data-font');
    if (dataFont) return dataFont;
    return (el.style.fontFamily || '').replace(/'/g, '').split(',')[0].trim();
}

function applyFont(elementId, font) {
    const el = document.getElementById(elementId);
    if (!el || !font) return false;
    el.style.fontFamily = `'${font}', 'Hind Siliguri', sans-serif`;
    el.setAttribute('data-font', font);
    return true;
}

function updateFont(elementId, font) {
    if (!font) { alert("কোনো ফন্ট সিলেক্ট করেননি!"); return; }
    applyFont(elementId, font);
    let collection, field;
    if (elementId === 'branding' || elementId === 'motto') { collection = 'header'; field = elementId + 'Font'; }
    else if (elementId === 'zoneTitle') { collection = 'zones'; field = 'titleFont'; }
    else if (elementId === 'reviewTitle') { collection = 'reviews'; field = 'titleFont'; }
    else if (elementId === 'ceoName') { collection = 'ceo'; field = 'nameFont'; }
    else if (elementId === 'ceoTitle') { collection = 'ceo'; field = 'titleFont'; }
    else if (elementId === 'ceoDesc') { collection = 'ceo'; field = 'descFont'; }
    else if (elementId === 'copyright') { collection = 'footer'; field = 'copyrightFont'; }
    
    if (collection && field) {
        db.collection('settings').doc(collection).update({ [field]: font });    }
}

function saveSetting(collection, field, value) {
    db.collection('settings').doc(collection).update({ [field]: value });
}

function updateLogo() {
    const f = document.getElementById('logoInput').files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { 
        document.getElementById('logo').src = e.target.result; 
        db.collection('settings').doc('header').update({ logoUrl: e.target.result }); 
    };
    r.readAsDataURL(f);
}

function updateCeoImage() {
    const f = document.getElementById('ceoImageInput').files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { 
        document.getElementById('ceoImg').src = e.target.result; 
        db.collection('settings').doc('ceo').update({ imageUrl: e.target.result }); 
    };
    r.readAsDataURL(f);
}

function updateText(id, v) { const e = document.getElementById(id); if (e) e.innerText = v; }
function updateSize(id, v) { const e = document.getElementById(id); if (e) e.style.fontSize = v + 'px'; }
function updateColor(id, p, c) { const e = document.getElementById(id); if (e) e.style[p] = c; }
function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

// Load All Settings
function loadAllSettings() {
    return Promise.all([
        db.collection('settings').doc('header').get(),
        db.collection('settings').doc('zones').get(),
        db.collection('settings').doc('reviews').get(),
        db.collection('settings').doc('ceo').get(),
        db.collection('settings').doc('footer').get()
    ]).then(docs => {
        const [h, z, r, c, f] = docs;
        if (h.exists) {
            const d = h.data();
            if (d.brandingText) document.getElementById('branding').innerText = d.brandingText;            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;
            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
            if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
            if (d.fbTextText) document.getElementById('fbText').innerText = d.fbTextText;
            if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
            if (d.brandingFont) applyFont('branding', d.brandingFont);
            if (d.brandingSize) document.getElementById('branding').style.fontSize = d.brandingSize + 'px';
            if (d.brandingColor) document.getElementById('branding').style.color = d.brandingColor;
            if (d.mottoFont) applyFont('motto', d.mottoFont);
            if (d.mottoSize) document.getElementById('motto').style.fontSize = d.mottoSize + 'px';
            if (d.mottoColor) document.getElementById('motto').style.color = d.mottoColor;
        }
        if (z.exists) {
            const d = z.data();
            if (d.titleText) document.getElementById('zoneTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('zoneTitle', d.titleFont);
            if (d.titleSize) document.getElementById('zoneTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('zoneTitle').style.color = d.titleColor;
        }
        if (r.exists) {
            const d = r.data();
            if (d.titleText) document.getElementById('reviewTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('reviewTitle', d.titleFont);
            if (d.titleSize) document.getElementById('reviewTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('reviewTitle').style.color = d.titleColor;
        }
        if (c.exists) {
            const d = c.data();
            if (d.imageUrl) document.getElementById('ceoImg').src = d.imageUrl;
            if (d.nameText) document.getElementById('ceoName').innerText = d.nameText;
            if (d.titleText) document.getElementById('ceoTitle').innerText = d.titleText;
            if (d.descText) document.getElementById('ceoDesc').innerText = d.descText;
            if (d.nameFont) applyFont('ceoName', d.nameFont);
            if (d.nameSize) document.getElementById('ceoName').style.fontSize = d.nameSize + 'px';
            if (d.titleFont) applyFont('ceoTitle', d.titleFont);
            if (d.descFont) applyFont('ceoDesc', d.descFont);
        }
        if (f.exists) {
            const d = f.data();
            if (d.copyrightText) document.getElementById('copyright').innerText = d.copyrightText;
            if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
            if (d.copyrightFont) applyFont('copyright', d.copyrightFont);
            if (d.copyrightSize) document.getElementById('copyright').style.fontSize = d.copyrightSize + 'px';
            if (d.copyrightColor) document.getElementById('copyright').style.color = d.copyrightColor;
        }
    });
}

// Load Control Panel
function loadControlPanel() {    const body = document.getElementById('controlBody');
    if (!body) return;
    const canEdit = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    body.innerHTML = `
        <div class="control-section">
            <h3>🔷 হেডার</h3>
            <div class="control-group"><label>লোগো:</label><input type="file" id="logoInput" accept="image/*" onchange="updateLogo()"></div>
            <div class="control-group"><label>ব্র্যান্ডিং:</label><input type="text" value="${getText('branding')}" oninput="updateText('branding',this.value);saveSetting('header','brandingText',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং ফন্ট:</label><select onchange="updateFont('branding',this.value)">${generateFontOptions(getFontValue('branding'))}</select></div>
            <div class="control-group"><label>ব্র্যান্ডিং সাইজ:</label><input type="number" value="${parseInt(getStyle('branding','fontSize'))||32}" min="10" max="100" onchange="updateSize('branding',this.value);saveSetting('header','brandingSize',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং কালার:</label><input type="color" value="${rgbToHex(getStyle('branding','color'))||'#ffffff'}" onchange="updateColor('branding','color',this.value);saveSetting('header','brandingColor',this.value)"></div>
            <hr><div class="control-group"><label>মotto:</label><input type="text" value="${getText('motto')}" oninput="updateText('motto',this.value);saveSetting('header','mottoText',this.value)"></div>
            <div class="control-group"><label>মotto ফন্ট:</label><select onchange="updateFont('motto',this.value)">${generateFontOptions(getFontValue('motto'))}</select></div>
            <div class="control-group"><label>মotto সাইজ:</label><input type="number" value="${parseInt(getStyle('motto','fontSize'))||18}" min="10" max="60" onchange="updateSize('motto',this.value);saveSetting('header','mottoSize',this.value)"></div>
            <div class="control-group"><label>মotto কালার:</label><input type="color" value="${rgbToHex(getStyle('motto','color'))||'#ffd700'}" onchange="updateColor('motto','color',this.value);saveSetting('header','mottoColor',this.value)"></div>
            <hr><div class="control-group"><label>হেডার ব্যাকগ্রাউন্ড:</label><input type="color" value="${rgbToHex(getStyle('headerSection','background'))||'#001f3f'}" onchange="updateColor('headerSection','background',this.value);saveSetting('header','headerBg',this.value)"></div>
        </div>
        <div class="control-section">
            <h3>📘 ফেসবুক</h3>
            <div class="control-group"><label>URL:</label><input type="url" value="${document.getElementById('fbBtn').href||'#'}" onchange="updateFbUrl(this.value)"></div>
            <div class="control-group"><label>টেক্সট:</label><input type="text" value="${getText('fbText')}" oninput="updateText('fbText',this.value);saveSetting('header','fbTextText',this.value)"></div>
        </div>
        <div class="control-section">
            <h3>📍 জোন কার্ড</h3>
            <div class="control-group"><label>শিরোনাম:</label><input type="text" value="${getText('zoneTitle')}" oninput="updateText('zoneTitle',this.value);saveSetting('zones','titleText',this.value)"></div>
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select onchange="updateFont('zoneTitle',this.value)">${generateFontOptions(getFontValue('zoneTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(getStyle('zoneTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('zoneTitle',this.value);saveSetting('zones','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="${rgbToHex(getStyle('zoneTitle','color'))||'#001f3f'}" onchange="updateColor('zoneTitle','color',this.value);saveSetting('zones','titleColor',this.value)"></div>
            ${canEdit ? `<hr><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>⚠️ টিউটর নোট:</label><input type="text" id="tutorNote" placeholder="বার্তা লিখুন..." onchange="saveSetting('zones','tutorNote',this.value)"></div><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>নোট সাইজ:</label><input type="number" value="16" onchange="saveSetting('zones','tutorNoteSize',this.value)"></div>` : ''}
            <div id="zoneCardsSettings"></div>
        </div>
        <div class="control-section">
            <h3>💬 রিভিউ</h3>
            <div class="control-group"><label>শিরোনাম:</label><input type="text" value="${getText('reviewTitle')}" oninput="updateText('reviewTitle',this.value);saveSetting('reviews','titleText',this.value)"></div>
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select onchange="updateFont('reviewTitle',this.value)">${generateFontOptions(getFontValue('reviewTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(getStyle('reviewTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('reviewTitle',this.value);saveSetting('reviews','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="${rgbToHex(getStyle('reviewTitle','color'))||'#001f3f'}" onchange="updateColor('reviewTitle','color',this.value);saveSetting('reviews','titleColor',this.value)"></div>
        </div>
        <div class="control-section">
            <h3>👔 CEO</h3>
            <div class="control-group"><label>ইমেজ:</label><input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()"></div>
            <div class="control-group"><label>নাম:</label><input type="text" value="${getText('ceoName')}" oninput="updateText('ceoName',this.value);saveSetting('ceo','nameText',this.value)"></div>
            <div class="control-group"><label>নাম ফন্ট:</label><select onchange="updateFont('ceoName',this.value)">${generateFontOptions(getFontValue('ceoName'))}</select></div>
            <div class="control-group"><label>নাম সাইজ:</label><input type="number" value="${parseInt(getStyle('ceoName','fontSize'))||24}" min="10" max="60" onchange="updateSize('ceoName',this.value);saveSetting('ceo','nameSize',this.value)"></div>
            <div class="control-group"><label>নাম কালার:</label><input type="color" value="${rgbToHex(getStyle('ceoName','color'))||'#001f3f'}" onchange="updateColor('ceoName','color',this.value);saveSetting('ceo','nameColor',this.value)"></div>
            <div class="control-group"><label>পদবী:</label><input type="text" value="${getText('ceoTitle')}" oninput="updateText('ceoTitle',this.value);saveSetting('ceo','titleText',this.value)"></div>
            <div class="control-group"><label>পদবী ফন্ট:</label><select onchange="updateFont('ceoTitle',this.value)">${generateFontOptions(getFontValue('ceoTitle'))}</select></div>
            <div class="control-group"><label>বিবরণ:</label><textarea rows="3" oninput="updateText('ceoDesc',this.value);saveSetting('ceo','descText',this.value)">${getText('ceoDesc')}</textarea></div>
            <div class="control-group"><label>বিবরণ ফন্ট:</label><select onchange="updateFont('ceoDesc',this.value)">${generateFontOptions(getFontValue('ceoDesc'))}</select></div>        </div>
        <div class="control-section">
            <h3>🔻 ফুটার</h3>
            <div class="control-group"><label>কপিরাইট:</label><input type="text" value="${getText('copyright')}" oninput="updateText('copyright',this.value);saveSetting('footer','copyrightText',this.value)"></div>
            <div class="control-group"><label>কপিরাইট ফন্ট:</label><select onchange="updateFont('copyright',this.value)">${generateFontOptions(getFontValue('copyright'))}</select></div>
            <div class="control-group"><label>কপিরাইট সাইজ:</label><input type="number" value="${parseInt(getStyle('copyright','fontSize'))||14}" min="10" max="40" onchange="updateSize('copyright',this.value);saveSetting('footer','copyrightSize',this.value)"></div>
            <div class="control-group"><label>কপিরাইট কালার:</label><input type="color" value="${rgbToHex(getStyle('copyright','color'))||'#ffffff'}" onchange="updateColor('copyright','color',this.value);saveSetting('footer','copyrightColor',this.value)"></div>
            <div class="control-group"><label>ব্যাকগ্রাউন্ড:</label><input type="color" value="${rgbToHex(getStyle('footerSection','background'))||'#001f3f'}" onchange="updateColor('footerSection','background',this.value);saveSetting('footer','bgColor',this.value)"></div>
        </div>
    `;
    loadZoneCardsSettings();
}

// Load Zone Cards Settings (Admin Panel)
function loadZoneCardsSettings() {
    db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneCardsSettings');
        if (!c) return;
        c.innerHTML = '';
        s.forEach(doc => {
            const z = doc.data();
            c.innerHTML += `
                <div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;">
                    <strong>জোন #${z.id}</strong><br>
                    শিরোনাম: <input type="text" value="${z.title}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'title',this.value)"><br>
                    এলাকা: <input type="text" value="${z.areas?z.areas.join(', '):''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'areas',this.value)"><br>
                    
                    <div style="margin:8px 0; padding:8px; background:#e8f5e9; border-radius:5px;">
                        <label style="color:#25D366; font-weight:bold; font-size:0.9em;">📱 হোয়াটসঅ্যাপ নাম্বার (ফিক্সড বাটনের জন্য):</label>
                        <input type="text" value="${z.whatsappNumber||''}" placeholder="উদা: 01712345678" style="width:100%;margin-top:5px; border:1px solid #25D366;" onchange="updateZone(${z.id},'whatsappNumber',this.value)">
                        <small style="color:#25D366; font-size:0.8em;">এই নাম্বারে ফিক্সড বাটনে ক্লিক করলে মেসেজ যাবে</small>
                    </div>

                    মেল গ্রুপ: <input type="url" value="${z.maleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'maleLink',this.value)"><br>
                    ফিমেল গ্রুপ: <input type="url" value="${z.femaleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'femaleLink',this.value)">
                </div>`;
        });
    });
}

function updateZone(id, f, v) {
    if (f === 'areas') v = v.split(',').map(a=>a.trim()).filter(a=>a);
    db.collection('zones').doc(id.toString()).update({ [f]: v });
    // If whatsapp number updated, refresh the floating button
    if (f === 'whatsappNumber') updateFloatingWhatsapp();
}

// Load Zones
function loadZones() {
    return db.collection('zones').get().then(s => {        const c = document.getElementById('zoneContainer');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) {
            defaultZones.forEach(z => db.collection('zones').doc(z.id.toString()).set(z));
            renderZones(defaultZones);
        } else {
            const zones = [];
            s.forEach(doc => zones.push(doc.data()));
            renderZones(zones);
        }
    });
}

// Render Zones
function renderZones(zones) {
    const container = document.getElementById('zoneContainer');
    if (!container) return;
    container.innerHTML = '';
    
    const canSeeButtons = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        
        let areas = '';
        if (zone.areas) areas = zone.areas.map(a => `<span class="area-tag">${a}</span>`).join('');
        
        let buttonsHTML = '';
        if (canSeeButtons) {
            if (zone.maleLink && zone.maleLink.trim() !== '') {
                buttonsHTML += `<a href="${zone.maleLink}" target="_blank" class="group-btn male-btn">👨 মেল গ্রুপ</a>`;
            }
            if (zone.femaleLink && zone.femaleLink.trim() !== '') {
                buttonsHTML += `<a href="${zone.femaleLink}" target="_blank" class="group-btn female-btn">👩 ফিমেল গ্রুপ</a>`;
            }
        }
        
        card.innerHTML = `
            <h3>${zone.title}</h3>
            <div class="area-tags">${areas}</div>
            ${buttonsHTML ? `<div class="button-container">${buttonsHTML}</div>` : ''}
        `;
        container.appendChild(card);
    });

    // Tutor Note Logic
    if (canSeeButtons) {
        db.collection('settings').doc('zones').get().then(doc => {            if (doc.exists && doc.data().tutorNote) {
                const zt = document.getElementById('zoneTitle');
                if (zt) {
                    const old = zt.parentNode.querySelector('.tutor-note');
                    if (old) old.remove();
                    const note = document.createElement('p');
                    note.className = 'tutor-note';
                    note.style.cssText = `background:#fff3cd;color:#856404;padding:10px;border-radius:5px;text-align:center;margin:10px auto;max-width:600px;font-size:${doc.data().tutorNoteSize||16}px;`;
                    note.innerText = '📢 ' + doc.data().tutorNote;
                    zt.parentNode.insertBefore(note, zt.nextSibling);
                }
            }
        });
    }
    
    // Update Floating WhatsApp Button
    updateFloatingWhatsapp();
}

// ✅ Function to Update Floating WhatsApp Button
function updateFloatingWhatsapp() {
    const btn = document.getElementById('floatingWhatsappBtn');
    if (!btn) return;

    // Fetch WhatsApp number from Zone 1
    db.collection('zones').doc('1').get().then(doc => {
        if (doc.exists && doc.data().whatsappNumber) {
            const number = doc.data().whatsappNumber.replace(/[^0-9]/g, '');
            const msg = encodeURIComponent("আসসালামু আলাইকুম, আমি গ্রুপে জয়েন করতে চাই।");
            btn.href = `https://wa.me/${number}?text=${msg}`;
            btn.style.display = 'flex'; // Show button
        } else {
            btn.style.display = 'none'; // Hide if no number
        }
    }).catch(err => {
        console.error("Error fetching whatsapp number:", err);
        btn.style.display = 'none';
    });
}

// Load Reviews
function loadReviews() {
    return db.collection('reviews').orderBy('createdAt','desc').limit(50).get().then(s => {
        const c = document.getElementById('reviewList');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) { c.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">কোনো রিভিউ নেই</p>'; return; }
        s.forEach(doc => {
            const r = doc.data();
            const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('bn-BD') : '';            const card = document.createElement('div');
            card.className = 'review-card';
            const del = currentUserRole === 'admin' ? `<button onclick="deleteReview('${doc.id}')" style="float:right;background:#ff4136;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️</button>` : '';
            card.innerHTML = `${del}<h4>${r.userName||'Anonymous'} ${r.userRole?'('+r.userRole+')':''}</h4><small style="color:#999;">${date}</small><p>${r.text}</p>`;
            c.appendChild(card);
        });
    });
}

function deleteReview(id) {
    if (currentUserRole !== 'admin') { alert("শুধুমাত্র এডমিন রিভিউ ডিলিট করতে পারবেন"); return; }
    if (confirm("ডিলিট করবেন?")) {
        db.collection('reviews').doc(id).delete().then(() => { loadReviews(); alert("ডিলিট হয়েছে"); });
    }
}

function submitReview() {
    if (currentUserRole !== 'tutor' && currentUserRole !== 'guardian') { alert("শুধুমাত্র টিউটর এবং অভিভাবক রিভিউ দিতে পারবেন"); return; }
    const t = document.getElementById('reviewText').value;
    if (!t.trim()) { alert("রিভিউ লিখুন"); return; }
    db.collection('reviews').add({ text: t, userName: currentUser.displayName || currentUser.email || 'Anonymous', userRole: currentUserRole, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
}

console.log("✅ App.js Loaded Successfully");
