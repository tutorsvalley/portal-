// ============================================
// 🔥 TUTORS VALLEY - GOOGLE LOGIN FIXED
// ✅ Mobile + Desktop Compatible
// ✅ Better Error Handling
// ============================================

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
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Google Provider Setup
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({ prompt: 'select_account' });

// Variables
let currentUser = null;
let currentUserRole = null;
let currentLoginRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Fonts
const fonts = {
    bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'Baloo Da 2', 'Mukta', 'Tiro Bangla', 'Kalam', 'Khand', 'Yantramanav', 'Amita', 'Akaya Telivigala'],
    english: ['Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Arial', 'Georgia', 'Verdana', 'Calibri', 'Times New Roman']
};

const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "" },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "" },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "" },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: "", femaleLink: "" },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: "", femaleLink: "" },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: "", femaleLink: "" }
];
// Loading
function showLoading(msg = "লোড হচ্ছে...") {
    hideLoading();
    const div = document.createElement('div');
    div.id = 'loadingScreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    div.innerHTML = `<div style="width:60px;height:60px;border:4px solid #eee;border-top:4px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:20px;color:#333;">${msg}</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(div);
    div.autoHide = setTimeout(() => hideLoading(), 5000);
}

function hideLoading() {
    const div = document.getElementById('loadingScreen');
    if (div) { if (div.autoHide) clearTimeout(div.autoHide); div.remove(); }
}

// Guest Login
function guestLogin() {
    showLoading("লগইন হচ্ছে...");
    auth.signOut().then(() => auth.signInAnonymously()).then(u => {
        currentUser = u.user;
        currentUserRole = 'guest';
        return db.collection('users').doc(u.user.uid).set({ email: 'guest@tutorsvalley.com', displayName: 'Guest', role: 'guest', isGuest: true }, { merge: true });
    }).then(() => { hideLoading(); showHome(); }).catch(e => { hideLoading(); alert("Error: " + e.message); });
}

// ✅ DOM Loaded - Handle Redirect Result FIRST
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 Page loaded");
    showLoading("লোড হচ্ছে...");
    
    // ✅ Handle redirect result (for mobile)
    auth.getRedirectResult().then(result => {
        if (result.user) {
            console.log("✅ Redirect login successful");
            handleLoginSuccess(result.user);
        }
    }).catch(error => {
        console.error("❌ Redirect error:", error);
        hideLoading();
    });
    
    // Auth state observer
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            // Only load user if we haven't already handled redirect
            if (!user.metadata.creationTime || currentUserRole === null) {
                loadUser(user.uid);            }
        } else {
            console.log("❌ No user - showing login");
            hideLoading();
            showPage('loginPage');
        }
    });
});

// ✅ Handle Login Success
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
    
    db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: currentLoginRole,
        provider: 'google',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        console.log("✅ User data saved");
        closeModal();
        hideLoading();
        showHome();
    }).catch(error => {
        console.error("❌ Save error:", error);
        hideLoading();
        alert("Data save failed: " + error.message);
    });
}

function loadUser(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        hideLoading();
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("✅ Role loaded:", currentUserRole);
            showHome();
        } else {
            console.log("❌ No user doc");            logout();
        }
    }).catch(error => {
        console.error("❌ Load error:", error);
        hideLoading();
        logout();
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function openModal(role) {
    currentLoginRole = role;
    document.getElementById('modalTitle').innerText = { 'tutor': 'টিউটর লগইন', 'guardian': 'অভিভাবক লগইন', 'admin': 'এডমিন লগইন' }[role];
    document.getElementById('loginModal').style.display = 'block';
}

function closeModal() { document.getElementById('loginModal').style.display = 'none'; }

// ✅ GOOGLE LOGIN - Mobile + Desktop Compatible
function googleLogin() {
    console.log("🔵 Google login clicked, role:", currentLoginRole);
    showLoading("Google লগইন হচ্ছে...");
    
    // ✅ Try popup first (works on desktop)
    auth.signInWithPopup(provider)
        .then(result => {
            console.log("✅ Popup login successful");
            handleLoginSuccess(result.user);
        })
        .catch(error => {
            console.error("❌ Popup failed:", error.code, error.message);
            
            // ✅ Fallback to redirect for mobile
            if (error.code === 'auth/popup-blocked' || 
                error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request' ||
                error.message.includes('popup') ||
                /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
                
                console.log("🔄 Trying redirect method for mobile...");
                
                // Save login role for redirect
                try {
                    sessionStorage.setItem('loginRole', currentLoginRole);
                } catch(e) {}
                                // Use redirect instead
                auth.signInWithRedirect(provider);
                
            } else {
                // Show specific error
                hideLoading();
                let msg = "লগইন ব্যর্থ! ";
                if (error.code === 'auth/unauthorized-domain') {
                    msg += "এই domain authorized নয়।";
                } else if (error.code === 'auth/operation-not-allowed') {
                    msg += "Google Sign-In enable করুন Firebase Console এ।";
                } else if (error.code === 'auth/network-request-failed') {
                    msg += "ইন্টারনেট সংযোগ চেক করুন।";
                } else {
                    msg += error.message;
                }
                alert(msg);
                console.error("Final error:", error);
            }
        });
}

function showHome() {
    console.log("🏠 Showing home, role:", currentUserRole);
    showPage('homePage');
    
    document.getElementById('adminIcon').style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    document.getElementById('reviewBox').style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    
    loadAllSettings();
    loadZones();
    loadReviews();
}

function logout() {
    console.log("🚪 Logging out");
    currentUser = null;
    currentUserRole = null;
    document.getElementById('adminIcon').style.display = 'none';
    auth.signOut().then(() => {
        showPage('loginPage');
    });
}

function toggleControl() {
    const p = document.getElementById('controlPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    if (p.style.display === 'block') setTimeout(loadControlPanel, 100);
}
function generateFontOptions(current) {
    let h = '<option value="">ডিফল্ট</option>';
    fonts.bangla.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f} (বাংলা)</option>`);
    fonts.english.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f}</option>`);
    return h;
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
    const font = el.style.fontFamily || '';
    return font.replace(/'/g, '').split(',')[0].trim();
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
    if (elementId === 'branding') { collection = 'header'; field = 'brandingFont'; }
    else if (elementId === 'motto') { collection = 'header'; field = 'mottoFont'; }
    else if (elementId === 'zoneTitle') { collection = 'zones'; field = 'titleFont'; }
    else if (elementId === 'reviewTitle') { collection = 'reviews'; field = 'titleFont'; }
    else if (elementId === 'ceoName') { collection = 'ceo'; field = 'nameFont'; }    else if (elementId === 'ceoTitle') { collection = 'ceo'; field = 'titleFont'; }
    else if (elementId === 'ceoDesc') { collection = 'ceo'; field = 'descFont'; }
    else if (elementId === 'copyright') { collection = 'footer'; field = 'copyrightFont'; }
    if (collection && field) {
        db.collection('settings').doc(collection).update({ [field]: font });
    }
}

function saveSetting(collection, field, value) {
    db.collection('settings').doc(collection).update({ [field]: value });
}

function updateLogo() {
    const f = document.getElementById('logoInput').files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { document.getElementById('logo').src = e.target.result; db.collection('settings').doc('header').update({ logoUrl: e.target.result }); };
    r.readAsDataURL(f);
}

function updateCeoImage() {
    const f = document.getElementById('ceoImageInput').files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { document.getElementById('ceoImg').src = e.target.result; db.collection('settings').doc('ceo').update({ imageUrl: e.target.result }); };
    r.readAsDataURL(f);
}

function updateText(id, v) { const e = document.getElementById(id); if (e) e.innerText = v; }
function updateSize(id, v) { const e = document.getElementById(id); if (e) e.style.fontSize = v + 'px'; }
function updateColor(id, p, c) { const e = document.getElementById(id); if (e) e.style[p] = c; }

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

function loadAllSettings() {
    Promise.all([
        db.collection('settings').doc('header').get(),
        db.collection('settings').doc('zones').get(),
        db.collection('settings').doc('reviews').get(),
        db.collection('settings').doc('ceo').get(),
        db.collection('settings').doc('footer').get()
    ]).then(docs => {
        const [h, z, r, c, f] = docs;
        if (h.exists) {
            const d = h.data();
            if (d.brandingText) document.getElementById('branding').innerText = d.brandingText;
            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
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

function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;    const canEdit = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    body.innerHTML = `
        <div class="control-section">
            <h3>🔷 হেডার</h3>
            <div class="control-group"><label>লোগো:</label><input type="file" id="logoInput" accept="image/*" onchange="updateLogo()"></div>
            <div class="control-group"><label>ব্র্যান্ডিং:</label><input type="text" value="${getText('branding')}" oninput="updateText('branding',this.value);saveSetting('header','brandingText',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং ফন্ট:</label><select id="brandingFontSelect" onchange="updateFont('branding',this.value)">${generateFontOptions(getFontValue('branding'))}</select></div>
            <div class="control-group"><label>ব্র্যান্ডিং সাইজ:</label><input type="number" value="${parseInt(getStyle('branding','fontSize'))||32}" min="10" max="100" onchange="updateSize('branding',this.value);saveSetting('header','brandingSize',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং কালার:</label><input type="color" value="${rgbToHex(getStyle('branding','color'))||'#ffffff'}" onchange="updateColor('branding','color',this.value);saveSetting('header','brandingColor',this.value)"></div>
            <hr><div class="control-group"><label>মotto:</label><input type="text" value="${getText('motto')}" oninput="updateText('motto',this.value);saveSetting('header','mottoText',this.value)"></div>
            <div class="control-group"><label>মotto ফন্ট:</label><select id="mottoFontSelect" onchange="updateFont('motto',this.value)">${generateFontOptions(getFontValue('motto'))}</select></div>
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
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select id="zoneTitleFontSelect" onchange="updateFont('zoneTitle',this.value)">${generateFontOptions(getFontValue('zoneTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(getStyle('zoneTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('zoneTitle',this.value);saveSetting('zones','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="${rgbToHex(getStyle('zoneTitle','color'))||'#001f3f'}" onchange="updateColor('zoneTitle','color',this.value);saveSetting('zones','titleColor',this.value)"></div>
            ${canEdit ? `<hr><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>⚠️ টিউটর নোট:</label><input type="text" id="tutorNote" placeholder="বার্তা লিখুন..." onchange="saveSetting('zones','tutorNote',this.value)"></div><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>নোট সাইজ:</label><input type="number" value="16" min="10" max="40" onchange="saveSetting('zones','tutorNoteSize',this.value)"></div>` : ''}
            <div id="zoneCardsSettings"></div>
        </div>
        <div class="control-section">
            <h3>💬 রিভিউ</h3>
            <div class="control-group"><label>শিরোনাম:</label><input type="text" value="${getText('reviewTitle')}" oninput="updateText('reviewTitle',this.value);saveSetting('reviews','titleText',this.value)"></div>
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select id="reviewTitleFontSelect" onchange="updateFont('reviewTitle',this.value)">${generateFontOptions(getFontValue('reviewTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(getStyle('reviewTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('reviewTitle',this.value);saveSetting('reviews','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="${rgbToHex(getStyle('reviewTitle','color'))||'#001f3f'}" onchange="updateColor('reviewTitle','color',this.value);saveSetting('reviews','titleColor',this.value)"></div>
        </div>
        <div class="control-section">
            <h3>👔 CEO</h3>
            <div class="control-group"><label>ইমেজ:</label><input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()"></div>
            <div class="control-group"><label>নাম:</label><input type="text" value="${getText('ceoName')}" oninput="updateText('ceoName',this.value);saveSetting('ceo','nameText',this.value)"></div>
            <div class="control-group"><label>নাম ফন্ট:</label><select id="ceoNameFontSelect" onchange="updateFont('ceoName',this.value)">${generateFontOptions(getFontValue('ceoName'))}</select></div>
            <div class="control-group"><label>নাম সাইজ:</label><input type="number" value="${parseInt(getStyle('ceoName','fontSize'))||24}" min="10" max="60" onchange="updateSize('ceoName',this.value);saveSetting('ceo','nameSize',this.value)"></div>
            <div class="control-group"><label>নাম কালার:</label><input type="color" value="${rgbToHex(getStyle('ceoName','color'))||'#001f3f'}" onchange="updateColor('ceoName','color',this.value);saveSetting('ceo','nameColor',this.value)"></div>
            <div class="control-group"><label>পদবী:</label><input type="text" value="${getText('ceoTitle')}" oninput="updateText('ceoTitle',this.value);saveSetting('ceo','titleText',this.value)"></div>
            <div class="control-group"><label>পদবী ফন্ট:</label><select id="ceoTitleFontSelect" onchange="updateFont('ceoTitle',this.value)">${generateFontOptions(getFontValue('ceoTitle'))}</select></div>
            <div class="control-group"><label>বিবরণ:</label><textarea rows="3" oninput="updateText('ceoDesc',this.value);saveSetting('ceo','descText',this.value)">${getText('ceoDesc')}</textarea></div>
            <div class="control-group"><label>বিবরণ ফন্ট:</label><select id="ceoDescFontSelect" onchange="updateFont('ceoDesc',this.value)">${generateFontOptions(getFontValue('ceoDesc'))}</select></div>
        </div>
        <div class="control-section">
            <h3>🔻 ফুটার</h3>            <div class="control-group"><label>কপিরাইট:</label><input type="text" value="${getText('copyright')}" oninput="updateText('copyright',this.value);saveSetting('footer','copyrightText',this.value)"></div>
            <div class="control-group"><label>কপিরাইট ফন্ট:</label><select id="copyrightFontSelect" onchange="updateFont('copyright',this.value)">${generateFontOptions(getFontValue('copyright'))}</select></div>
            <div class="control-group"><label>কপিরাইট সাইজ:</label><input type="number" value="${parseInt(getStyle('copyright','fontSize'))||14}" min="10" max="40" onchange="updateSize('copyright',this.value);saveSetting('footer','copyrightSize',this.value)"></div>
            <div class="control-group"><label>কপিরাইট কালার:</label><input type="color" value="${rgbToHex(getStyle('copyright','color'))||'#ffffff'}" onchange="updateColor('copyright','color',this.value);saveSetting('footer','copyrightColor',this.value)"></div>
            <div class="control-group"><label>ব্যাকগ্রাউন্ড:</label><input type="color" value="${rgbToHex(getStyle('footerSection','background'))||'#001f3f'}" onchange="updateColor('footerSection','background',this.value);saveSetting('footer','bgColor',this.value)"></div>
        </div>
    `;
    loadZoneCardsSettings();
}

function loadZoneCardsSettings() {
    db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneCardsSettings');
        if (!c) return;
        c.innerHTML = '';
        s.forEach(doc => {
            const z = doc.data();
            c.innerHTML += `<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;"><strong>জোন #${z.id}</
