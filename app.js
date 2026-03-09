// ============================================
// 🔥 TUTORS VALLEY - MOBILE LOGIN FIXED
// ✅ Clean Syntax - No Errors
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase Initialized");
} catch (error) {
    console.error("❌ Firebase Init Error:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let currentUserRole = null;
let currentLoginRole = null;
let loginProcessing = false;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

function showLoading(msg = "লোড হচ্ছে...") {
    hideLoading();
    const div = document.createElement('div');
    div.id = 'loadingScreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    div.innerHTML = '<div style="width:50px;height:50px;border:4px solid #eee;border-top:4px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:15px;color:#333;">' + msg + '</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>';
    document.body.appendChild(div);
}

function hideLoading() {
    const div = document.getElementById('loadingScreen');
    if (div) div.remove();
}

function saveRoleForLogin(role) {
    localStorage.setItem('tv_login_role', role);
    console.log("💾 Role saved:", role);
}

function getRoleAfterLogin() {
    const role = localStorage.getItem('tv_login_role');
    console.log("🔑 Role retrieved:", role);
    return role;
}

function clearLoginRole() {
    localStorage.removeItem('tv_login_role');
    console.log("🗑️ Role cleared");
}

window.guestLogin = function() {
    console.log("🟢 Guest login started");
    showLoading("লগইন হচ্ছে...");
    
    auth.signInAnonymously().then((userCredential) => {
        currentUser = userCredential.user;
        currentUserRole = 'guest';
        
        return db.collection('users').doc(currentUser.uid).set({
            email: 'guest@tutorsvalley.com',
            displayName: 'Guest',
            role: 'guest',
            isGuest: true
        }, { merge: true });
    }).then(() => {
        hideLoading();
        showHome();
    }).catch((error) => {
        hideLoading();
        alert("লগইন ব্যর্থ: " + error.message);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 Page Loaded");
    showLoading("অ্যাপ লোড হচ্ছে...");
    
    auth.getRedirectResult().then((result) => {
        console.log("✅ Redirect result:", result.user ? result.user.email : 'no user');
        
        if (result.user) {
            loginProcessing = true;
            const role = getRoleAfterLogin();
            
            if (role) {
                currentLoginRole = role;
                clearLoginRole();
                completeGoogleLogin(result.user);
            } else {
                loadUser(result.user.uid);
            }
        }
    }).catch((error) => {
        console.error("❌ Redirect error:", error.code, error.message);
    });
    
    auth.onAuthStateChanged((user) => {
        console.log("🔄 Auth State:", user ? user.email : 'No user');
        
        if (user) {
            currentUser = user;
            
            if (loginProcessing || currentUserRole) {
                hideLoading();
                return;
            }
            
            loadUser(user.uid);
        } else {
            currentUserRole = null;
            hideLoading();
            showPage('loginPage');
        }
    });
});

function completeGoogleLogin(user) {
    console.log("🎉 Completing login for:", user.email, "Role:", currentLoginRole);
    
    if (!currentLoginRole) {
        alert("লগইন রোল পাওয়া যায়নি");
        hideLoading();
        showPage('loginPage');
        return;
    }
    
    if (currentLoginRole === 'admin' && user.email !== OWNER_EMAIL) {
        alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
        auth.signOut();
        hideLoading();
        showPage('loginPage');
        return;
    }
    
    currentUser = user;
    currentUserRole = currentLoginRole;
    
    db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        role: currentLoginRole,
        provider: 'google'
    }, { merge: true }).then(() => {
        hideLoading();
        showHome();
    }).catch((error) => {
        hideLoading();
        alert("ডাটা সেভ ব্যর্থ: " + error.message);
    });
}

function loadUser(uid) {
    console.log("📥 Loading user:", uid);
    db.collection('users').doc(uid).get().then((doc) => {
        hideLoading();
        if (doc.exists) {
            currentUserRole = doc.data().role;
            currentLoginRole = doc.data().role;
            console.log("✅ Role loaded:", currentUserRole);
            showHome();
        } else {
            logout();
        }
    }).catch((error) => {
        hideLoading();
        console.error("❌ Load error:", error);
        logout();
    });
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    window.scrollTo(0, 0);
};

window.openModal = function(role) {
    currentLoginRole = role;
    console.log("🎯 Modal opened:", role);
    document.getElementById('modalTitle').innerText = {
        'tutor': 'টিউটর লগইন',
        'guardian': 'অভিভাবক লগইন',
        'admin': 'এডমিন লগইন'
    }[role];
    document.getElementById('loginModal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('loginModal').style.display = 'none';
};

window.googleLogin = function() {
    if (!currentLoginRole) {
        alert("দয়া করে একটি রোল সিলেক্ট করুন");
        return;
    }
    
    console.log("🔵 Google login for:", currentLoginRole);
    showLoading("Google লগইন হচ্ছে...");
    loginProcessing = false;
    
    saveRoleForLogin(currentLoginRole);
    
    const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
    console.log("📱 Device:", isMobile ? 'Mobile' : 'Desktop');
    
    if (isMobile) {
        console.log("🔄 Using redirect for mobile");
        auth.signInWithRedirect(provider);
    } else {
        console.log("🪟 Using popup for desktop");
        auth.signInWithPopup(provider).then((result) => {
            if (result.user) {
                currentLoginRole = getRoleAfterLogin() || currentLoginRole;
                completeGoogleLogin(result.user);
            }
        }).catch((error) => {
            hideLoading();
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("লগইন ব্যর্থ: " + error.message);
            }
            showPage('loginPage');
        });
    }
};

function showHome() {
    console.log("🏠 Showing Home:", currentUserRole);
    showPage('homePage');
    
    document.getElementById('adminIcon').style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    document.getElementById('reviewBox').style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    
    Promise.all([loadAllSettings(), loadZones(), loadReviews()]).then(() => {
        updateFloatingWhatsapp();
    });
}

window.logout = function() {
    console.log("🚪 Logout");
    showLoading("লগআউট হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;
    currentLoginRole = null;
    clearLoginRole();
    loginProcessing = false;
    
    auth.signOut().then(() => {
        hideLoading();
        showPage('loginPage');
    });
};

window.toggleControl = function() {
    const p = document.getElementById('controlPanel');
    if (!p) return;
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    if (p.style.display === 'block') setTimeout(loadControlPanel, 100);
};

function generateFontOptions(current) {
    let h = '<option value="">ডিফল্ট</option>';
    const fonts = {
        bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'Baloo Da 2', 'Mukta'],
        english: ['Poppins', 'Roboto', 'Open Sans', 'Lato']
    };
    fonts.bangla.forEach(f => h += '<option value="' + f + '" ' + (f===current?'selected':'') + '>' + f + ' (বাংলা)</option>');
    fonts.english.forEach(f => h += '<option value="' + f + '" ' + (f===current?'selected':'') + '>' + f + '</option>');
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
    return (el.style.fontFamily || '').replace(/'/g, '').split(',')[0].trim();
}

function applyFont(id, font) {
    const el = document.getElementById(id);
    if (el && font) {
        el.style.fontFamily = "'" + font + "', 'Hind Siliguri', sans-serif";
    }
}

function updateFont(id, font) {
    if (!font) return;
    applyFont(id, font);
    let col, fld;
    if (id === 'branding' || id === 'motto') { col = 'header'; fld = id + 'Font'; }
    else if (id === 'zoneTitle') { col = 'zones'; fld = 'titleFont'; }
    else if (id === 'reviewTitle') { col = 'reviews'; fld = 'titleFont'; }
    else if (id === 'ceoName') { col = 'ceo'; fld = 'nameFont'; }
    else if (id === 'ceoTitle') { col = 'ceo'; fld = 'titleFont'; }
    else if (id === 'ceoDesc') { col = 'ceo'; fld = 'descFont'; }
    else if (id === 'copyright') { col = 'footer'; fld = 'copyrightFont'; }
    if (col && fld) db.collection('settings').doc(col).update({ [fld]: font });
}

function saveSetting(col, fld, val) {
    db.collection('settings').doc(col).update({ [fld]: val });
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

function updateText(id, v) {
    const e = document.getElementById(id);
    if (e) e.innerText = v;
}

function updateSize(id, v) {
    const e = document.getElementById(id);
    if (e) e.style.fontSize = v + 'px';
}

function updateColor(id, p, c) {
    const e = document.getElementById(id);
    if (e) e.style[p] = c;
}

function updateFbUrl(url) {
    document.getElementById('fbBtn').href = url;
    db.collection('settings').doc('header').update({ fbUrl: url });
}

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
            if (d.brandingText) document.getElementById('branding').innerText = d.brandingText;
            if (d.mottoText) document.getElementById('motto').innerText = d.mottoText;
            if (d.headerBg) document.getElementById('headerSection').style.background = d.headerBg;
            if (d.fbUrl) document.getElementById('fbBtn').href = d.fbUrl;
            if (d.logoUrl) document.getElementById('logo').src = d.logoUrl;
            if (d.brandingFont) applyFont('branding', d.brandingFont);
            if (d.mottoFont) applyFont('motto', d.mottoFont);
        }
        if (z.exists) {
            const d = z.data();
            if (d.titleText) document.getElementById('zoneTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('zoneTitle', d.titleFont);
        }
        if (r.exists) {
            const d = r.data();
            if (d.titleText) document.getElementById('reviewTitle').innerText = d.titleText;
            if (d.titleFont) applyFont('reviewTitle', d.titleFont);
        }
        if (c.exists) {
            const d = c.data();
            if (d.imageUrl) document.getElementById('ceoImg').src = d.imageUrl;
            if (d.nameText) document.getElementById('ceoName').innerText = d.nameText;
            if (d.titleText) document.getElementById('ceoTitle').innerText = d.titleText;
            if (d.descText) document.getElementById('ceoDesc').innerText = d.descText;
        }
        if (f.exists) {
            const d = f.data();
            if (d.copyrightText) document.getElementById('copyright').innerText = d.copyrightText;
            if (d.bgColor) document.getElementById('footerSection').style.background = d.bgColor;
        }
    });
}

function loadControlPanel() {
    const body = document.getElementById('controlBody');
    if (!body) return;
    body.innerHTML = '<div class="control-section"><h3>🔷 হেডার</h3>' +
        '<div class="control-group"><label>লোগো:</label><input type="file" id="logoInput" accept="image/*" onchange="updateLogo()"></div>' +
        '<div class="control-group"><label>ব্র্যান্ডিং:</label><input type="text" value="' + getText('branding') + '" oninput="updateText(\'branding\',this.value);saveSetting(\'header\',\'brandingText\',this.value)"></div>' +
        '<div class="control-group"><label>ব্র্যান্ডিং ফন্ট:</label><select onchange="updateFont(\'branding\',this.value)">' + generateFontOptions(getFontValue('branding')) + '</select></div>' +
        '<hr><div class="control-group"><label>মotto:</label><input type="text" value="' + getText('motto') + '" oninput="updateText(\'motto\',this.value);saveSetting(\'header\',\'mottoText\',this.value)"></div>' +
        '<div class="control-group"><label>মotto ফন্ট:</label><select onchange="updateFont(\'motto\',this.value)">' + generateFontOptions(getFontValue('motto')) + '</select></div>' +
        '</div><div class="control-section"><h3>📍 জোন</h3><div id="zoneCardsSettings"></div></div>';
    loadZoneCardsSettings();
}

function loadZoneCardsSettings() {
    db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneCardsSettings');
        if (!c) return;
        c.innerHTML = '';
        s.forEach(doc => {
            const z = doc.data();
            c.innerHTML += '<div style="border:1px solid #ddd;padding:10px;margin:10px 0;"><strong>জোন #' + z.id + '</strong><br>' +
                'শিরোনাম: <input type="text" value="' + z.title + '" style="width:100%;margin:5px 0;" onchange="updateZone(' + z.id + ',\'title\',this.value)"><br>' +
                'এলাকা: <input type="text" value="' + (z.areas ? z.areas.join(', ') : '') + '" style="width:100%;margin:5px 0;" onchange="updateZone(' + z.id + ',\'areas\',this.value)"><br>' +
                'হোয়াটসঅ্যাপ: <input type="text" value="' + (z.whatsappNumber || '') + '" style="width:100%;margin:5px 0;" onchange="updateZone(' + z.id + ',\'whatsappNumber\',this.value)"><br>' +
                'মেল: <input type="url" value="' + (z.maleLink || '') + '" style="width:100%;margin:5px 0;" onchange="updateZone(' + z.id + ',\'maleLink\',this.value)"><br>' +
                'ফিমেল: <input type="url" value="' + (z.femaleLink || '') + '" style="width:100%;margin:5px 0;" onchange="updateZone(' + z.id + ',\'femaleLink\',this.value)"></div>';
        });
    });
}

function updateZone(id, f, v) {
    if (f === 'areas') v = v.split(',').map(a => a.trim()).filter(a => a);
    db.collection('zones').doc(id.toString()).update({ [f]: v });
    if (f === 'whatsappNumber') updateFloatingWhatsapp();
}

function loadZones() {
    return db.collection('zones').get().then(s => {
        const c = document.getElementById('zoneContainer');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) {
            const defaultZones = [
                { id: 1, title: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"], maleLink: "", femaleLink: "", whatsappNumber: "" },
                { id: 2, title: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"], maleLink: "", femaleLink: "", whatsappNumber: "" },
                { id: 3, title: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"], maleLink: "", femaleLink: "", whatsappNumber: "" }
            ];
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
    const container = document.getElementById('zoneContainer');
    if (!container) return;
    container.innerHTML = '';
    const canSee = (currentUserRole === 'admin' || currentUserRole === 'tutor');
    zones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        let areas = zone.areas ? zone.areas.map(a => '<span class="area-tag">' + a + '</span>').join('') : '';
        let btns = '';
        if (canSee) {
            if (zone.maleLink) btns += '<a href="' + zone.maleLink + '" target="_blank" class="group-btn male-btn">👨 মেল গ্রুপ</a>';
            if (zone.femaleLink) btns += '<a href="' + zone.femaleLink + '" target="_blank" class="group-btn female-btn">👩 ফিমেল গ্রুপ</a>';
        }
        card.innerHTML = '<h3>' + zone.title + '</h3><div class="area-tags">' + areas + '</div>' + (btns ? '<div class="button-container">' + btns + '</div>' : '');
        container.appendChild(card);
    });
    updateFloatingWhatsapp();
}

function updateFloatingWhatsapp() {
    const btn = document.getElementById('floatingWhatsappBtn');
    if (!btn) return;
    db.collection('zones').doc('1').get().then(doc => {
        if (doc.exists && doc.data().whatsappNumber) {
            const num = doc.data().whatsappNumber.replace(/[^0-9]/g, '');
            btn.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent("আসসালামু আলাইকুম");
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });
}

function loadReviews() {
    return db.collection('reviews').orderBy('createdAt','desc').limit(50).get().then(s => {
        const c = document.getElementById('reviewList');
        if (!c) return;
        c.innerHTML = '';
        if (s.empty) {
            c.innerHTML = '<p style="text-align:center;color:#999;">কোনো রিভিউ নেই</p>';
            return;
        }
        s.forEach(doc => {
            const r = doc.data();
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = '<h4>' + (r.userName || 'Anonymous') + '</h4><p>' + r.text + '</p>';
            c.appendChild(card);
        });
    });
}

window.deleteReview = function(id) {
    if (currentUserRole !== 'admin') return;
    if (confirm("ডিলিট করবেন?")) {
        db.collection('reviews').doc(id).delete().then(() => {
            loadReviews();
        });
    }
};

window.submitReview = function() {
    if (currentUserRole !== 'tutor' && currentUserRole !== 'guardian') {
        alert("শুধুমাত্র টিউটর এবং অভিভাবক রিভিউ দিতে পারবেন");
        return;
    }
    const t = document.getElementById('reviewText').value;
    if (!t.trim()) {
        alert("রিভিউ লিখুন");
        return;
    }
    db.collection('reviews').add({
        text: t,
        userName: currentUser.displayName || 'Anonymous',
        userRole: currentUserRole
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা হয়েছে");
    });
};

console.log("✅ App.js Loaded - Mobile Login Fixed");
