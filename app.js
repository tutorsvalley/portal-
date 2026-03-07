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

// Fonts (10 English + 10 Bangla)
const fonts = {
    english: ['Poppins','Roboto','Open Sans','Lato','Montserrat','Arial','Georgia','Verdana','Calibri','Times New Roman'],
    bangla: ['Hind Siliguri','Noto Sans Bengali','SolaimanLipi','Baloo Da 2','Mukta','Poppins','Roboto','Open Sans','Lato','Montserrat']
};

// Default Zones
const defaultZones = [
    { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 4, title: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 5, title: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"], maleLink: "", femaleLink: "", mixedLink: "" },
    { id: 6, title: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"], maleLink: "", femaleLink: "", mixedLink: "" }
];

// Guest Login
function guestLogin() {
    auth.signInAnonymously().then((userCredential) => {
        currentUser = userCredential.user;
        currentUserRole = 'guest';
        return db.collection('users').doc(userCredential.user.uid).set({
            email: 'guest@tutorsvalley.com',
            displayName: 'Guest User',
            role: 'guest',
            isGuest: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }).then(() => { showHome(); })
    .catch((error) => { alert("গেস্ট লগইন ব্যর্থ: " + error.message); });
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
        } else { logout(); }
    });
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.classList.add('active');
    }
}

// Open Modal
function openModal(role) {
    currentLoginRole = role;
    const titles = { 'tutor': 'টিউটর লগইন', 'guardian': 'অভিভাবক লগইন', 'admin': 'এডমিন লগইন' };
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
        }, { merge: true }).then(() => { closeModal(); });
    }).catch(error => { alert("Login failed: " + error.message); });
}

// Show Home
function showHome() {
    showPage('homePage');
    
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) controlPanel.style.display = 'none';
    
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) adminIcon.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    
    loadAllSettings();
    loadZones();
    loadReviews();
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        const adminIcon = document.getElementById('adminIcon');
        if (adminIcon) adminIcon.style.display = 'none';
        const controlPanel = document.getElementById('controlPanel');
        if (controlPanel) controlPanel.style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControl() {
    const panel = document.getElementById('controlPanel');
    if (!panel) return;
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        setTimeout(() => { loadControlPanel(); }, 50);
    }
}

// Generate Font Options
function generateFontOptions(currentFont) {
    let html = '<optgroup label="🇬🇧 English Fonts">';
    fonts.english.forEach(f => html += `<option value="${f}" ${f===currentFont?'selected':''}>${f}</option>`);
    html += '</optgroup><optgroup label="🇧🇩 Bangla Fonts">';
    fonts.bangla.forEach(f => html += `<option value="${f}" ${f===currentFont?'selected':''}>${f}</option>`);
    html += '</optgroup>';
    return html;
}

// RGB to Hex
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#001f3f';
    const v = rgb.match(/\d+/g);
    if (!v) return '#001f3f';
    return "#" + ((1<<24)+(parseInt(v[0])<<16)+(parseInt(v[1])<<8)+parseInt(v[2])).toString(16).slice(1);
}

// Get Element Style Safely
function getStyle(id, prop) {
    const el = document.getElementById(id);
    return el ? (el.style[prop] || '') : '';
}

// Get Element Text Safely
function getText(id) {
    const el = document.getElementById(id);
    return el ? el.innerText : '';
}

// Load All Settings
function loadAllSettings() {
    // Header
    db.collection('settings').doc('header').get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
        if (d.branding) document.getElementById('branding').innerText = d.branding;
        if (d.motto) document.getElementById('motto').innerText = d.motto;
        if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
        if (d.fbText) document.getElementById('fbText').innerText = d.fbText;
        if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
        if (d.brandFont) document.getElementById('branding').style.fontFamily = d.brandFont;
        if (d.brandSize) document.getElementById('branding').style.fontSize = d.brandSize+'px';
        if (d.brandColor) document.getElementById('branding').style.color = d.brandColor;
        if (d.mottoFont) document.getElementById('motto').style.fontFamily = d.mottoFont;
        if (d.mottoSize) document.getElementById('motto').style.fontSize = d.mottoSize+'px';
        if (d.mottoColor) document.getElementById('motto').style.color = d.mottoColor;
    });
    
    // Zones
    db.collection('settings').doc('zones').get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.title) document.getElementById('zoneTitle').innerText = d.title;
        if (d.titleFont) document.getElementById('zoneTitle').style.fontFamily = d.titleFont;
        if (d.titleSize) document.getElementById('zoneTitle').style.fontSize = d.titleSize+'px';
        if (d.titleColor) document.getElementById('zoneTitle').style.color = d.titleColor;
    });
    
    // Reviews
    db.collection('settings').doc('reviews').get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.title) document.getElementById('reviewTitle').innerText = d.title;
        if (d.titleFont) document.getElementById('reviewTitle').style.fontFamily = d.titleFont;
        if (d.titleSize) document.getElementById('reviewTitle').style.fontSize = d.titleSize+'px';
        if (d.titleColor) document.getElementById('reviewTitle').style.color = d.titleColor;
    });
    
    // CEO
    db.collection('settings').doc('ceo').get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.imageUrl) document.getElementById('ceoImg').src = d.imageUrl;
        if (d.name) document.getElementById('ceoName').innerText = d.name;
        if (d.title) document.getElementById('ceoTitle').innerText = d.title;
        if (d.desc) document.getElementById('ceoDesc').innerText = d.desc;
        if (d.nameFont) document.getElementById('ceoName').style.fontFamily = d.nameFont;
        if (d.nameSize) document.getElementById('ceoName').style.fontSize = d.nameSize+'px';
        if (d.nameColor) document.getElementById('ceoName').style.color = d.nameColor;
        if (d.titleFont) document.getElementById('ceoTitle').style.fontFamily = d.titleFont;
        if (d.descFont) document.getElementById('ceoDesc').style.fontFamily = d.descFont;
    });
    
    // Footer
    db.collection('settings').doc('footer').get().then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.copyright) document.getElementById('copyright').innerText = d.copyright;
        if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
        if (d.copyrightFont) document.getElementById('copyright').style.fontFamily = d.copyrightFont;
        if (d.copyrightSize) document.getElementById('copyright').style.fontSize = d.copyrightSize+'px';
        if (d.copyrightColor) document.getElementById('copyright').style.color = d.copyrightColor;
    });
}

// Load Control Panel
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;
    
    body.innerHTML = `
        <!-- HEADER -->
        <div class="control-section">
            <h3>🔷 হেডার</h3>
            <div class="control-group">
                <label>লোগো:</label>
                <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং:</label>
                <input type="text" value="${getText('branding')}" oninput="updateText('branding',this.value);saveStyle('header','branding','text',this.value)">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং ফন্ট:</label>
                <select onchange="updateFont('branding',this.value);saveStyle('header','branding','font',this.value)">${generateFontOptions(getStyle('branding','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('branding','fontSize'))||32}" min="10" max="100" onchange="updateSize('branding',this.value);saveStyle('header','branding','size',this.value)">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('branding','color'))||'#ffffff'}" onchange="updateColor('branding','color',this.value);saveStyle('header','branding','color',this.value)">
            </div>
            <hr style="margin:15px 0;border:0;border-top:1px solid #eee;">
            <div class="control-group">
                <label>মotto:</label>
                <input type="text" value="${getText('motto')}" oninput="updateText('motto',this.value);saveStyle('header','motto','text',this.value)">
            </div>
            <div class="control-group">
                <label>মotto ফন্ট:</label>
                <select onchange="updateFont('motto',this.value);saveStyle('header','motto','font',this.value)">${generateFontOptions(getStyle('motto','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>মotto সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('motto','fontSize'))||18}" min="10" max="60" onchange="updateSize('motto',this.value);saveStyle('header','motto','size',this.value)">
            </div>
            <div class="control-group">
                <label>মotto কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('motto','color'))||'#ffd700'}" onchange="updateColor('motto','color',this.value);saveStyle('header','motto','color',this.value)">
            </div>
            <hr style="margin:15px 0;border:0;border-top:1px solid #eee;">
            <div class="control-group">
                <label>হেডার ব্যাকগ্রাউন্ড:</label>
                <input type="color" value="${rgbToHex(getStyle('headerSection','background'))||'#001f3f'}" onchange="updateColor('headerSection','background',this.value);saveStyle('header','section','bg',this.value)">
            </div>
        </div>
        
        <!-- FACEBOOK -->
        <div class="control-section">
            <h3>📘 ফেসবুক</h3>
            <div class="control-group">
                <label>URL:</label>
                <input type="url" value="${document.getElementById('fbBtn').href||'#'}" onchange="updateFbUrl(this.value)">
            </div>
            <div class="control-group">
                <label>টেক্সট:</label>
                <input type="text" value="${getText('fbText')}" oninput="updateText('fbText',this.value);saveStyle('header','fbText','text',this.value)">
            </div>
        </div>
        
        <!-- ZONES -->
        <div class="control-section">
            <h3>📍 জোন কার্ড</h3>
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" value="${getText('zoneTitle')}" oninput="updateText('zoneTitle',this.value);saveStyle('zones','title','text',this.value)">
            </div>
            <div class="control-group">
                <label>ফন্ট:</label>
                <select onchange="updateFont('zoneTitle',this.value);saveStyle('zones','title','font',this.value)">${generateFontOptions(getStyle('zoneTitle','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('zoneTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('zoneTitle',this.value);saveStyle('zones','title','size',this.value)">
            </div>
            <div class="control-group">
                <label>কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('zoneTitle','color'))||'#001f3f'}" onchange="updateColor('zoneTitle','color',this.value);saveStyle('zones','title','color',this.value)">
            </div>
            <div id="zoneCardsSettings"></div>
        </div>
        
        <!-- REVIEWS -->
        <div class="control-section">
            <h3>💬 রিভিউ</h3>
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" value="${getText('reviewTitle')}" oninput="updateText('reviewTitle',this.value);saveStyle('reviews','title','text',this.value)">
            </div>
            <div class="control-group">
                <label>ফন্ট:</label>
                <select onchange="updateFont('reviewTitle',this.value);saveStyle('reviews','title','font',this.value)">${generateFontOptions(getStyle('reviewTitle','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('reviewTitle','fontSize'))||32}" min="10" max="80" onchange="updateSize('reviewTitle',this.value);saveStyle('reviews','title','size',this.value)">
            </div>
            <div class="control-group">
                <label>কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('reviewTitle','color'))||'#001f3f'}" onchange="updateColor('reviewTitle','color',this.value);saveStyle('reviews','title','color',this.value)">
            </div>
        </div>
        
        <!-- CEO -->
        <div class="control-section">
            <h3>👔 CEO</h3>
            <div class="control-group">
                <label>ইমেজ:</label>
                <input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()">
            </div>
            <div class="control-group">
                <label>নাম:</label>
                <input type="text" value="${getText('ceoName')}" oninput="updateText('ceoName',this.value);saveStyle('ceo','name','text',this.value)">
            </div>
            <div class="control-group">
                <label>নাম ফন্ট:</label>
                <select onchange="updateFont('ceoName',this.value);saveStyle('ceo','name','font',this.value)">${generateFontOptions(getStyle('ceoName','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>নাম সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('ceoName','fontSize'))||24}" min="10" max="60" onchange="updateSize('ceoName',this.value);saveStyle('ceo','name','size',this.value)">
            </div>
            <div class="control-group">
                <label>নাম কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('ceoName','color'))||'#001f3f'}" onchange="updateColor('ceoName','color',this.value);saveStyle('ceo','name','color',this.value)">
            </div>
            <div class="control-group">
                <label>পদবী:</label>
                <input type="text" value="${getText('ceoTitle')}" oninput="updateText('ceoTitle',this.value);saveStyle('ceo','title','text',this.value)">
            </div>
            <div class="control-group">
                <label>পদবী ফন্ট:</label>
                <select onchange="updateFont('ceoTitle',this.value);saveStyle('ceo','title','font',this.value)">${generateFontOptions(getStyle('ceoTitle','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>বিবরণ:</label>
                <textarea rows="3" oninput="updateText('ceoDesc',this.value);saveStyle('ceo','desc','text',this.value)">${getText('ceoDesc')}</textarea>
            </div>
            <div class="control-group">
                <label>বিবরণ ফন্ট:</label>
                <select onchange="updateFont('ceoDesc',this.value);saveStyle('ceo','desc','font',this.value)">${generateFontOptions(getStyle('ceoDesc','fontFamily'))}</select>
            </div>
        </div>
        
        <!-- FOOTER -->
        <div class="control-section">
            <h3>🔻 ফুটার</h3>
            <div class="control-group">
                <label>কপিরাইট:</label>
                <input type="text" value="${getText('copyright')}" oninput="updateText('copyright',this.value);saveStyle('footer','copyright','text',this.value)">
            </div>
            <div class="control-group">
                <label>ফন্ট:</label>
                <select onchange="updateFont('copyright',this.value);saveStyle('footer','copyright','font',this.value)">${generateFontOptions(getStyle('copyright','fontFamily'))}</select>
            </div>
            <div class="control-group">
                <label>সাইজ:</label>
                <input type="number" value="${parseInt(getStyle('copyright','fontSize'))||14}" min="10" max="40" onchange="updateSize('copyright',this.value);saveStyle('footer','copyright','size',this.value)">
            </div>
            <div class="control-group">
                <label>কালার:</label>
                <input type="color" value="${rgbToHex(getStyle('copyright','color'))||'#ffffff'}" onchange="updateColor('copyright','color',this.value);saveStyle('footer','copyright','color',this.value)">
            </div>
            <div class="control-group">
                <label>ব্যাকগ্রাউন্ড:</label>
                <input type="color" value="${rgbToHex(getStyle('footerSection','background'))||'#001f3f'}" onchange="updateColor('footerSection','background',this.value);saveStyle('footer','section','bg',this.value)">
            </div>
        </div>
    `;
    
    loadZoneCardsSettings();
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

function updateText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }
function updateFont(id, font) { const el = document.getElementById(id); if (el) el.style.fontFamily = font; }
function updateSize(id, size) { const el = document.getElementById(id); if (el) el.style.fontSize = size+'px'; }
function updateColor(id, prop, color) { const el = document.getElementById(id); if (el) el.style[prop] = color; }

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

// Save Style to Firestore
function saveStyle(section, element, field, value) {
    const key = element + (field==='text'?'Text':field==='font'?'Font':field==='size'?'Size':'Color');
    db.collection('settings').doc(section).update({ [key]: value })
        .catch(() => db.collection('settings').doc(section).set({ [key]: value }));
}

// Load Zone Cards Settings
function loadZoneCardsSettings() {
    db.collection('zones').get().then(snapshot => {
        const container = document.getElementById('zoneCardsSettings');
        if (!container) return;
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const z = doc.data();
            container.innerHTML += `
                <div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;background:#fff;">
                    <strong>জোন #${z.id}</strong><br><br>
                    শিরোনাম: <input type="text" value="${z.title}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'title',this.value)"><br>
                    এলাকা: <input type="text" value="${z.areas?z.areas.join(', '):''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'areas',this.value)"><br>
                    পুরুষ লিঙ্ক: <input type="url" value="${z.maleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'maleLink',this.value)"><br>
                    মহিলা লিঙ্ক: <input type="url" value="${z.femaleLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'femaleLink',this.value)"><br>
                    মিক্সড লিঙ্ক: <input type="url" value="${z.mixedLink||''}" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'mixedLink',this.value)">
                </div>
            `;
        });
    });
}

function updateZone(id, field, val) {
    if (field === 'areas') val = val.split(',').map(a=>a.trim()).filter(a=>a);
    db.collection('zones').doc(id.toString()).update({ [field]: val });
}

// Load Zones
function loadZones() {
    db.collection('zones').get().then(snapshot => {
        if (snapshot.empty) {
            defaultZones.forEach(z => db.collection('zones').doc(z.id.toString()).set(z));
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
        
        let areas = '';
        if (zone.areas) areas = zone.areas.map(a => `<span class="area-tag">${a}</span>`).join('');
        
        let buttons = '';
        if (currentUserRole === 'tutor') {
            if (zone.maleLink) buttons += `<a href="${zone.maleLink}" target="_blank" class="group-btn male-btn">👨 পুরুষ গ্রুপ</a><br>`;
            if (zone.femaleLink) buttons += `<a href="${zone.femaleLink}" target="_blank" class="group-btn female-btn">👩 মহিলা গ্রুপ</a><br>`;
            if (zone.mixedLink) buttons += `<a href="${zone.mixedLink}" target="_blank" class="group-btn mixed-btn">👥 মিক্সড গ্রুপ</a>`;
        }
        
        card.innerHTML = `<h3>${zone.title}</h3><div class="area-tags">${areas}</div>${buttons ? '<div style="margin-top:10px;">'+buttons+'</div>' : ''}`;
        container.appendChild(card);
    });
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt','desc').limit(50).get().then(snapshot => {
        const container = document.getElementById('reviewList');
        if (!container) return;
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">এখনও কোনো রিভিউ নেই</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const r = doc.data();
            const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            const card = document.createElement('div');
            card.className = 'review-card';
            
            const deleteBtn = currentUserRole === 'admin' ? 
                `<button onclick="deleteReview('${doc.id}')" style="float:right;background:#ff4136;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:0.8em;">🗑️ ডিলিট</button>` : '';
            
            card.innerHTML = `${deleteBtn}<h4>${r.userName||'Anonymous'} ${r.userRole?'('+r.userRole+')':''}</h4><small style="color:#999;display:block;margin-bottom:8px;">${date}</small><p style="line-height:1.6;">${r.text}</p>`;
            container.appendChild(card);
        });
    });
}

// Delete Review
function deleteReview(reviewId) {
    if (currentUserRole !== 'admin') { alert("শুধুমাত্র এডমিন রিভিউ ডিলিট করতে পারবেন"); return; }
    if (confirm("আপনি কি এই রিভিউ ডিলিট করতে চান?")) {
        db.collection('reviews').doc(reviewId).delete().then(() => {
            loadReviews();
            alert("রিভিউ ডিলিট হয়েছে");
        }).catch(error => { alert("ডিলিট ব্যর্থ: " + error.message); });
    }
}

// Submit Review
function submitReview() {
    if (currentUserRole !== 'tutor' && currentUserRole !== 'guardian') {
        alert("শুধুমাত্র টিউটর এবং অভিভাবক রিভিউ দিতে পারবেন");
        return;
    }
    const text = document.getElementById('reviewText').value;
    if (!text.trim()) { alert("রিভিউ লিখুন"); return; }
    
    db.collection('reviews').add({
        text: text,
        userName: currentUser.displayName || currentUser.email || 'Anonymous',
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
}

// Close modal on outside click
window.onclick = function(e) {
    if (e.target === document.getElementById('loginModal')) closeModal();
};
