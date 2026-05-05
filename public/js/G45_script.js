// Purpose: Handles frontend events and API calls for the Fee & Payment module.


document.addEventListener("DOMContentLoaded", () => {
    applyRoleBasedView();
});

function getAuthHeaders() {
    return {
        'x-user-role': localStorage.getItem('userRole') || '',
        'x-student-id': localStorage.getItem('activeStudentId') || ''
    };
}

function applyRoleBasedView() {
    const role = localStorage.getItem('userRole');
    
    if (role === 'student') {
        const myId = localStorage.getItem('activeStudentId');
        document.getElementById('adminControlPanel').style.display = 'none';

        const adminAnalytics = document.getElementById('adminAnalytics');
        if (adminAnalytics) adminAnalytics.style.display = 'none';
        
        // Hide the search section from students
        const searchSection = document.querySelector('.card:nth-of-type(1)');
        if(searchSection && searchSection.querySelector('h3').innerText.includes('Lookup')) {
            searchSection.style.display = 'none';
        }
        
        // Change Header
        document.querySelector('.header h1').innerText = "My Fee Ledger";
        document.querySelector('.header .subtitle').innerText = `Viewing financial records for ${myId}`;

        // Auto-fetch their data
        document.getElementById('studentIdInput').value = myId; 
        searchStudent(); 
    }

     else if (role === 'admin') {
         // Adding special payment mode for Admin ---
        const payModeSelect = document.getElementById('pay_mode');
        if (payModeSelect) {
            // Add Cash option if it's not already there
            if (!payModeSelect.querySelector('option[value="CASH"]')) {
                const cashOption = document.createElement('option');
                cashOption.value = "OFFICE CASH";
                cashOption.text = "Cash / Office Deposit";
                payModeSelect.add(cashOption);
            }
        }
        // ADMIN VIEW
        document.getElementById('adminSettingsCard').style.display = 'block';
        fetchSettings(); // Load the current date into the input box
        
        const searchInput = document.getElementById('studentIdInput');
        if (searchInput) searchInput.closest('.card').style.display = 'block';
        
        // 1. Show the Analytics Section
        document.getElementById('adminAnalytics').style.display = 'block';
        
        // 2. Fetch and Draw the Analytics
        fetchAnalytics();
    }
}

//  MAIN SEARCH FUNCTION
async function searchStudent() {
    const studentId = document.getElementById('studentIdInput').value;

    document.getElementById('studentRecord').style.display = 'none';

    
    if (!studentId) return alert("Enter ID");

    try {
        console.log("🔍 [G45 Search] Requesting data for:", studentId); 
        const response = await fetch(`/api/g45/record/${encodeURIComponent(studentId)}`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (response.ok) {
            // Check if this is a new record created via Fallback
            if (data.integrationStatus && data.integrationStatus.includes("FALLBACK")) {
                console.warn(`⚠️ [G45 Integration] Using default price (₹${data.totalAmount}) because: ${data.integrationStatus}`);
            } else if (data.integrationStatus === "SUCCESS") {
                console.log("✅ [G45 Integration] Successfully linked with G43/G44 data.");
            }

            displayStudentRecord(data);
        } else {
            console.error("🚫 [G45 Search] Student not found:", data.message);
            alert(data.message);
        }

    } catch (err) {
        console.error("❌ [G45 Search] Network/Server Error:", err);
        alert("Server is not responding. Please check your connection.");
    }
}

//  UI RENDERING FUNCTION
function displayStudentRecord(data) {
    console.log("📊 [G45 UI] Rendering data:", data); 
    const recordView = document.getElementById('studentRecord');
    recordView.style.display = 'block';

    document.getElementById('totalBill').innerText = `₹${data.totalAmount}`;
    document.getElementById('paidAmount').innerText = `₹${data.paidAmount}`;
    const balanceElement = document.getElementById('balanceAmount');
    balanceElement.innerText = `₹${data.balance}`;

    // Prevnenting overpayment
    const paymentInput = document.getElementById('pay_amt');
    paymentInput.max = data.balance;

    // if balance is 0, input and button is disabled
    if (data.balance <= 0) {
        paymentInput.value = 0;
        paymentInput.disabled = true;
        document.getElementById('confirm_pay_btn').disabled = true;
        document.getElementById('confirm_pay_btn').innerText = "Fully Paid";
    } else {
        paymentInput.disabled = false;
        document.getElementById('confirm_pay_btn').disabled = false;
        document.getElementById('confirm_pay_btn').innerText = "Confirm Transaction";
    }

    // Remove all previous status classes to prevent mixing colors
    balanceElement.classList.remove('G45-status-paid', 'G45-status-partial', 'G45-status-pending');
    
    // Apply the correct color based on backend status
    if (data.status === 'Paid') {
        balanceElement.classList.add('G45-status-paid');      // Green
    } else if (data.status === 'Partial') {
        balanceElement.classList.add('G45-status-partial');   // Yellow/Orange
    } else {
        balanceElement.classList.add('G45-status-pending');   // Red
    }

    // --- Update the Transaction History Table ---

    const tableBody = document.getElementById('historyRows');
    tableBody.innerHTML = ''; 

    if (data.history.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-light);">No transactions found for this student.</td></tr>`;
    } else {
      // We sort the history so the newest payment is at the top
        const sortedHistory = data.history.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedHistory.forEach(item => {
          let amountColor = '#166534'; // Default Green for payments
            let amountPrefix = '₹';
            const role = localStorage.getItem('userRole') || '';
            const activeId = localStorage.getItem('activeStudentId') || '';
            let actionButton = `
                <a href="/api/g45/receipt/${data.studentId}/${item.transactionId}?role=${encodeURIComponent(role)}&reqStudentId=${encodeURIComponent(activeId)}" 
                   target="_blank" 
                   class="btn btn-primary" 
                   style="padding: 5px 10px; font-size: 0.8rem; text-decoration: none; display: inline-block;">
                   Download PDF
                </a>`;

            if (item.paymentMethod.includes('System Fine')){
                amountColor = '#be123c'; // Red for penalties
                amountPrefix = '+ ₹';    // Shows it was added to the bill
                actionButton = `<span style="color: #64748b; font-size: 0.8rem; font-style: italic;">Ledger Charge</span>`;
            } 
            else if (item.paymentMethod.includes('Fee Reversal')) {
                amountColor = '#b45309'; // Orange for refunds/reversals
                amountPrefix = '- ₹';    // Shows it was subtracted from the bill
                actionButton = `<span style="color: #64748b; font-size: 0.8rem; font-style: italic;">Ledger Credit</span>`;
            }

            const sanitize = (str) => {
                const temp = document.createElement('div');
                temp.textContent = str;
                return temp.innerHTML;
            };

            const row = `
                <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td style="font-weight: bold; color: ${amountColor};">${amountPrefix}${item.amountPaid}</td>
                    <td>${sanitize(item.paymentMethod || 'UPI')}</td>
                    <td>${actionButton}</td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    }
}


async function processPayment() {
    const studentId = document.getElementById('studentIdInput').value;
    const amount = document.getElementById('pay_amt').value;
    const method = document.getElementById('pay_mode').value;

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    try {
        const response = await fetch('/api/g45/pay', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ studentId, amount, method })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Payment recorded successfully!");
            document.getElementById('pay_amt').value = ''; // Clear input
            searchStudent(); // Refresh the dashboard to show new balance
        } else {
            alert(result.message || "Payment failed");
        }
    } catch (err) {
        console.error("Payment Error:", err);
    }
}

async function fetchAnalytics() {
    try {
        const res = await fetch('/api/g45/analytics');
        const data = await res.json();

        // Update the top numbers
        document.getElementById('statExpected').innerText = `₹${data.totalExpected.toLocaleString('en-IN')}`;
        document.getElementById('statCollected').innerText = `₹${data.totalCollected.toLocaleString('en-IN')}`;
        document.getElementById('statPending').innerText = `₹${data.totalPending.toLocaleString('en-IN')}`;

        // Draw the Pie Chart
        const ctx = document.getElementById('paymentPieChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Partial', 'Pending'],
                datasets: [{
                    data: [data.statusCounts.Paid, data.statusCounts.Partial, data.statusCounts.Pending],
                    backgroundColor: ['#166534', '#ca8a04', '#be123c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
                }
            }
        });
    } catch (err) {
        console.error("Failed to load analytics", err);
    }
}

async function fetchSettings() {
    try {
        const res = await fetch('/api/g45/settings');
        const data = await res.json();
        if (data) {
            // Populate Date
            if (data.lateFeeDueDate) {
                const parsedDate = new Date(data.lateFeeDueDate);
                if (!isNaN(parsedDate.getTime())) {
                    document.getElementById('dueDateInput').value = parsedDate.toISOString().split('T')[0];
                }
            }
            // Populate Amount
            if (data.lateFeeAmount) {
                document.getElementById('penaltyAmountInput').value = data.lateFeeAmount;
            }
        }
    } catch (err) {
        console.error("Failed to load settings", err);
    }
}

async function saveSettings() {
    const newDate = document.getElementById('dueDateInput').value;
    const newAmount = document.getElementById('penaltyAmountInput').value;
    
    if (!newDate || !newAmount) return alert("Please provide both a date and a penalty amount.");

    try {
        const res = await fetch('/api/g45/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                lateFeeDueDate: newDate, 
                lateFeeAmount: Number(newAmount) 
            })
        });

        if (res.ok) {
            alert("Settings updated successfully! The system will now use these rules.");
            window.location.reload(); 

        } else {
            alert("Failed to update settings.");
        }
    } catch (err) {
        console.error("Error saving settings:", err);
    }
}