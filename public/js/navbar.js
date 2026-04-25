// Purpose: Automatically injects the shared navbar into the page.
document.addEventListener("DOMContentLoaded", function() {
    const navbarHTML = `
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">LNMIIT Hostel</div>
            <div class="links">
                <a href="index.html">Dashboard</a>
                <a href="G42_students.html">Students</a>
                <a href="G43_rooms.html">Rooms</a>
                <a href="G44_allotment.html">Allotment</a>
                <a href="G45_payments.html">Fees</a>
                <a href="G46_complaints.html">Maintenance</a>
            </div>
        </div>
    </nav>
    `;

    // Insert the navbar at the top of the body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
});