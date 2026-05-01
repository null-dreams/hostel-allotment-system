// Purpose: Automatically injects the shared navbar, handles active states, and manages basic Role-Based Access Control (RBAC).

document.addEventListener("DOMContentLoaded", function() {
    // 1. Get the current page name
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    
    // 2. Check the user's role from localStorage
    const userRole = localStorage.getItem('userRole');

    // ==========================================
    // 🛡️ SECURITY GATE (Module Specific)
    // ==========================================
    // We ONLY lock down the G45 (Fees) module. 
    // This allows other groups to develop their pages without being forced to login.
    if (currentPage === 'G45_payments.html' && !userRole) {
        window.location.href = 'login.html';
        return;
    }

    // Do not inject the navbar on standalone pages (Login or Mobile Verification)
    if (currentPage === 'login.html' || currentPage.includes('verify')) return;

    // ==========================================
    // 🔗 ROLE-BASED LINK GENERATION
    // ==========================================
    const isStudent = (userRole === 'student');

    // Admin Links (Visible to Admins and Guests)
    const adminLinks = `
        <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Dashboard</a>
        <a href="G42_students.html" class="${currentPage === 'G42_students.html' ? 'active' : ''}">Students</a>
        <a href="G43_rooms.html" class="${currentPage === 'G43_rooms.html' ? 'active' : ''}">Rooms</a>
        <a href="G44_allotment.html" class="${currentPage === 'G44_allotment.html' ? 'active' : ''}">Allotment</a>
    `;

    // Maintenance Link (Visible to Admins and Guests)
    const maintenanceLink = `
        <a href="G46_complaints.html" class="${currentPage === 'G46_complaints.html' ? 'active' : ''}">Maintenance</a>
    `;

    // The Logout Button (Only visible if logged in)
    const logoutBtn = userRole ? `
        <a href="#" onclick="logoutUser()" style="color: #fca5a5; margin-left: 25px; font-weight: bold;">Logout</a>
    ` : '';

    // ==========================================
    // 🏗️ BUILD AND INJECT NAVBAR
    // ==========================================
    const navbarHTML = `
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">LNMIIT Hostel</div>
            <div class="links">
                
                <!-- If Student, hide Admin Links. Otherwise, show them. -->
                ${isStudent ? '' : adminLinks}
                
                <!-- Fees Link: If not logged in, clicking this sends them to Login -->
                <a href="${userRole ? 'G45_payments.html' : 'login.html'}" class="${currentPage === 'G45_payments.html' ? 'active' : ''}">Fees</a>
                
                <!-- If Student, hide Maintenance (unless G46 decides to add student logic later) -->
                ${isStudent ? '' : maintenanceLink}
                
                <!-- Display Logout button if applicable -->
                ${logoutBtn}

            </div>
        </div>
    </nav>
    `;

    // Inject into the body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
});

// ==========================================
// 🚪 LOGOUT FUNCTION
// ==========================================
function logoutUser() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeStudentId');
    // Send them back to the public dashboard
    window.location.href = 'index.html'; 
}

// ==========================================
// 🔐 DASHBOARD GATEKEEPER
// ==========================================
// Called when someone clicks the "Fees & Payments" card on the main dashboard
function checkFeeAccess() {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole) {
        // If already logged in, send them straight to the module
        window.location.href = 'G45_payments.html';
    } else {
        // If not logged in, force them through the login gate
        window.location.href = 'login.html';
    }
}