// ✅ Improved Loading Function
function showLoading(msg = "লোড হচ্ছে...") {
    hideLoading(); // First hide any existing loading screen
    
    const div = document.createElement('div');
    div.id = 'loadingScreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;backdrop-filter:blur(5px);';
    div.innerHTML = `
        <div style="width:60px;height:60px;border:5px solid #f3f3f3;border-top:5px solid #0074D9;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;color:#001f3f;font-size:1.2em;font-weight:600;font-family:'Hind Siliguri',sans-serif;">${msg}</p>
        <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(div);
    
    // Auto-hide after 10 seconds (safety)
    div.autoHide = setTimeout(() => hideLoading(), 10000);
}

function hideLoading() {
    const div = document.getElementById('loadingScreen');
    if (div) { 
        if (div.autoHide) clearTimeout(div.autoHide); 
        div.remove(); 
    }
}

// ✅ Improved Logout - Shows Loading Immediately
function logout() {
    // Show loading IMMEDIATELY
    showLoading("লগআউট হচ্ছে...");
    
    // Clear all timeouts
    const id = window.setInterval(() => {}, 100);
    while (id--) window.clearTimeout(id);
    
    // Clear currentUser data immediately
    currentUser = null;
    currentUserRole = null;
    currentLoginRole = null;
    
    // Hide all UI elements immediately
    const adminIcon = document.getElementById('adminIcon');
    const reviewBox = document.getElementById('reviewBox');
    const zoneContainer = document.getElementById('zoneContainer');
    const reviewList = document.getElementById('reviewList');
    const controlBody = document.getElementById('controlBody');
    const controlPanel = document.getElementById('controlPanel');
    
    if (adminIcon) adminIcon.style.display = 'none';
    if (reviewBox) reviewBox.style.display = 'none';
    if (zoneContainer) zoneContainer.innerHTML = '<p style="text-align:center;color:#999;">লোড হচ্ছে...</p>';
    if (reviewList) reviewList.innerHTML = '';
    if (controlBody) controlBody.innerHTML = '';
    if (controlPanel) controlPanel.style.display = 'none';
    
    // Sign out and redirect
    auth.signOut().then(() => {
        console.log("✅ Logged out successfully");
        // Small delay to ensure loading is visible
        setTimeout(() => {
            hideLoading();
            showPage('loginPage');
        }, 500);
    }).catch(error => {
        console.error("Logout error:", error);
        hideLoading();
        showPage('loginPage');
    });
}

// ✅ Improved Google Login - Shows Loading Throughout
function googleLogin() {
    // Show loading IMMEDIATELY
    showLoading("লগইন হচ্ছে...");
    
    // Clear any existing state
    currentUser = null;
    currentUserRole = null;
    
    auth.signInWithPopup(provider).then(r => {
        currentUser = r.user;
        
        if (currentLoginRole === 'admin' && r.user.email !== OWNER_EMAIL) {
            hideLoading();
            alert("শুধুমাত্র মালিক এডমিন হতে পারবেন!");
            auth.signOut(); 
            closeModal(); 
            return;
        }
        
        // Update Firestore
        db.collection('users').doc(r.user.uid).set({ 
            email: r.user.email, 
            displayName: r.user.displayName, 
            role: currentLoginRole 
        }, { merge: true }).then(() => { 
            currentUserRole = currentLoginRole;
            closeModal(); 
            
            // Keep loading visible until home page fully loads
            showHome();
            
            // Hide loading after home page is ready
            setTimeout(() => {
                hideLoading();
                console.log("✅ Logged in as:", currentLoginRole);
            }, 800);
        });
    }).catch(e => { 
        hideLoading(); 
        console.error("Login error:", e);
        if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/popup-blocked') {
            // Don't show alert for popup closed
        } else {
            alert("লগইন সমস্যা: " + e.message);
        }
    });
}

// ✅ Improved Guest Login
function guestLogin() {
    showLoading("লগইন হচ্ছে...");
    
    currentUser = null;
    currentUserRole = null;
    
    auth.signOut().then(() => auth.signInAnonymously()).then(u => {
        currentUser = u.user;
        currentUserRole = 'guest';
        
        return db.collection('users').doc(u.user.uid).set({ 
            email: 'guest@tutorsvalley.com', 
            displayName: 'Guest', 
            role: 'guest', 
            isGuest: true 
        }, { merge: true });
    }).then(() => { 
        showHome();
        setTimeout(() => {
            hideLoading();
            console.log("✅ Guest logged in");
        }, 500);
    }).catch(e => { 
        hideLoading(); 
        console.error("Guest login error:", e);
        alert("Error: " + e.message); 
    });
}

// ✅ Improved showHome - Shows content immediately
function showHome() {
    showPage('homePage');
    
    // Update UI immediately
    const adminIcon = document.getElementById('adminIcon');
    const reviewBox = document.getElementById('reviewBox');
    
    if (adminIcon) {
        adminIcon.style.display = (currentUserRole === 'admin') ? 'flex' : 'none';
    }
    
    if (reviewBox) {
        reviewBox.style.display = (currentUserRole === 'tutor' || currentUserRole === 'guardian') ? 'block' : 'none';
    }
    
    // Show placeholder while loading
    const zoneContainer = document.getElementById('zoneContainer');
    const reviewList = document.getElementById('reviewList');
    
    if (zoneContainer) zoneContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">লোড হচ্ছে...</p>';
    if (reviewList) reviewList.innerHTML = '<p style="text-align:center;color:#999;">লোড হচ্ছে...</p>';
    
    // Load data
    loadAllSettings();
    loadZones();
    loadReviews();
    
    console.log("✅ Home page shown for role:", currentUserRole);
}
