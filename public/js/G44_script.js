// Purpose: Handles frontend events, form submissions, and API calls (fetch) for this module.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('allotmentForm');
    const messageDiv = document.getElementById('form-message');
    const tableBody = document.getElementById('allotmentsTableBody');

    // 1. Fetch and Display Table Data
    async function fetchAllotments() {
        try {
            const response = await fetch('/api/g44/allotments');
            if (!response.ok) return;
            const allotments = await response.json();
            
            tableBody.innerHTML = ''; 
            allotments.forEach(a => {
                tableBody.innerHTML += `<tr>
                    <td>${a.studentId}</td>
                    <td>${a.roomNumber}</td>
                    <td>${a.academicYear}</td>
                    <td style="font-weight: bold; color: green;">${a.status}</td>
                </tr>`;
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Load data immediately on page load
    fetchAllotments();

    // 2. Handle Form Submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const studentId = document.getElementById('studentId').value.trim().toUpperCase();
        const roomNumber = document.getElementById('roomNumber').value;
        const academicYear = document.getElementById('academicYear').value;

        try {
            const response = await fetch('/api/g44/assign', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, roomNumber, academicYear })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.style.color = 'green';
                messageDiv.innerText = "Success: " + result.message;
                form.reset(); 
                fetchAllotments(); // Refresh table automatically
            } else {
                messageDiv.style.color = 'red';
                messageDiv.innerText = "Error: " + result.message;
            }
        } catch (error) {
            messageDiv.style.color = 'red';
            messageDiv.innerText = "Failed to connect to the server.";
        }
    });
});