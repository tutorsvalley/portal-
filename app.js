// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

firebase.initializeApp(firebaseConfig);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ 'prompt': 'select_account' });

let currentUser = null;
let currentUserRole = null;
let currentLoginRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// ✅ Fonts - Exact Google Fonts Names
const fonts = {
    bangla: ['Hind Siliguri','Noto Sans Bengali','Baloo Da 2','Mukta'],
    english: ['Poppins','Roboto','Open Sans','Lato','Montserrat','Arial','Georgia','Verdana','Calibri','Times New Roman']
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
    div.innerHTML = `<div style="width:50px;height:50px;border:4px solid #eee;border-top:4px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:15px;color:#333;">${msg}</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
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

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    showLoading("লোড হচ্ছে...");
    auth.onAuthStateChanged(user => {
        hideLoading();
        if (user) { currentUser = user; loadUser(user.uid); }
        else { showPage('loginPage'); }
    });
});

function loadUser(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) { currentUserRole = doc.data().role; console.log("Role:", currentUserRole); showHome(); }
        else { logout(); }
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
    auth.signInWithPopup(provider).then(r => {
        if (currentLoginRole === 'admin' && r.user.email !== OWNER_EMAIL) {
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut(); closeModal(); hideLoading(); return;
        }
        db.collection('users').doc(r.user.uid).set({ email: r.user.email, displayName: r.user.displayName, role: currentLoginRole }, { merge: true }).then(() => { closeModal(); hideLoading(); });
    }).catch(e => { hideLoading(); alert("Error: " + e.message); });
}

function showHome() {
    showPage('homePage');
    document.getElementById('adminIcon').style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    document.getElementById('reviewBox').style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    loadAllSettings();
    loadZones();
    loadReviews();
}

function logout() {
    currentUser = null; currentUserRole = null;
    document.getElementById('adminIcon').style.display = 'none';
    auth.signOut().then(() => showPage('loginPage'));
}

function toggleControl() {
    const p = document.getElementById('controlPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    if (p.style.display === 'block') setTimeout(loadControlPanel, 100);
}

function generateFontOptions(current) {
    let h = '';
    fonts.bangla.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f} (Bangla)</option>`);
    fonts.english.forEach(f => h += `<option value="${f}" ${f===current?'selected':''}>${f}</option>`);
    return h;
}

// ✅ APPLY FONT - Fixed Version
function applyFont(elementId, font) {
    const el = document.getElementById(elementId);
    if (el && font) {
        // ✅ Use setProperty with !important
        el.style.setProperty('font-family', `'${font}', 'Hind Siliguri', sans-serif`, 'important');
        console.log(`✅ Font applied to ${elementId}:`, font);
        
        // ✅ Force reflow
        void el.offsetWidth;
    }
}

// ✅ UPDATE FONT - Fixed Version
function updateFont(elementId, font) {
    if (!font) {
        console.log("No font selected");
        return;
    }
    
    console.log("Font selected:", elementId, font);
    
    // ✅ Apply immediately
    applyFont(elementId, font);
    
    // ✅ Determine collection and field
    let collection, field;
    if (elementId === 'branding' || elementId === 'motto') {
        collection = 'header';
        field = elementId + 'Font';
    } else if (elementId === 'zoneTitle') {
        collection = 'zones';
        field = 'titleFont';
    } else if (elementId === 'reviewTitle') {
        collection = 'reviews';
        field = 'titleFont';
    } else if (elementId === 'ceoName') {
        collection = 'ceo';
        field = 'nameFont';
    } else if (elementId === 'ceoTitle') {
        collection = 'ceo';
        field = 'titleFont';
    } else if (elementId === 'ceoDesc') {
        collection = 'ceo';
        field = 'descFont';
    } else if (elementId === 'copyright') {
        collection = 'footer';
        field = 'copyrightFont';
    }
    
    // ✅ Save to Firestore
    if (collection && field) {
        saveSetting(collection, field, font);
    }
}

// ✅ SAVE SETTING
function saveSetting(collection, field, value) {
    console.log(`Saving: ${collection}.${field} = ${value}`);
    db.collection('settings').doc(collection).update({ [field]: value })
        .catch(() => db.collection('settings').doc(collection).set({ [field]: value }));
    // ✅ Reload after 1 second
    setTimeout(loadAllSettings, 1000);
}

// Update Functions
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

// ✅ LOAD ALL SETTINGS
function loadAllSettings() {
    console.log("Loading settings...");
    
    Promise.all([
        db.collection('settings').doc('header').get(),
        db.collection('settings').doc('zones').get(),
        db.collection('settings').doc('reviews').get(),
        db.collection('settings').doc('ceo').get(),
        db.collection('settings').doc('footer').get()
    ]).then(docs => {
        const [h, z, r, c, f] = docs;
        
        // Header
        if (h.exists) {
            const d = h.data();
            if (d.brandingText) document.getElementById('branding').innerText = d.brandingText;
            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;
            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
            if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
            if (d.fbTextText) document.getElementById('fbText').innerText = d.fbTextText;
            if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
            
            // ✅ FONTS - Force Apply
            if (d.brandingFont) applyFont('branding', d.brandingFont);
            if (d.brandingSize) document.getElementById('branding').style.fontSize = d.brandingSize + 'px';
            if (d.brandingColor) document.getElementById('branding').style.color = d.brandingColor;
            
            if (d.mottoFont) applyFont('motto', d.mottoFont);
            if (d.mottoSize) document.getElementById('motto').style.fontSize = d.mottoSize + 'px';
            if (d.mottoColor) document.getElementById('motto').style.color = d.mottoColor;
        }
        
        // Zones
        if (z.exists) {
            const d = z.data();
            if (d.titleText) document.getElementById('zoneTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('zoneTitle', d.titleFont);
            if (d.titleSize) document.getElementById('zoneTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('zoneTitle').style.color = d.titleColor;
        }
        
        // Reviews
        if (r.exists) {
            const d = r.data();
            if (d.titleText) document.getElementById('reviewTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('reviewTitle', d.titleFont);
            if (d.titleSize) document.getElementById('reviewTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('reviewTitle').style.color = d.titleColor;
        }
        
        // CEO
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
        
        // Footer
        if (f.exists) {
            const d = f.data();
            if (d.copyrightText) document.getElementById('copyright').innerText = d.copyrightText;
            if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
            if (d.copyrightFont) applyFont('copyright', d.copyrightFont);
            if (d.copyrightSize) document.getElementById('copyright').style.fontSize = d.copyrightSize + 'px';
            if (d.copyrightColor) document.getElementById('copyright').style.color = d.copyrightColor;
        }
        
        console.log("✅ All settings loaded");
        
        // Update font selects after loading
        setTimeout(updateFontSelects, 100);
    });
}

// ✅ Update Font Selects to show current value
function updateFontSelects() {
    const getFontValue = (id) => {
        const el = document.getElementById(id);
        if (!el) return '';
        const font = el.style.fontFamily || '';
        return font.replace(/'/g, '').split(',')[0].trim();
    };
    
    const setSelectValue = (selectId, value) => {
        const select = document.getElementById(selectId);
        if (select && value) {
            select.value = value;
        }
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

// Control Panel
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;
    
    const canEdit = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    body.innerHTML = `
        <div class="control-section">
            <h3>🔷 হেডার</h3>
            <div class="control-group"><label>লোগো:</label><input type="file" id="logoInput" accept="image/*" onchange="updateLogo()"></div>
            <div class="control-group"><label>ব্র্যান্ডিং:</label><input type="text" value="${document.getElementById('branding').innerText}" oninput="updateText('branding',this.value);saveSetting('header','brandingText',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং ফন্ট:</label><select id="brandingFontSelect" onchange="updateFont('branding',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('branding'))}</select></div>
            <div class="control-group"><label>ব্র্যান্ডিং সাইজ:</label><input type="number" value="${parseInt(document.getElementById('branding').style.fontSize)||32}" onchange="updateSize('branding',this.value);saveSetting('header','brandingSize',this.value)"></div>
            <div class="control-group"><label>ব্র্যান্ডিং কালার:</label><input type="color" value="#ffffff" onchange="updateColor('branding','color',this.value);saveSetting('header','brandingColor',this.value)"></div>
            <hr><div class="control-group"><label>মotto:</label><input type="text" value="${document.getElementById('motto').innerText}" oninput="updateText('motto',this.value);saveSetting('header','mottoText',this.value)"></div>
            <div class="control-group"><label>মotto ফন্ট:</label><select id="mottoFontSelect" onchange="updateFont('motto',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('motto'))}</select></div>
            <div class="control-group"><label>মotto সাইজ:</label><input type="number" value="${parseInt(document.getElementById('motto').style.fontSize)||18}" onchange="updateSize('motto',this.value);saveSetting('header','mottoSize',this.value)"></div>
            <div class="control-group"><label>মotto কালার:</label><input type="color" value="#ffd700" onchange="updateColor('motto','color',this.value);saveSetting('header','mottoColor',this.value)"></div>
            <hr><div class="control-group"><label>হেডার ব্যাকগ্রাউন্ড:</label><input type="color" value="#001f3f" onchange="updateColor('headerSection','background',this.value);saveSetting('header','headerBg',this.value)"></div>
        </div>
        
        <div class="control-section">
            <h3>📘 ফেসবুক</h3>
            <div class="control-group"><label>URL:</label><input type="url" value="${document.getElementById('fbBtn').href}" onchange="updateFbUrl(this.value)"></div>
            <div class="control-group"><label>টেক্সট:</label><input type="text" value="${document.getElementById('fbText').innerText}" oninput="updateText('fbText',this.value);saveSetting('header','fbTextText',this.value)"></div>
        </div>
        
        <div class="control-section">
            <h3>📍 জোন কার্ড</h3>
            <div class="control-group"><label>শিরোনাম:</label><input type="text" value="${document.getElementById('zoneTitle').innerText}" oninput="updateText('zoneTitle',this.value);saveSetting('zones','titleText',this.value)"></div>
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select id="zoneTitleFontSelect" onchange="updateFont('zoneTitle',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('zoneTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(document.getElementById('zoneTitle').style.fontSize)||32}" onchange="updateSize('zoneTitle',this.value);saveSetting('zones','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="#001f3f" onchange="updateColor('zoneTitle','color',this.value);saveSetting('zones','titleColor',this.value)"></div>
            ${canEdit ? `<hr><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>⚠️ টিউটর নোট:</label><input type="text" id="tutorNote" placeholder="বার্তা লিখুন..." onchange="saveSetting('zones','tutorNote',this.value)"></div><div class="control-group" style="background:#fff3cd;padding:10px;border-radius:5px;"><label>নোট সাইজ:</label><input type="number" value="16" min="10" max="40" onchange="saveSetting('zones','tutorNoteSize',this.value)"></div>` : ''}
            <div id="zoneCardsSettings"></div>
        </div>
        
        <div class="control-section">
            <h3>💬 রিভিউ</h3>
            <div class="control-group"><label>শিরোনাম:</label><input type="text" value="${document.getElementById('reviewTitle').innerText}" oninput="updateText('reviewTitle',this.value);saveSetting('reviews','titleText',this.value)"></div>
            <div class="control-group"><label>শিরোনাম ফন্ট:</label><select id="reviewTitleFontSelect" onchange="updateFont('reviewTitle',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('reviewTitle'))}</select></div>
            <div class="control-group"><label>শিরোনাম সাইজ:</label><input type="number" value="${parseInt(document.getElementById('reviewTitle').style.fontSize)||32}" onchange="updateSize('reviewTitle',this.value);saveSetting('reviews','titleSize',this.value)"></div>
            <div class="control-group"><label>শিরোনাম কালার:</label><input type="color" value="#001f3f" onchange="updateColor('reviewTitle','color',this.value);saveSetting('reviews','titleColor',this.value)"></div>
        </div>
        
        <div class="control-section">
            <h3>👔 CEO</h3>
            <div class="control-group"><label>ইমেজ:</label><input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()"></div>
            <div class="control-group"><label>নাম:</label><input type="text" value="${document.getElementById('ceoName').innerText}" oninput="updateText('ceoName',this.value);saveSetting('ceo','nameText',this.value)"></div>
            <div class="control-group"><label>নাম ফন্ট:</label><select id="ceoNameFontSelect" onchange="updateFont('ceoName',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('ceoName'))}</select></div>
            <div class="control-group"><label>পদবী:</label><input type="text" value="${document.getElementById('ceoTitle').innerText}" oninput="updateText('ceoTitle',this.value);saveSetting('ceo','titleText',this.value)"></div>
            <div class="control-group"><label>পদবী ফন্ট:</label><select id="ceoTitleFontSelect" onchange="updateFont('ceoTitle',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('ceoTitle'))}</select></div>
            <div class="control-group"><label>বিবরণ:</label><textarea oninput="updateText('ceoDesc',this.value);saveSetting('ceo','descText',this.value)">${document.getElementById('ceoDesc').innerText}</textarea></div>
            <div class="control-group"><label>বিবরণ ফন্ট:</label><select id="ceoDescFontSelect" onchange="updateFont('ceoDesc',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('ceoDesc'))}</select></div>
        </div>
        
        <div class="control-section">
            <h3>🔻 ফুটার</h3>
            <div class="control-group"><label>কপিরাইট:</label><input type="text" value="${document.getElementById('copyright').innerText}" oninput="updateText('copyright',this.value);saveSetting('footer','copyrightText',this.value)"></div>
            <div class="control-group"><label>কপিরাইট ফন্ট:</label><select id="copyrightFontSelect" onchange="updateFont('copyright',this.value)"><option value="">ডিফল্ট</option>${generateFontOptions(getFontValue('copyright'))}</select></div>
            <div class="control-group"><label>কপিরাইট সাইজ:</label><input type="number" value="${parseInt(document.getElementById('copyright').style.fontSize)||14}" onchange="updateSize('copyright',this.value);saveSetting('footer','copyrightSize',this.value)"></div>
            <div class="control-group"><label>কপিরাইট কালার:</label><input type="color" value="#ffffff" onchange="updateColor('copyright','color',this.value);saveSetting('footer','copyrightColor',this.value)"></div>
            <div class="control-group"><label>ব্যাকগ্রাউন্ড:</label><input type="color" value="#001f3f" onchange="updateColor('footerSection','background',this.value);saveSetting('footer','bgColor',this.value)"></div>
        </div>
    `;
    
    loadZoneCardsSettings();
}

// Helper function
function getFontValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    const font = el.style.fontFamily || '';
    return font.replace(/'/g, '').split(',')[0].trim();
}

function loadZoneCardsSettings() {
    db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneCardsSettings');
        if (!c) return;
        c.innerHTML = '';
        s.forEach(doc => {
            const z = doc.data();
            c.innerHTML += `<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;"><strong>জোন #${z.id}</strong><br>শিরোনাম: <input type="text" value="${z.title}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'title',this.value)"><br>এলাকা: <input type="text" value="${z.areas?z.areas.join(', '):''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'areas',this.value)"><br>মেল গ্রুপ: <input type="url" value="${z.maleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'maleLink',this.value)"><br>ফিমেল গ্রুপ: <input type="url" value="${z.femaleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'femaleLink',this.value)"></div>`;
        });
    });
}

function updateZone(id, f, v) {
    if (f === 'areas') v = v.split(',').map(a=>a.trim()).filter(a=>a);
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
            if (z.maleLink) btns += `<a href="${z.maleLink}" target="_blank" class="group-btn male-btn">👨 মেল গ্রুপ</a>`;
            if (z.femaleLink) btns += `<a href="${z.femaleLink}" target="_blank" class="group-btn female-btn">👩 ফিমেল গ্রুপ</a>`;
        }
        card.innerHTML = `<h3>${z.title}</h3><div class="area-tags">${areas}</div>${btns ? '<div style="margin-top:10px;">'+btns+'</div>' : ''}`;
        c.appendChild(card);
    });
    
    // Tutor Note - Only Tutor & Admin
    if (canSee) {
        db.collection('settings').doc('zones').get().then(doc => {
            if (doc.exists && doc.data().tutorNote) {
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
}

function loadReviews() {
    db.collection('reviews').orderBy('createdAt','desc').limit(50).get().then(s => {
        const c = document.getElementById('reviewList');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) { c.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">কোনো রিভিউ নেই</p>'; return; }
        s.forEach(doc => {
            const r = doc.data();
            const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            const card = document.createElement('div');
            card.className = 'review-card';
            const del = currentUserRole === 'admin' ? `<button onclick="deleteReview('${doc.id}')" style="float:right;background:#ff4136;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️</button>` : '';
            card.innerHTML = `${del}<h4>${r.userName||'Anonymous'} ${r.userRole?'('+r.userRole+')':''}</h4><small style="color:#999;">${date}</small><p>${r.text}</p>`;
            c.appendChild(card);
        });
    });
}

function deleteReview(id) {
    if (currentUserRole !== 'admin') return;
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
