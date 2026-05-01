# 🏢 LNMIIT Hostel Management System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

A modular, integrated Hostel Management System built for LNMIIT. Designed using a microservices-inspired architecture where 5 distinct development groups contribute to a single, unified application.

---

## 🤝 Project Architecture & Sub-Modules
This project is divided into 5 integrated modules. The core routing, database configuration, and master UI layer are managed centrally by the Project Lead to ensure zero merge conflicts and seamless navigation.

*   **Group 42:** Student Management (Profiles & Registration)
*   **Group 43:** Hostel & Room Management (Blocks, Capacities, Pricing)
*   **Group 44:** Allotment Module (Room Assignments)
*   **Group 45:** Fee & Payment Module
*   **Group 46:** Complaint & Maintenance (Repair Tracking)

---

## 💰 Group 45 Focus: Fee & Payment Module
The Fee Module acts as the financial engine of the system. It dynamically fetches pricing from G43 and room assignments from G44 to generate automated student ledgers.

### 🚀 Advanced Features Implemented:
1.  **Dual-Role Auth Gate:** Frontend session routing providing distinct UI views for **Wardens (Admin Analytics)** and **Students (Personal Ledger)**.
2.  **Fault-Tolerant Integration:** Built-in "Safe Fallback" logic ensuring the billing system remains functional and generates demo ledgers even if external room/allotment modules fail to provide data.
3.  **Dynamic Financial Logic:** Automated calculation of outstanding dues, partial payment handling, and frontend/backend overpayment prevention blockers.
4.  **Automated Late Fees:** Lazy-evaluation business logic that automatically applies a ₹1,000 penalty if a student queries their ledger past the semester due date.
5.  **Enterprise PDF Generation:** Server-side PDF rendering using `pdfkit` to stream official, watermarked transaction receipts directly to the client (Zero HTML-to-PDF client unreliability).
6.  **Anti-Fraud Verification:** Dynamically generated QR codes embedded on receipts that link to a mobile-responsive, secure validation endpoint.

---

## 👥 Other Module Features
*(Note to other group leads: Please submit a Pull Request to add your module's advanced features here once your code is finalized).*

*   **Group 42 (Students):** *Pending final merge...*
*   **Group 43 (Rooms):** *Pending final merge...*
*   **Group 44 (Allotment):** *Pending final merge...*
*   **Group 46 (Maintenance):** *Pending final merge...*

---

## 🛠️ Local Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/hostel-management-system.git
cd hostel-management-system
```

**2. Install Dependencies**
```bash
npm install
```

**3. Environment Configuration**

Copy the `.env.example` file and create a new `.env` file in the root directory. Add the Shared MongoDB URI (Request this from the Project Lead):
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster...
```

**4. Start the Server**
```bash
npm start
```
*Visit `http://localhost:3000` in your browser to view the portal.*

---

## 📋 Integration Guidelines for Teams
To ensure seamless merging, all groups **must** adhere to the following rules:
1. **API Contract:** Read `docs/integration.md` for required database schema fields (e.g., `studentId`, `baseRent`).
2. **UI Kit:** Read `docs/UI_KIT.md` for styling. Use shared classes (`.btn`, `.card`) and **do not** modify the master `style.css`.
3. **Namespacing:** Prefix all your specific files, API routes, and custom CSS classes with your group number (e.g., `G42_...`).