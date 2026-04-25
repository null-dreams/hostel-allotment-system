# LNMIIT Hostel Management System: Integration Contract

This document defines the shared standards that all groups (42, 43, 44, 45, 46) must follow to ensure our sub-modules work as a single unified system.

## 1. Naming Conventions (Strict)
*   **Files:** All files MUST be prefixed with your group number (e.g., `G42_student.js`).
*   **Routes:** All Express routes MUST be prefixed with your group's API path:
    *   Group 42: `/api/g42`
    *   Group 43: `/api/g43`
    *   Group 44: `/api/g44`
    *   Group 45: `/api/g45`
    *   Group 46: `/api/g46`

## 2. Database Standards (Shared MongoDB)
We are using a shared MongoDB Atlas cluster. To keep data consistent across modules, we will use these shared keys:

*   **Student Identifier:** Use `studentId` (String) as the unique key across all models (e.g., "24UCS268").
*   **Room Identifier:** Use `roomNumber` (String) to identify specific rooms.

## 3. Inter-Module Dependencies (Who needs what?)

### A. Group 42 (Student Management)
*   **Responsibility:** Provide the base Student Profile.
*   **Required Fields for others:** `studentId`, `name`, `email`.

### B. Group 43 (Hostel & Room Management)
*   **Responsibility:** Provide Room details.
*   **Required Fields for others:** `roomNumber`, `roomType`, `baseRent`. 
*   *Note: Group 45 (Fees) needs `baseRent` to calculate bills.*

### C. Group 44 (Allotment Module)
*   **Responsibility:** Link a student to a room.
*   **Required Fields for others:** `studentId`, `roomNumber`, `allotmentDate`.
*   *Note: Group 45 (Fees) will look at this model to see which student owes money for which room.*

### D. Group 45 (Fee & Payment - LEAD)
*   **Responsibility:** Tracking payments and dues.
*   **Required Fields for others:** `paymentStatus` (String).
*   *Note: Group 46 might check if a student has "Paid" before allowing maintenance requests.*

### E. Group 46 (Complaint & Maintenance)
*   **Responsibility:** Handle student repairs.
*   **Required Fields for others:** `studentId`, `complaintStatus`.

## 4. UI Standards
*   **Stylesheet:** Use only the classes defined in `/public/css/style.css`.
*   **Navigation:** DO NOT write your own navbar. Include `<script src="js/navbar.js"></script>` at the bottom of your HTML to automatically inject the shared header.

## 5. Development Workflow
1.  **Pull** the latest changes from the `main` branch daily.
2.  Create a branch for your group: `git checkout -b feature/GXX-description`.
3.  **Do not edit** `server.js` or `db.js` without consulting the Project Lead.