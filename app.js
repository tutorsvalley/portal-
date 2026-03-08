// ============================================
// 🔥 TUTORS VALLEY - GENDER BASED WHATSAPP
// ✅ Gender Selection Working
// ✅ WhatsApp Group Links
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
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ 'prompt': 'select_account' });

// Variables
let currentUser = null;
let currentUserRole = null;
let currentLoginRole = null;
let currentUserGender = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Fonts
const fonts = {
    bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'Baloo Da 2', 'Mukta', 'Tiro Bangla', 'Kalam', 'Khand', 'Yantramanav', 'Amita', 'Akaya Telivigala'],
    english: ['Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Arial', 'Georgia', 'Verdana', 'Calibri', 'Times New Roman']
};

const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: " ", femaleLink: " " },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: " ", femaleLink: " " },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: " ", femaleLink: " " },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: " ", femaleLink: " " },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: " ", femaleLink: " " },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: " ", femaleLink: " " }
];

// Loading
function showLoading(msg = "লোড হচ্ছে...") {
    hideLoading();
    const div = document.createElement('div');
    div.id = 'loadingScreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    div.innerHTML = `<div style="width:60px;height:60px;border:4px solid #eee;border-top:4px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:20px;color:#333;font-size:1.2em;">${msg}</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(div);
    div.minTime = setTimeout(() => { div.ready = true; }, 2000);
}

function hideLoading() {
    const div = document.getElementById('loadingScreen');
    if (div) { if (div.minTime) clearTimeout(div.minTime); div.remove(); }
}

// Guest Login
function guestLogin() {
    showLoading("লগইন হচ্ছে...");
    currentUser = null;
    currentUserRole = null;
    auth.signOut().then(() => auth.signInAnonymously()).then(u => {
        currentUser = u.user;
        currentUserRole = 'guest';
        return db.collection('users').doc(u.user.uid).set({ email: 'guest@tutorsvalley.com', displayName: 'Guest', role: 'guest', isGuest: true }, { merge: true });
    }).then(() => {
        const loadingDiv = document.getElementById('loadingScreen');
        if (loadingDiv && loadingDiv.ready) { hideLoading(); showHome(); }
        else if (loadingDiv) { loadingDiv.minTime = setTimeout(() => { hideLoading(); showHome(); }, 2000); }
    }).catch(e => { hideLoading(); alert("Error: " + e.message); });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    showLoading("লোড হচ্ছে...");
    auth.onAuthStateChanged(user => {
        if (user) { currentUser = user; loadUser(user.uid); }
        else {
            const loadingDiv = document.getElementById('loadingScreen');
            if (loadingDiv && loadingDiv.ready) { hideLoading(); showPage('loginPage'); }
            else if (loadingDiv) { loadingDiv.minTime = setTimeout(() => { hideLoading(); showPage('loginPage'); }, 2000); }
        }
    });
});

function loadUser(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            currentUserGender = doc.data().gender || null;
            console.log("Role:", currentUserRole, "Gender:", currentUserGender);
            const loadingDiv = document.getElementById('loadingScreen');
            if (loadingDiv && loadingDiv.ready) { hideLoading(); showHome(); }
            else if (loadingDiv) { loadingDiv.minTime = setTimeout(() => { hideLoading(); showHome(); }, 2000); }
        } else { logout(); }
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

function googleLogin() {
    showLoading("লগইন হচ্ছে...");
    currentUser = null;
    currentUserRole = null;
    auth.signInWithPopup(provider).then(r => {
        if (currentLoginRole === 'admin' && r.user.email !== OWNER_EMAIL) {
            hideLoading();
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut(); closeModal(); return;
        }
        db.collection('users').doc(r.user.uid).set({ email: r.user.email, displayName: r.user.displayName, role: currentLoginRole }, { merge: true }).then(() => {
            closeModal();
            const loadingDiv = document.getElementById('loadingScreen');
            if (loadingDiv && loadingDiv.ready) { hideLoading(); showHome(); }
            else if (loadingDiv) { loadingDiv.minTime = setTimeout(() => { hideLoading(); showHome(); }, 2000); }
        });
    }).catch(e => { hideLoading(); alert("Error: " + e.message); });
}

// ✅ Gender Selection
function selectGender(gender) {
    currentUserGender = gender;
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({ gender: gender });
    }
    const modal = document.getElementById('genderModal');
    if (modal) modal.remove();
    loadZones();
}

function showGenderSelection() {
    const genderHTML = `
        <div id="genderModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;">
            <div style="background:white;padding:40px;border-radius:20px;max-width:400px;text-align:center;">
                <h2 style="color:#001f3f;margin-bottom:20px;">আপনার লিঙ্গ নির্বাচন করুন</h2>
                <p style="color:#666;margin-bottom:30px;">আপনার লিঙ্গ অনুযায়ী WhatsApp গ্রুপ লিংক দেখানো হবে</p>
                <button onclick="selectGender('male')" style="background:#0074D9;color:white;padding:15px 40px;border:none;border-radius:10px;font-size:1.1em;margin:10px;cursor:pointer;width:100%;">👨 পুরুষ</button>
                <button onclick="selectGender('female')" style="background:#FF4136;color:white;padding:15px 40px;border:none;border-radius:10px;font-size:1.1em;margin:10px;cursor:pointer;width:100%;">👩 নারী</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', genderHTML);
}

function showHome() {
    showPage('homePage');
    if (currentUser && !currentUserGender) {
        showGenderSelection();
    }
    document.getElementById('adminIcon').style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    document.getElementById('reviewBox').style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    loadAllSettings();
    loadZones();
    loadReviews();
}

function logout() {
    showLoading("লগআউট হচ্ছে...");
    currentUser = null;
    currentUserRole = null;
    currentUserGender = null;
    const adminIcon = document.getElementById('adminIcon');
    const reviewBox = document.getElementById('reviewBox');
    const zoneContainer = document.getElementById('zoneContainer');
    const reviewList = document.getElementById('reviewList');
    const controlBody = document.getElementById('controlBody');
    const controlPanel = document.getElementById('controlPanel');
    if (adminIcon) adminIcon.style.display = 'none';
    if (reviewBox) reviewBox.style.display = 'none';
    if (zoneContainer) zoneContainer.innerHTML = '';
    if (reviewList) reviewList.innerHTML = '';
    if (controlBody) controlBody.innerHTML = '';
    if (controlPanel) controlPanel.style.display = 'none';
    auth.signOut().then(() => {
        const loadingDiv = document.getElementById('loadingScreen');
        if (loadingDiv && loadingDiv.ready) { hideLoading(); showPage('loginPage'); }
        else if (loadingDiv) { loadingDiv.minTime = setTimeout(() => { hideLoading(); showPage('loginPage'); }, 2000); }
    }).catch(error => { hideLoading(); showPage('loginPage'); });
}

function toggleControl() {
    const p = document.getElementById('controlPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    if (p.style.display === 'block') setTimeout(loadControlPanel, 100);
}

function generateFontOptions(current) {
    let h = ' ডিফল্ট ';
    fonts.bangla.forEach(f => h += `<option value="${f}" ${f === current ? 'selected' : ''}>${f} (বাংলা)</option>`);
    fonts.english.forEach(f => h += `<option value="${f}" ${f === current ? 'selected' : ''}>${f}</option>`);
    return h;
}

function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#001f3f';
    const v = rgb.match(/\d+/g);
    if (!v) return '#001f3f';
    return "#" + ((1 << 24) + (parseInt(v[0]) << 16) + (parseInt(v[1]) << 8) + parseInt(v[2])).toString(16).slice(1);
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
    if (!el || !font) { console.log("❌ Element or font not found:", elementId, font); return false; }
    el.style.cssText = '';
    el.removeAttribute('style');
    el.style.setProperty('font-family', `'${font}', 'Hind Siliguri', sans-serif`, 'important');
    el.setAttribute('style', `font-family: '${font}', 'Hind Siliguri', sans-serif !important;`);
    el.setAttribute('data-font', font);
    void el.offsetWidth;
    return true;
}

function updateFont(elementId, font) {
    if (!font) { alert("কোনো ফন্ট সিলেক্ট করেননি!"); return; }
    const success = applyFont(elementId, font);
    if (!success) { return; }
    let collection, field;
    if (elementId === 'branding') { collection = 'header'; field = 'brandingFont'; }
    else if (elementId === 'motto') { collection = 'header'; field = 'mottoFont'; }
    else if (elementId === 'zoneTitle') { collection = 'zones'; field = 'titleFont'; }
    else if (elementId === 'reviewTitle') { collection = 'reviews'; field = 'titleFont'; }
    else if (elementId === 'ceoName') { collection = 'ceo'; field = 'nameFont'; }
    else if (elementId === 'ceoTitle') { collection = 'ceo'; field = 'titleFont'; }
    else if (elementId === 'ceoDesc') { collection = 'ceo'; field = 'descFont'; }
    else if (elementId === 'copyright') { collection = 'footer'; field = 'copyrightFont'; }
    if (collection && field) {
        const updateData = { [field]: font, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        db.collection('settings').doc(collection).update(updateData)
            .then(() => {
                const selectId = elementId + 'FontSelect';
                const select = document.getElementById(selectId);
                if (select) select.value = font;
                setTimeout(() => { alert(`✅ Font changed: ${font}\n\nPage reload দিন (F5)`); }, 500);
            })
            .catch(error => { console.error("❌ Save failed: ", error); });
    }
}

function saveSetting(collection, field, value) {
    const updateData = { [field]: value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    db.collection('settings').doc(collection).update(updateData)
        .then(() => { setTimeout(() => { loadAllSettings(); }, 500); })
        .catch((error) => { console.error(`❌ Error:`, error); db.collection('settings').doc(collection).set(updateData); });
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
            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;
            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
            if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
            if (d.fbTextText) document.getElementById('fbText').innerText = d.fbTextText;
            if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
            if (d.brandingFont) { setTimeout(() => { applyFont('branding', d.brandingFont); }, 100); }
            if (d.brandingSize) document.getElementById('branding').style.fontSize = d.brandingSize + 'px';
            if (d.brandingColor) document.getElementById('branding').style.color = d.brandingColor;
            if (d.mottoFont) { setTimeout(() => { applyFont('motto', d.mottoFont); }, 200); }
            if (d.mottoSize) document.getElementById('motto').style.fontSize = d.mottoSize + 'px';
            if (d.mottoColor) document.getElementById('motto').style.color = d.mottoColor;
        }
        if (z.exists) {
            const d = z.data();
            if (d.titleText) document.getElementById('zoneTitle').innerText = d.titleText;
            if (d.titleFont) { setTimeout(() => { applyFont('zoneTitle', d.titleFont); }, 300); }
            if (d.titleSize) document.getElementById('zoneTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('zoneTitle').style.color = d.titleColor;
        }
        if (r.exists) {
            const d = r.data();
            if (d.titleText) document.getElementById('reviewTitle').innerText = d.titleText;
            if (d.titleFont) { setTimeout(() => { applyFont('reviewTitle', d.titleFont); }, 400); }
            if (d.titleSize) document.getElementById('reviewTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('reviewTitle').style.color = d.titleColor;
        }
        if (c.exists) {
            const d = c.data();
            if (d.imageUrl) document.getElementById('ceoImg').src = d.imageUrl;
            if (d.nameText) document.getElementById('ceoName').innerText = d.nameText;
            if (d.titleText) document.getElementById('ceoTitle').innerText = d.titleText;
            if (d.descText) document.getElementById('ceoDesc').innerText = d.descText;
            if (d.nameFont) { setTimeout(() => { applyFont('ceoName', d.nameFont); }, 500); }
            if (d.nameSize) document.getElementById('ceoName').style.fontSize = d.nameSize + 'px';
            if (d.titleFont) applyFont('ceoTitle', d.titleFont);
            if (d.descFont) applyFont('ceoDesc', d.descFont);
        }
        if (f.exists) {
            const d = f.data();
            if (d.copyrightText) document.getElementById('copyright').innerText = d.copyrightText;
            if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
            if (d.copyrightFont) { setTimeout(() => { applyFont('copyright', d.copyrightFont); }, 600); }
            if (d.copyrightSize) document.getElementById('copyright').style.fontSize = d.copyrightSize + 'px';
            if (d.copyrightColor) document.getElementById('copyright').style.color = d.copyrightColor;
        }
        setTimeout(updateFontSelects, 1000);
    });
}

function updateFontSelects() {
    const setSelectValue = (selectId, value) => {
        const select = document.getElementById(selectId);
        if (select && value) { select.value = value; }
    };
    setSelectValue('brandingFontSelect', getFontValue('branding'));
    setSelectValue('mottoFontSelect', getFontValue('motto'));
    setSelectValue('zoneTitleFontSelect', getFontValue('zoneTitle'));
    setSelectValue('reviewTitleFontSelect', getFontValue('reviewTitle'));
    setSelectValue('ceoNameFontSelect', getFontValue('ceoName'));
    setSelectValue('ceoTitleFontSelect', getFontValue('ceoTitle'));
    setSelectValue('ceoDescFontSelect', getFontValue('ceoDesc'));
    setSelectValue('copyrightFontSelect', getFontValue('copyright'));
}

function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;
    const canEdit = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    body.innerHTML = `
     <div class="control-section">
         <h3>🔷 হেডার</h3>
         <div class="control-group"> <label>লোগো:</label> <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()"> </div>
         <div class="control-group"> <label>ব্র্যান্ডিং:</label> <input type="text" value="${getText('branding')}" oninput="updateText('branding',this.value);saveSetting('header','brandingText',this.value)"> </div>
         <div class="control-group"> <label>ব্র্যান্ডিং ফন্ট:</label> <select id="brandingFontSelect" onchange="updateFont('branding',this.value)">${generateFontOptions(getFontValue('branding'))}</select> </div>
         <div class="control-group"> <label>ব্র্যান্ডিং সাইজ:</label> <input type="number" value="${parseInt(getStyle('branding','fontSize'))||32}" min="10" max="100" onchange="updateSize('branding',this.value);saveSetting('header','brandingSize',this.value)"> </div>
         <div class="control-group"> <label>ব্র্যান্ডিং কালার:</label> <input type="color" value="${rgbToHex(getStyle('branding','color'))||'#ffffff'}" onchange="updateColor('branding','color',this.value);saveSetting('header','brandingColor',this.value)"> </div>
         <hr> <div class="control-group"> <label>মotto:</label> <input type="text" value="${getText('motto')}" oninput="updateText('motto',this.value);saveSetting('header','mottoText',this.value)"> </div>
         <div class="control-group"> <label>মotto ফন্ট:</label> <select id="mottoFontSelect" onchange="updateFont('motto',this.value)">${generateFontOptions(getFontValue('motto'))}</select> </div>
         <div class="control-group"> <label>মotto সাইজ:</label> <input type="number" value="${parseInt(getStyle('motto','fontSize'))||18}" min="10" max="60" onchange="updateSize('motto',this.value);saveSetting('header','mottoSize',this.value)"> </div>
         <div class="control-group"> <label>মotto কালার:</label> <input type="color" value="${rgbToHex(getStyle('motto','color'))||'#ffd700'}" onchange="updateColor('motto','color',this.value);saveSetting('header','mottoColor',this.value)"> </div>
         <hr> <div class="control-group"> <label>হেডার ব্যাকগ্রাউন্ড:</label> <input type="color" value="${rgbToHex(getStyle('headerSection','background'))||'#001f3f'}" onchange="updateColor('headerSection','background',this.value);saveSetting('header','headerBg',this.value)"> </div>
     </div>
     <div class="control-section">
         <h3>📘 ফেসবুক</h3>
         <div class="control-group"> <label>URL:</label> <input type="url" value="${document.getElementById('fbBtn').href||'#'}" onchange="updateFbUrl(this.value)"> </div>
         <div class="control-group"> <label>টেক্সট:</label> <input type="text" value="${getText('fbText')}" oninput="updateText('fbText',this.value);saveSetting('header','fbTextText',this.value)"> </div>
     </div>
     <div class="control-section">
         <h3>📍 জোন কার্ড</h3>
         <div class="control-group"> <label>শিরোনাম:</label> <input type="text" value="${getText('zoneTitle')}" oninput="updateText('zoneTitle',this.value);saveSetting('zones','titleText',this.value)"> </div>
         <div class="control-group"> <label>শিরোনাম ফন্ট:</label> <select id="zoneTitleFontSelect" onchange="updateFont('zoneTitle',this.value)">${generateFontOptions(getFontValue('zoneTitle'))}</select> </div>
         <div class="control-group"> <label>শিরোনাম সাইজ:</label> <input type="number" value="${parseInt(getStyle('zoneTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('zoneTitle',this.value);saveSetting('zones','titleSize',this.value)"> </div>
         <div class="control-group"> <label>শিরোনাম কালার:</label> <input type="color" value="${rgbToHex(getStyle('zoneTitle','color'))||'#001f3f'}" onchange="updateColor('zoneTitle','color',this.value);saveSetting('zones','titleColor',this.value)"> </div>
        ${canEdit ? `<hr> <div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"> <label>⚠️ টিউটর নোট:</label> <input type="text" id="tutorNote" placeholder="বার্তা লিখুন..." onchange="saveSetting('zones','tutorNote',this.value)"> </div> <div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"> <label>নোট সাইজ:</label> <input type="number" value="16" min="10" max="40" onchange="saveSetting('zones','tutorNoteSize',this.value)"> </div>` : ''}
         <div id="zoneCardsSettings"> </div>
     </div>
     <div class="control-section">
         <h3>💬 রিভিউ</h3>
         <div class="control-group"> <label>শিরোনাম:</label> <input type="text" value="${getText('reviewTitle')}" oninput="updateText('reviewTitle',this.value);saveSetting('reviews','titleText',this.value)"> </div>
         <div class="control-group"> <label>শিরোনাম ফন্ট:</label> <select id="reviewTitleFontSelect" onchange="updateFont('reviewTitle',this.value)">${generateFontOptions(getFontValue('reviewTitle'))}</select> </div>
         <div class="control-group"> <label>শিরোনাম সাইজ:</label> <input type="number" value="${parseInt(getStyle('reviewTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('reviewTitle',this.value);saveSetting('reviews','titleSize',this.value)"> </div>
         <div class="control-group"> <label>শিরোনাম কালার:</label> <input type="color" value="${rgbToHex(getStyle('reviewTitle','color'))||'#001f3f'}" onchange="updateColor('reviewTitle','color',this.value);saveSetting('reviews','titleColor',this.value)"> </div>
     </div>
     <div class="control-section">
         <h3>👔 CEO</h3>
         <div class="control-group"> <label>ইমেজ:</label> <input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()"> </div>
         <div class="control-group"> <label>নাম:</label> <input type="text" value="${getText('ceoName')}" oninput="updateText('ceoName',this.value);saveSetting('ceo','nameText',this.value)"> </div>
         <div class="control-group"> <label>নাম ফন্ট:</label> <select id="ceoNameFontSelect" onchange="updateFont('ceoName',this.value)">${generateFontOptions(getFontValue('ceoName'))}</select> </div>
         <div class="control-group"> <label>নাম সাইজ:</label> <input type="number" value="${parseInt(getStyle('ceoName','fontSize'))||24}" min="10" max="60" onchange="updateSize('ceoName',this.value);saveSetting('ceo','nameSize',this.value)"> </div>
         <div class="control-group"> <label>নাম কালার:</label> <input type="color" value="${rgbToHex(getStyle('ceoName','color'))||'#001f3f'}" onchange="updateColor('ceoName','color',this.value);saveSetting('ceo','nameColor',this.value)"> </div>
         <div class="control-group"> <label>পদবী:</label> <input type="text" value="${getText('ceoTitle')}" oninput="updateText('ceoTitle',this.value);saveSetting('ceo','titleText',this.value)"> </div>
         <div class="control-group"> <label>পদবী ফন্ট:</label> <select id="ceoTitleFontSelect" onchange="updateFont('ceoTitle',this.value)">${generateFontOptions(getFontValue('ceoTitle'))}</select> </div>
         <div class="control-group"> <label>বিবরণ:</label> <textarea rows="3" oninput="updateText('ceoDesc',this.value);saveSetting('ceo','descText',this.value)">${getText('ceoDesc')}</textarea> </div>
         <div class="control-group"> <label>বিবরণ ফন্ট:</label> <select id="ceoDescFontSelect" onchange="updateFont('ceoDesc',this.value)">${generateFontOptions(getFontValue('ceoDesc'))}</select> </div>
     </div>
     <div class="control-section">
         <h3>🔻 ফুটার</h3>
         <div class="control-group"> <label>কপিরাইট:</label> <input type="text" value="${getText('copyright')}" oninput="updateText('copyright',this.value);saveSetting('footer','copyrightText',this.value)"> </div>
         <div class="control-group"> <label>কপিরাইট ফন্ট:</label> <select id="copyrightFontSelect" onchange="updateFont('copyright',this.value)">${generateFontOptions(getFontValue('copyright'))}</select> </div>
         <div class="control-group"> <label>কপিরাইট সাইজ:</label> <input type="number" value="${parseInt(getStyle('copyright','fontSize'))||14}" min="10" max="40" onchange="updateSize('copyright',this.value);saveSetting('footer','copyrightSize',this.value)"> </div>
         <div class="control-group"> <label>কপিরাইট কালার:</label> <input type="color" value="${rgbToHex(getStyle('copyright','color'))||'#ffffff'}" onchange="updateColor('copyright','color',this.value);saveSetting('footer','copyrightColor',this.value)"> </div>
         <div class="control-group"> <label>ব্যাকগ্রাউন্ড:</label> <input type="color" value="${rgbToHex(getStyle('footerSection','background'))||'#001f3f'}" onchange="updateColor('footerSection','background',this.value);saveSetting('footer','bgColor',this.value)"> </div>
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
            c.innerHTML += `<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;"><strong>জোন #${z.id}</strong><br>শিরোনাম: <input type="text" value="${z.title}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'title',this.value)"><br>এলাকা: <input type="text" value="${z.areas ? z.areas.join(', ') : ''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'areas',this.value)"><br>মেল গ্রুপ: <input type="url" value="${z.maleLink || ''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'maleLink',this.value)"><br>ফিমেল গ্রুপ: <input type="url" value="${z.femaleLink || ''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'femaleLink',this.value)"></div>`;
        });
    });
}

function updateZone(id, f, v) {
    if (f === 'areas') v = v.split(',').map(a => a.trim()).filter(a => a);
    db.collection('zones').doc(id.toString()).update({ [f]: v });
}

function loadZones() {
    db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneContainer');
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

// ✅ Render Zones with Gender Filter
function renderZones(zones) {
    const c = document.getElementById('zoneContainer');
    if (!c) return;
    c.innerHTML = '';
    const canSee = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    zones.forEach(z => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        let areas = z.areas ? z.areas.map(a => `<span class="area-tag">${a}</span>`).join('') : '';
        let btns = '';
        
        if (canSee) {
            // Show buttons based on gender
            if (currentUserGender === 'male' && z.maleLink && z.maleLink.trim() !== ' ') {
                btns += `<a href="${z.maleLink}" target="_blank" class="group-btn male-btn">📱 Join WhatsApp Group</a>`;
            } else if (currentUserGender === 'female' && z.femaleLink && z.femaleLink.trim() !== ' ') {
                btns += `<a href="${z.femaleLink}" target="_blank" class="group-btn female-btn">📱 Join WhatsApp Group</a>`;
            } else if (!currentUserGender) {
                // If no gender selected, show both
                if (z.maleLink && z.maleLink.trim() !== ' ') {
                    btns += `<a href="${z.maleLink}" target="_blank" class="group-btn male-btn">📱 Join WhatsApp Group (Male)</a>`;
                }
                if (z.femaleLink && z.femaleLink.trim() !== ' ') {
                    btns += `<a href="${z.femaleLink}" target="_blank" class="group-btn female-btn">📱 Join WhatsApp Group (Female)</a>`;
                }
            }
        }
        
        card.innerHTML = `<h3>${z.title}</h3> <div class="area-tags">${areas}</div>${btns ? '<div style="margin-top:10px;">' + btns + '</div>' : ''}`;
        c.appendChild(card);
    });

    if (canSee) {
        db.collection('settings').doc('zones').get().then(doc => {
            if (doc.exists && doc.data().tutorNote) {
                const zt = document.getElementById('zoneTitle');
                if (zt) {
                    const old = zt.parentNode.querySelector('.tutor-note');
                    if (old) old.remove();
                    const note = document.createElement('p');
                    note.className = 'tutor-note';
                    note.style.cssText = `background:#fff3cd;color:#856404;padding:10px;border-radius:5px;text-align:center;margin:10px auto;max-width:600px;font-size:${doc.data().tutorNoteSize || 16}px;`;
                    note.innerText = '📢 ' + doc.data().tutorNote;
                    zt.parentNode.insertBefore(note, zt.nextSibling);
                }
            }
        });
    }
}

function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').limit(50).get().then(s => {
        const c = document.getElementById('reviewList');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) { c.innerHTML = 'কোনো রিভিউ নেই'; return; }
        s.forEach(doc => {
            const r = doc.data();
            const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            const card = document.createElement('div');
            card.className = 'review-card';
            const del = currentUserRole === 'admin' ? `<button onclick="deleteReview('${doc.id}')" style="float:right;background:#ff4136;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️</button>` : '';
            card.innerHTML = `${del}<h4>${r.userName || 'Anonymous'} ${r.userRole ? '(' + r.userRole + ')' : ''}</h4><small style="color:#999;">${date}</small><p>${r.text}</p>`;
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

window.onclick = e => { if (e.target === document.getElementById('loginModal')) closeModal(); };
console.log("✅ app.js loaded successfully");
