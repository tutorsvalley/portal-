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
let authReady = false;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Fonts List
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

// ✅ Professional Loading Screen
function showLoading(message = "লোড হচ্ছে...") {
    // Remove existing loading screen if any
    hideLoading();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingScreen';
    loadingDiv.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        transition:opacity 0.5s ease;
    `;
    
    loadingDiv.innerHTML = `
        <div style="width:60px;height:60px;border:4px solid rgba(255,255,255,0.3);border-top:4px solid #ffffff;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;color:#ffffff;font-family:'Hind Siliguri',sans-serif;font-size:18px;font-weight:500;letter-spacing:1px;">${message}</p>
        <div style="margin-top:30px;display:flex;gap:10px;">
            <div style="width:10px;height:10px;background:#ffffff;border-radius:50%;animation:bounce 1.4s infinite ease-in-out both;"></div>
            <div style="width:10px;height:10px;background:#ffffff;border-radius:50%;animation:bounce 1.4s infinite ease-in-out both 0.16s;"></div>
            <div style="width:10px;height:10px;background:#ffffff;border-radius:50%;animation:bounce 1.4s infinite ease-in-out both 0.32s;"></div>
        </div>
        <style>
            @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        </style>
    `;
    
    document.body.appendChild(loadingDiv);
    
    // Fade in effect
    setTimeout(() => {
        loadingDiv.style.opacity = '1';
    }, 10);
}

// ✅ Hide Loading Screen with Fade Out
function hideLoading() {
    const loadingDiv = document.getElementById('loadingScreen');
    if (loadingDiv) {
        loadingDiv.style.opacity = '0';
        setTimeout(() => {
            loadingDiv.remove();
        }, 500);
    }
}

// ✅ Fade In Page Content
function fadeInPage() {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        activePage.style.opacity = '0';
        activePage.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            activePage.style.opacity = '1';
        }, 100);
    }
}

// Guest Login
function guestLogin() {
    console.log("Guest login clicked");
    showLoading("গেস্ট লগইন হচ্ছে...");
    
    auth.signOut().then(() => {
        return auth.signInAnonymously();
    }).then((userCredential) => {
        currentUser = userCredential.user;
        currentUserRole = 'guest';
        return db.collection('users').doc(userCredential.user.uid).set({
            email: 'guest@tutorsvalley.com',
            displayName: 'Guest User',
            role: 'guest',
            isGuest: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }).then(() => {
        console.log("Guest logged in successfully");
        hideLoading();
        fadeInPage();
        showHome();
    }).catch((error) => {
        console.error("Guest login error:", error);
        hideLoading();
        alert("গেস্ট লগইন ব্যর্থ: " + error.message);
    });
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, checking auth...");
    showLoading("অ্যাপ লোড হচ্ছে...");
    
    // Check for redirect result first
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            console.log("Redirect login successful");
            handleLoginSuccess(result.user);
        }
    }).catch((error) => {
        console.error("Redirect error:", error);
        auth.signOut().catch(() => {});
        showPage('loginPage');
        hideLoading();
    });
    
    // Auth state observer with timeout
    let authTimeout = setTimeout(() => {
        console.log("Auth timeout - forcing login page");
        authReady = true;
        showPage('loginPage');
        hideLoading();
    }, 5000);
    
    auth.onAuthStateChanged(user => {
        clearTimeout(authTimeout);
        
        if (user) {
            console.log("User authenticated:", user.email || 'Anonymous');
            currentUser = user;
            authReady = true;
            loadUser(user.uid);
        } else {
            console.log("No user - showing login page");
            authReady = true;
            showPage('loginPage');
            hideLoading();
            fadeInPage();
        }
    });
});

// Handle Login Success
function handleLoginSuccess(user) {
    if (currentLoginRole === 'admin' && user.email !== OWNER_EMAIL) {
        alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
        auth.signOut();
        closeModal();
        showPage('loginPage');
        hideLoading();
        return;
    }
    db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        role: currentLoginRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        console.log("User data saved");
        closeModal();
    });
}

// Load User Data
function loadUser(uid) {
    showLoading("প্রোফাইল লোড হচ্ছে...");
    
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            console.log("User role:", currentUserRole);
            hideLoading();
            fadeInPage();
            showHome();
        } else {
            console.log("No user doc found - logging out");
            hideLoading();
            logout();
        }
    }).catch(error => {
        console.error("Load user error:", error);
        hideLoading();
        logout();
    });
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
        p.style.opacity = '0';
    });
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.classList.add('active');
        page.style.opacity = '1';
        page.style.transition = 'opacity 0.5s ease';
    }
}

// Open Modal
function openModal(role) {
    currentLoginRole = role;
    auth.signOut().catch(() => {});
    
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
    console.log("Google login clicked for:", currentLoginRole);
    showLoading("Google লগইন হচ্ছে...");
    
    auth.signOut().then(() => {
        return auth.signInWithPopup(provider);
    }).then(result => {
        console.log("Google login successful");
        handleLoginSuccess(result.user);
    }).catch(error => {
        console.error("Google login error:", error);
        hideLoading();
        
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            try { sessionStorage.setItem('loginRole', currentLoginRole); } catch(e) {}
            auth.signInWithRedirect(provider);
        } else if (error.code === 'auth/internal-error' || error.message.includes('missing initial state')) {
            alert("লগইন সমস্যা: Chrome বা Firefox browser ব্যবহার করুন। Messenger/WhatsApp থেকে চেষ্টা করবেন না।");
            showPage('loginPage');
        } else {
            alert("Login failed: " + error.message);
            showPage('loginPage');
        }
    });
}

// Show Home
function showHome() {
    console.log("Showing home page for role:", currentUserRole);
    showPage('homePage');
    
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) controlPanel.style.display = 'none';
    
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) adminIcon.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    
    const reviewBox = document.getElementById('reviewBox');
    if (reviewBox) reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    
    // Load data in parallel
    Promise.all([
        loadAllSettings(),
        loadZones(),
        loadReviews()
    ]).then(() => {
        console.log("All home data loaded");
        fadeInPage();
    }).catch(error => {
        console.error("Error loading home data:", error);
    });
}

// Logout
function logout() {
    console.log("Logging out...");
    showLoading("লগআউট হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;
    const adminIcon = document.getElementById('adminIcon');
    if (adminIcon) adminIcon.style.display = 'none';
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) controlPanel.style.display = 'none';
    
    auth.signOut().then(() => {
        console.log("Logged out successfully");
        hideLoading();
        showPage('loginPage');
        fadeInPage();
    }).catch(error => {
        console.error("Logout error:", error);
        hideLoading();
        showPage('loginPage');
        fadeInPage();
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
        setTimeout(() => { loadControlPanel(); }, 100);
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

// Get Element Style
function getStyle(id, prop) {
    const el = document.getElementById(id);
    return el ? (el.style[prop] || '') : '';
}

// Get Element Text
function getText(id) {
    const el = document.getElementById(id);
    return el ? el.innerText : '';
}

// LOAD ALL SETTINGS
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
            const d = headerDoc.data();
            if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
            if (d.brandingText) document.getElementById('branding').innerText = d.brandingText;
            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;
            if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
            if (d.fbTextText) document.getElementById('fbText').innerText = d.fbTextText;
            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
            if (d.brandingFont) document.getElementById('branding').style.fontFamily = d.brandingFont;
            if (d.brandingSize) document.getElementById('branding').style.fontSize = d.brandingSize + 'px';
            if (d.brandingColor) document.getElementById('branding').style.color = d.brandingColor;
            if (d.mottoFont) document.getElementById('motto').style.fontFamily = d.mottoFont;
            if (d.mottoSize) document.getElementById('motto').style.fontSize = d.mottoSize + 'px';
            if (d.mottoColor) document.getElementById('motto').style.color = d.mottoColor;
        }
        
        // Zones
        if (zonesDoc.exists) {
            const d = zonesDoc.data();
            if (d.titleText) document.getElementById('zoneTitle').innerText = d.titleText;
            if (d.titleFont) document.getElementById('zoneTitle').style.fontFamily = d.titleFont;
            if (d.titleSize) document.getElementById('zoneTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('zoneTitle').style.color = d.titleColor;
        }
        
        // Reviews
        if (reviewsDoc.exists) {
            const d = reviewsDoc.data();
            if (d.titleText) document.getElementById('reviewTitle').innerText = d.titleText;
            if (d.titleFont) document.getElementById('reviewTitle').style.fontFamily = d.titleFont;
            if (d.titleSize) document.getElementById('reviewTitle').style.fontSize = d.titleSize + 'px';
            if (d.titleColor) document.getElementById('reviewTitle').style.color = d.titleColor;
        }
        
        // CEO
        if (ceoDoc.exists) {
            const d = ceoDoc.data();
            if (d.imageUrl) document.getElementById('ceoImg').src = d.imageUrl;
            if (d.nameText) document.getElementById('ceoName').innerText = d.nameText;
            if (d.titleText) document.getElementById('ceoTitle').innerText = d.titleText;
            if (d.descText) document.getElementById('ceoDesc').innerText = d.descText;
            if (d.nameFont) document.getElementById('ceoName').style.fontFamily = d.nameFont;
            if (d.nameSize) document.getElementById('ceoName').style.fontSize = d.nameSize + 'px';
            if (d.nameColor) document.getElementById('ceoName').style.color = d.nameColor;
            if (d.titleFont) document.getElementById('ceoTitle').style.fontFamily = d.titleFont;
            if (d.descFont) document.getElementById('ceoDesc').style.fontFamily = d.descFont;
        }
        
        // Footer
        if (footerDoc.exists) {
            const d = footerDoc.data();
            if (d.copyrightText) document.getElementById('copyright').innerText = d.copyrightText;
            if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
            if (d.copyrightFont) document.getElementById('copyright').style.fontFamily = d.copyrightFont;
            if (d.copyrightSize) document.getElementById('copyright').style.fontSize = d.copyrightSize + 'px';
            if (d.copyrightColor) document.getElementById('copyright').style.color = d.copyrightColor;
        }
    });
}

// LOAD CONTROL PANEL
function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;
    
    const brandingFont = getStyle('branding', 'fontFamily') || '';
    const brandingSize = parseInt(getStyle('branding', 'fontSize')) || 32;
    const brandingColor = getStyle('branding', 'color') || '#ffffff';
    const mottoFont = getStyle('motto', 'fontFamily') || '';
    const mottoSize = parseInt(getStyle('motto', 'fontSize')) || 18;
    const mottoColor = getStyle('motto', 'color') || '#ffd700';
    const headerBg = getStyle('headerSection', 'background') || '#001f3f';
    const zoneTitleFont = getStyle('zoneTitle', 'fontFamily') || '';
    const zoneTitleSize = parseInt(getStyle('zoneTitle', 'fontSize')) || 32;
    const zoneTitleColor = getStyle('zoneTitle', 'color') || '#001f3f';
    const reviewTitleFont = getStyle('reviewTitle', 'fontFamily') || '';
    const reviewTitleSize = parseInt(getStyle('reviewTitle', 'fontSize')) || 32;
    const reviewTitleColor = getStyle('reviewTitle', 'color') || '#001f3f';
    const ceoNameFont = getStyle('ceoName', 'fontFamily') || '';
    const ceoNameSize = parseInt(getStyle('ceoName', 'fontSize')) || 24;
    const ceoNameColor = getStyle('ceoName', 'color') || '#001f3f';
    const ceoTitleFont = getStyle('ceoTitle', 'fontFamily') || '';
    const ceoDescFont = getStyle('ceoDesc', 'fontFamily') || '';
    const copyrightFont = getStyle('copyright', 'fontFamily') || '';
    const copyrightSize = parseInt(getStyle('copyright', 'fontSize')) || 14;
    const copyrightColor = getStyle('copyright', 'color') || '#ffffff';
    const footerBg = getStyle('footerSection', 'background') || '#001f3f';
    
    const canEditZoneTitle = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    body.innerHTML = `
        <div class="control-section">
            <h3>🔷 হেডার</h3>
            <div class="control-group">
                <label>লোগো:</label>
                <input type="file" id="logoInput" accept="image/*" onchange="updateLogo()">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং:</label>
                <input type="text" value="${getText('branding')}" oninput="updateText('branding',this.value); saveSetting('header','brandingText',this.value)">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং ফন্ট:</label>
                <select onchange="updateFont('branding',this.value); saveSetting('header','brandingFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(brandingFont)}
                </select>
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং সাইজ:</label>
                <input type="number" value="${brandingSize}" min="10" max="100" onchange="updateSize('branding',this.value); saveSetting('header','brandingSize',this.value)">
            </div>
            <div class="control-group">
                <label>ব্র্যান্ডিং কালার:</label>
                <input type="color" value="${rgbToHex(brandingColor)}" onchange="updateColor('branding','color',this.value); saveSetting('header','brandingColor',this.value)">
            </div>
            <hr style="margin:15px 0;border:0;border-top:1px solid #eee;">
            <div class="control-group">
                <label>মotto:</label>
                <input type="text" value="${getText('motto')}" oninput="updateText('motto',this.value); saveSetting('header','mottoText',this.value)">
            </div>
            <div class="control-group">
                <label>মotto ফন্ট:</label>
                <select onchange="updateFont('motto',this.value); saveSetting('header','mottoFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(mottoFont)}
                </select>
            </div>
            <div class="control-group">
                <label>মotto সাইজ:</label>
                <input type="number" value="${mottoSize}" min="10" max="60" onchange="updateSize('motto',this.value); saveSetting('header','mottoSize',this.value)">
            </div>
            <div class="control-group">
                <label>মotto কালার:</label>
                <input type="color" value="${rgbToHex(mottoColor)}" onchange="updateColor('motto','color',this.value); saveSetting('header','mottoColor',this.value)">
            </div>
            <hr style="margin:15px 0;border:0;border-top:1px solid #eee;">
            <div class="control-group">
                <label>হেডার ব্যাকগ্রাউন্ড:</label>
                <input type="color" value="${rgbToHex(headerBg)}" onchange="updateColor('headerSection','background',this.value); saveSetting('header','headerBg',this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3>📘 ফেসবুক</h3>
            <div class="control-group">
                <label>URL:</label>
                <input type="url" value="${document.getElementById('fbBtn').href||'#'}" onchange="updateFbUrl(this.value)">
            </div>
            <div class="control-group">
                <label>টেক্সট:</label>
                <input type="text" value="${getText('fbText')}" oninput="updateText('fbText',this.value); saveSetting('header','fbTextText',this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3>📍 জোন কার্ড</h3>
            <div class="control-group">
                <label>সেকশন শিরোনাম:</label>
                <input type="text" value="${getText('zoneTitle')}" oninput="updateText('zoneTitle',this.value); saveSetting('zones','titleText',this.value)">
            </div>
            <div class="control-group">
                <label>শিরোনাম ফন্ট:</label>
                <select onchange="updateFont('zoneTitle',this.value); saveSetting('zones','titleFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(zoneTitleFont)}
                </select>
            </div>
            <div class="control-group">
                <label>শিরোনাম সাইজ:</label>
                <input type="number" value="${zoneTitleSize}" min="10" max="80" onchange="updateSize('zoneTitle',this.value); saveSetting('zones','titleSize',this.value)">
            </div>
            <div class="control-group">
                <label>শিরোনাম কালার:</label>
                <input type="color" value="${rgbToHex(zoneTitleColor)}" onchange="updateColor('zoneTitle','color',this.value); saveSetting('zones','titleColor',this.value)">
            </div>
            
            ${canEditZoneTitle ? `
            <hr style="margin:15px 0;border:0;border-top:1px solid #eee;">
            <div class="control-group" style="background:#fff3cd; padding:10px; border-radius:5px;">
                <label style="color:#856404;">⚠️ টিউটরদের জন্য নোট (শুধু টিউটর দেখবে):</label>
                <input type="text" id="tutorZoneNote" placeholder="টিউটরদের জন্য বার্তা লিখুন..." onchange="saveSetting('zones','tutorNote',this.value)">
                <small style="color:#856404;">এই টেক্সট শুধুমাত্র টিউটররা তাদের হোম পেজে দেখতে পাবে</small>
            </div>
            ` : ''}
            
            <div id="zoneCardsSettings"></div>
        </div>
        
        <div class="control-section">
            <h3>💬 রিভিউ</h3>
            <div class="control-group">
                <label>শিরোনাম:</label>
                <input type="text" value="${getText('reviewTitle')}" oninput="updateText('reviewTitle',this.value); saveSetting('reviews','titleText',this.value)">
            </div>
            <div class="control-group">
                <label>ফন্ট:</label>
                <select onchange="updateFont('reviewTitle',this.value); saveSetting('reviews','titleFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(reviewTitleFont)}
                </select>
            </div>
            <div class="control-group">
                <label>সাইজ:</label>
                <input type="number" value="${reviewTitleSize}" min="10" max="80" onchange="updateSize('reviewTitle',this.value); saveSetting('reviews','titleSize',this.value)">
            </div>
            <div class="control-group">
                <label>কালার:</label>
                <input type="color" value="${rgbToHex(reviewTitleColor)}" onchange="updateColor('reviewTitle','color',this.value); saveSetting('reviews','titleColor',this.value)">
            </div>
        </div>
        
        <div class="control-section">
            <h3>👔 CEO</h3>
            <div class="control-group">
                <label>ইমেজ:</label>
                <input type="file" id="ceoImageInput" accept="image/*" onchange="updateCeoImage()">
            </div>
            <div class="control-group">
                <label>নাম:</label>
                <input type="text" value="${getText('ceoName')}" oninput="updateText('ceoName',this.value); saveSetting('ceo','nameText',this.value)">
            </div>
            <div class="control-group">
                <label>নাম ফন্ট:</label>
                <select onchange="updateFont('ceoName',this.value); saveSetting('ceo','nameFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(ceoNameFont)}
                </select>
            </div>
            <div class="control-group">
                <label>নাম সাইজ:</label>
                <input type="number" value="${ceoNameSize}" min="10" max="60" onchange="updateSize('ceoName',this.value); saveSetting('ceo','nameSize',this.value)">
            </div>
            <div class="control-group">
                <label>নাম কালার:</label>
                <input type="color" value="${rgbToHex(ceoNameColor)}" onchange="updateColor('ceoName','color',this.value); saveSetting('ceo','nameColor',this.value)">
            </div>
            <div class="control-group">
                <label>পদবী:</label>
                <input type="text" value="${getText('ceoTitle')}" oninput="updateText('ceoTitle',this.value); saveSetting('ceo','titleText',this.value)">
            </div>
            <div class="control-group">
                <label>পদবী ফন্ট:</label>
                <select onchange="updateFont('ceoTitle',this.value); saveSetting('ceo','titleFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(ceoTitleFont)}
                </select>
            </div>
            <div class="control-group">
                <label>বিবরণ:</label>
                <textarea rows="3" oninput="updateText('ceoDesc',this.value); saveSetting('ceo','descText',this.value)">${getText('ceoDesc')}</textarea>
            </div>
            <div class="control-group">
                <label>বিবরণ ফন্ট:</label>
                <select onchange="updateFont('ceoDesc',this.value); saveSetting('ceo','descFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(ceoDescFont)}
                </select>
            </div>
        </div>
        
        <div class="control-section">
            <h3>🔻 ফুটার</h3>
            <div class="control-group">
                <label>কপিরাইট:</label>
                <input type="text" value="${getText('copyright')}" oninput="updateText('copyright',this.value); saveSetting('footer','copyrightText',this.value)">
            </div>
            <div class="control-group">
                <label>ফন্ট:</label>
                <select onchange="updateFont('copyright',this.value); saveSetting('footer','copyrightFont',this.value)">
                    <option value="">ডিফল্ট</option>
                    ${generateFontOptions(copyrightFont)}
                </select>
            </div>
            <div class="control-group">
                <label>সাইজ:</label>
                <input type="number" value="${copyrightSize}" min="10" max="40" onchange="updateSize('copyright',this.value); saveSetting('footer','copyrightSize',this.value)">
            </div>
            <div class="control-group">
                <label>কালার:</label>
                <input type="color" value="${rgbToHex(copyrightColor)}" onchange="updateColor('copyright','color',this.value); saveSetting('footer','copyrightColor',this.value)">
            </div>
            <div class="control-group">
                <label>ব্যাকগ্রাউন্ড:</label>
                <input type="color" value="${rgbToHex(footerBg)}" onchange="updateColor('footerSection','background',this.value); saveSetting('footer','bgColor',this.value)">
            </div>
        </div>
    `;
    
    if (canEditZoneTitle) {
        db.collection('settings').doc('zones').get().then(doc => {
            if (doc.exists && doc.data().tutorNote) {
                const noteInput = document.getElementById('tutorZoneNote');
                if (noteInput) noteInput.value = doc.data().tutorNote;
            }
        });
    }
    
    loadZoneCardsSettings();
}

// SAVE SETTING
function saveSetting(collection, field, value) {
    db.collection('settings').doc(collection).update({ [field]: value })
        .catch(() => {
            db.collection('settings').doc(collection).set({ [field]: value });
        });
}

// Update Logo
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

// Update CEO Image
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

// Update Functions
function updateText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }
function updateFont(id, font) { const el = document.getElementById(id); if (el) el.style.fontFamily = font; }
function updateSize(id, size) { const el = document.getElementById(id); if (el) el.style.fontSize = size+'px'; }
function updateColor(id, prop, color) { const el = document.getElementById(id); if (el) el.style[prop] = color; }

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
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
                    মেল গ্রুপ লিঙ্ক: <input type="url" value="${z.maleLink||''}" placeholder="WhatsApp/Telegram link" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'maleLink',this.value)"><br>
                    ফিমেল গ্রুপ লিঙ্ক: <input type="url" value="${z.femaleLink||''}" placeholder="WhatsApp/Telegram link" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'femaleLink',this.value)"><br>
                    মিক্সড গ্রুপ লিঙ্ক: <input type="url" value="${z.mixedLink||''}" placeholder="WhatsApp/Telegram link" style="width:100%;margin:5px 0;" onchange="updateZone(${z.id},'mixedLink',this.value)">
                </div>
            `;
        });
    });
}

// Update Zone
function updateZone(id, field, val) {
    if (field === 'areas') val = val.split(',').map(a=>a.trim()).filter(a=>a);
    db.collection('zones').doc(id.toString()).update({ [field]: val });
}

// Load Zones
function loadZones() {
    return db.collection('zones').get().then(snapshot => {
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
    
    const canSeeButtons = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        
        let areas = '';
        if (zone.areas) areas = zone.areas.map(a => `<span class="area-tag">${a}</span>`).join('');
        
        let buttons = '';
        if (canSeeButtons) {
            if (zone.maleLink) buttons += `<a href="${zone.maleLink}" target="_blank" class="group-btn male-btn">👨 মেল গ্রুপ</a><br>`;
            if (zone.femaleLink) buttons += `<a href="${zone.femaleLink}" target="_blank" class="group-btn female-btn">👩 ফিমেল গ্রুপ</a><br>`;
            if (zone.mixedLink) buttons += `<a href="${zone.mixedLink}" target="_blank" class="group-btn mixed-btn">👥 মিক্সড গ্রুপ</a>`;
        }
        
        card.innerHTML = `<h3>${zone.title}</h3><div class="area-tags">${areas}</div>${buttons ? '<div style="margin-top:10px;">'+buttons+'</div>' : ''}`;
        container.appendChild(card);
    });
    
    // Load Tutor Note
    if (currentUserRole === 'tutor') {
        db.collection('settings').doc('zones').get().then(doc => {
            if (doc.exists && doc.data().tutorNote) {
                const zoneTitle = document.getElementById('zoneTitle');
                if (zoneTitle) {
                    const existingNote = zoneTitle.parentNode.querySelector('.tutor-note');
                    if (existingNote) existingNote.remove();
                    
                    const note = document.createElement('p');
                    note.className = 'tutor-note';
                    note.style.cssText = 'background:#fff3cd; color:#856404; padding:10px; border-radius:5px; text-align:center; margin:10px auto; max-width:600px;';
                    note.innerText = '📢 ' + doc.data().tutorNote;
                    zoneTitle.parentNode.insertBefore(note, zoneTitle.nextSibling);
                }
            }
        });
    }
}

// Load Reviews
function loadReviews() {
    return db.collection('reviews').orderBy('createdAt','desc').limit(50).get().then(snapshot => {
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
