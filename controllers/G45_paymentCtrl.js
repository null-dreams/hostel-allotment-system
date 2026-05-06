// Purpose: The "Brain" of the module—handles calculating dues and recording payments.
//  Handles calculating dues, tracking payments, integrating with external modules, and generating PDF receipts.
// Includes robust fallback logic to handle incomplete data from other groups.


const PDFDocument = require('pdfkit'); 
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const crypto = require('crypto');

const G45_Payment = require('../models/G45_Payment');
const G44_Allotment = require('../models/G44_Allotment'); // Integration: Who stays where
const G43_Room = require('../models/G43_Room');           // Integration: Room prices
const G42_Student = require('../models/G42_Student');    // Integration: Student exists or not
const G45_Settings = require('../models/G45_Settings'); // Admin configrations

/**
 * Fetches or initializes a student's fee ledger.
 * Features: G42 Validation, Dynamic Late Fees (Apply/Revoke/Adjust), and G43/G44 Fallback Integration
 * Robustness: If G44 or G43 data is missing, it defaults to a 40k bill.
 */

exports.getRecord = async (req, res) => {
    try {
        const id = req.params.id ? req.params.id.toUpperCase() : null;
        const role = req.headers['x-user-role'];
        const reqStudentId = req.headers['x-student-id'];

        if (role !== 'admin' && reqStudentId !== id) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this record." });
        }

        // 1. GATE: Verify Student exists (G42)
        const studentExists = await G42_Student.findOne({ studentId: id }).lean();
        if (!studentExists) {
            return res.status(404).json({ message: "Student record not found in College Database (G42)." });
        }

        // CHECK LOCAL RECORD
        let record = await G45_Payment.findOne({ studentId: id });

        if (record) {
            console.log(`[G45] Found record for ${id}. Checking Late Fee rules...`);

            // --- LATE FEE LOGIC ---
            const settings = await G45_Settings.findOne().lean(); 
            console.log("Settings fetched.");

            const DUE_DATE = settings && settings.lateFeeDueDate ? new Date(settings.lateFeeDueDate) : new Date("2026-05-10");
            const currentPenalty = (settings && settings.lateFeeAmount) ? Number(settings.lateFeeAmount) : 1000;
            const TODAY = new Date();

            let isModified = false;

            /// SCENARIO 1: Past deadline, NO fine applied yet -> Apply it
            if (TODAY > DUE_DATE && record.balance > 0 && !record.lateFeeApplied) {
                console.log("Deadline passed. Applying penalty.");
                record.totalAmount += currentPenalty;
                record.balance += currentPenalty;
                record.lateFeeApplied = true;
                record.lateFeeAmountApplied = currentPenalty;
                record.history.push({ amountPaid: currentPenalty, paymentMethod: 'System Fine', transactionId: 'LATE_' + crypto.randomBytes(8).toString('hex') });
                isModified = true;
            }
            // SCENARIO 2: Deadline extended, but fine WAS applied -> Revoke it completely
            else if (TODAY <= DUE_DATE && record.lateFeeApplied) {
                console.log("Deadline extended. Revoking penalty.");
                const refund = record.lateFeeAmountApplied || 1000;
                                console.log(`[G45] Deadline extended. Revoking fine of ₹${refund}.`);
                record.totalAmount -= refund;
                record.balance -= refund;
                record.lateFeeApplied = false;
                record.lateFeeAmountApplied = 0;
                record.history.push({ amountPaid: refund, paymentMethod: 'Fee Reversal', transactionId: 'REVOKE_' + crypto.randomBytes(8).toString('hex') });
                isModified = true;
            }
            // SCENARIO 3: Past deadline, fine WAS applied, but Warden changed the penalty amount -> Adjust it
            else if (TODAY > DUE_DATE && record.lateFeeApplied && Number(record.lateFeeAmountApplied) !== currentPenalty) {
                const applied = Number(record.lateFeeAmountApplied || 0);
                const diff = currentPenalty - applied;
                console.log(`Adjusting penalty by ${diff}`);
                record.totalAmount += diff;
                record.balance += diff;
                record.lateFeeAmountApplied = currentPenalty;
                record.history.push({ 
                    amountPaid: Math.abs(diff), 
                    paymentMethod: diff > 0 ? 'System Fine (Adjustment)' : 'Fee Reversal (Adjustment)', 
                    transactionId: 'ADJ_' + crypto.randomBytes(8).toString('hex') 
                });
                isModified = true;
            }

            if (isModified) {
                console.log("Saving updates to Database...");
                await record.save();
                console.log("Save Complete.");
            }

            const responseData = record.toObject();
            responseData.integrationStatus = "SUCCESS";
            console.log("Sending Response to Frontend.");
            return res.status(200).json(responseData);
        }

        // 3. INITIALIZE NEW RECORD (Integration Logic)
        console.log(`Initializing new record for ${id}...`);
        let roomPrice = 40000; 
        let integrationStatus = "SUCCESS"; 

        try {
            const allotment = await G44_Allotment.findOne({ studentId: id });

            if (allotment) {
                const room = await G43_Room.findOne({ roomNumber: allotment.roomNumber });
                if (room && room.baseRent) {
                    roomPrice = room.baseRent;
                    console.log(`[G45] Integration Success: Fetched price ₹${roomPrice} for room ${allotment.roomNumber}`)
                } else {
                    console.warn(`[G45] G43 Price not found. Using default 40k.`);
                    integrationStatus = "FALLBACK_G43_MISSING";
                }
            } else {
                console.warn(`[G45] No Allotment found for ${id} in G44. Using default 40k.`);
                integrationStatus = "FALLBACK_G44_MISSING";
            }
        } catch (e) { console.log("Integration sub-query failed."); }

              console.log(`[G45] Initializing new ledger for ${id} with ₹${roomPrice}`);
        const newRecord = new G45_Payment({
            studentId: id,
            totalAmount: roomPrice,
            balance: roomPrice,
            status: 'Pending'
        });

        const responseData = newRecord.toObject();
        responseData.integrationStatus = integrationStatus;

        await newRecord.save();
        console.log("New Record created successfully.");
        return res.status(201).json(newRecord);

    } catch (err) {
        console.error("CRITICAL SERVER ERROR:", err);
        if (!res.headersSent) return res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * Processes a financial transaction, validates against overpayments, updates ledger balances, and appends to the transaction history.
 */
exports.processPayment = async (req, res) => {
    try {
        let { studentId, amount, method } = req.body;

        if (typeof studentId !== 'string') {
            return res.status(400).json({ message: "Invalid Student ID format." });
        }
        
        const role = req.headers['x-user-role'];
        const reqStudentId = req.headers['x-student-id'];
        if (role !== 'admin' && reqStudentId !== studentId.toUpperCase()) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to process payments for this record." });
        }

        const allowedMethods = ['UPI', 'Net Banking', 'Card', 'OFFICE CASH'];
        if (!allowedMethods.includes(method)) {
            return res.status(400).json({ message: "Invalid payment method." });
        }

        console.log(`[G45] Processing payment: ₹${amount} for ${studentId}`);

        studentId = studentId.toUpperCase(); 
        console.log(`[G45] Processing payment: ₹${amount} for ${studentId}`);

        const record = await G45_Payment.findOne({ studentId });
        if (!record) return res.status(404).json({ message: "Student record not found." });

        const value = Number(amount);
        if (value > record.balance || value <= 0 || Number.isNaN(value)) {
            console.warn(`[G45] Invalid payment attempted. Due: ${record.balance}, Attempted: ${amount}`);
             return res.status(400).json({ 
                message: `Invalid Payment: The student only owes ₹${record.balance}. Please enter a valid amount.` 
            });
        }

        // Update Financials
        record.paidAmount += value;
        record.balance = record.totalAmount - record.paidAmount;

        // Update Status Label
        if (record.balance <= 0) {
            record.status = 'Paid';
            record.balance = 0; 
        } else if (record.paidAmount > 0) {
            record.status = 'Partial';
        }

        // Add to Transaction History Array
        record.history.push({
            amountPaid: value,
            paymentMethod: method,
            transactionId: "TXN_" + crypto.randomBytes(8).toString('hex')
        });

        await record.save();
        console.log(`[G45] Payment successful. New balance: ₹${record.balance}`);
        
        res.status(200).json({ message: "Payment recorded successfully", record });

    } catch (err) {
        console.error("[G45] Payment Processing Error:", err.message);
        res.status(500).json({ message: "Payment Failed", error: err.message });
    }
};

/** 
 * Generates and downloads a PDF report for a specific transaction using PDFKit
 *  Embeds a dynamic QR Code for anti-fraud verification.
 */

exports.generatePDFReceipt = async (req, res) => {
    try {
        const { studentId, txnId } = req.params;
        const sId = studentId.toUpperCase();

        const role = req.query.role;
        const reqStudentId = req.query.reqStudentId;
        if (role !== 'admin' && reqStudentId !== sId) {
            return res.status(403).send("Forbidden: You are not authorized to download this receipt.");
        }

        // 1. Fetch Data
        const record = await G45_Payment.findOne({ studentId: sId });
        if (!record) return res.status(404).send("Record not found.");

        const transaction = record.history.find(txn => txn.transactionId === txnId);
        if (!transaction) return res.status(404).send("Transaction not found.");

        // Fetch Room Allotment for dynamic display
        const allotment = await G44_Allotment.findOne({ studentId: sId }).lean();
        const roomDisplay = allotment ? `Room ${allotment.roomNumber}` : 'Pending Allotment';

        // Set up the PDF Document (A5 size)
        const doc = new PDFDocument({ margin: 50, size: 'A5' });

        res.setHeader('Content-Type', 'application/pdf');
        const isDownload = req.query.download === 'true';
        res.setHeader(
            'Content-Disposition',
            `${isDownload ? 'attachment' : 'inline'}; filename=LNMIIT_Receipt_${txnId}.pdf`
        );        
        doc.pipe(res);

        doc.rect(20, 20, 380, 540)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

        // ==========================================
        // 1. FULL-PAGE WATERMARK
        // ==========================================
        doc.save();
        doc.rotate(-45, { origin: [210, 297] });
        doc.fontSize(50).fillColor('#edf2f7').text('LNMIIT HOSTEL', 0, 260, { 
            align: 'center', width: 420, opacity: 0.15 
        });
        doc.restore();

        // ==========================================
        // 2. REAL LOGO & HEADER
        // ==========================================
        // Check if logo exists to prevent crashes if file is missing
        const logoPath = path.join(__dirname, '../public/assets/lnmiit_logo.jpg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 35, { width: 50 });
        } else {
            // Fallback square if logo isn't downloaded yet
            doc.roundedRect(40, 35, 50, 50, 8).fill('#003366');
            doc.fillColor('white').font('Helvetica-Bold').fontSize(22).text('LN', 58, 53);
        }

        // Heading
        doc.fillColor('#003366').font('Helvetica-Bold').fontSize(13)
           .text('THE LNM INSTITUTE OF INFORMATION TECHNOLOGY', 100, 45, { width: 280 });
        doc.fillColor('#666666').font('Helvetica').fontSize(10)
           .text('Hostel Fee Transaction Receipt', 100, 75);

        // Horizontal Divider Line
        doc.moveTo(40, 105).lineTo(380, 105).strokeColor('#e2e8f0').lineWidth(2).stroke();

        // ==========================================
        // 3. COLLEGE VERIFICATION SEAL 
        // ==========================================
        doc.circle(340, 76, 22)
        .strokeColor('#166534')
        .lineWidth(1)
        .stroke();

        doc.fontSize(6).fillColor('#166534').font('Helvetica-Bold');
        doc.text('SYSTEM', 320, 68, { width: 40, align: 'center' });
        doc.text('VERIFIED', 320, 78, { width: 40, align: 'center' });


        // ==========================================
        // 4. TWO-COLUMN DETAILS SECTION
        // ==========================================
        const startY = 125;
        const leftX = 40;
        const rightX = 210;
        const valueOffset = 60;

        // Left Column (Student Info)

        doc.fillColor('#333333').font('Helvetica-Bold').fontSize(11).text('Student Details:', leftX, startY);
        
        doc.font('Helvetica').fontSize(9);
        doc.text(`Student ID:`, leftX, startY + 20);
        doc.font('Helvetica-Bold').text(`${sId}`, leftX + valueOffset, startY + 20);
        
        //  DYNAMIC HOSTEL & ROOM LOGIC
        doc.font('Helvetica').text(`Hostel Name:`, leftX, startY + 35);

        if (!allotment) {
            // Case 1: No Allotment at all (G44 empty)
            doc.fillColor('#b45309').font('Helvetica-Bold').text('Unassigned', leftX + valueOffset, startY + 35);
            doc.fillColor('#333333').font('Helvetica').text(`Room No:`, leftX, startY + 50);
            doc.fillColor('#b45309').font('Helvetica-Bold').text('Pending', leftX + valueOffset, startY + 50);
        } else {
        // Case 2: The user has been allotted a hostel.
        // Attempt to determine the hostel name by first checking if it is available in G44.
        // If not found there, fall back to the value previously retrieved from G43.
        // If the hostel name is unavailable from both sources, display a default "Allocated" label.
            
            let hostelName = "Allocated (Pending Details)"; 
            if (allotment?.hostelName) {
                hostelName = allotment.hostelName;
            } else if(allotment?.studentId){
                // Check db using student id to check hostel
                const student = await G42_Student.findOne({ studentId: allotment.studentId }).lean();
                if (student?.allocatedHostel) {
                    hostelName = student.allocatedHostel;
                } else {
                    // Fallback if student record doesn't have hostel info
                    hostelName = "LNMIIT Campus Hostel";
                }
            } else {
                hostelName = "LNMIIT Campus Hostel"; // A safe, generic fallback
            }

            // Print the dynamic (or fallback) Hostel Name
            doc.fillColor('#333333').font('Helvetica-Bold').text(`${hostelName}`, leftX + valueOffset, startY + 35);
            
            // Print the Room Number from G44
            doc.font('Helvetica').text(`Room No:`, leftX, startY + 50);
            doc.font('Helvetica-Bold').text(`${allotment.roomNumber}`, leftX + valueOffset, startY + 50);
        }

        // Right Column (Transaction Info)
        doc.fillColor('#333333').font('Helvetica-Bold').fontSize(11).text('Payment Details:', rightX, startY);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Receipt No:`, rightX, startY + 20, {lineBreak: false });
        doc.text(`${transaction.transactionId}`, rightX + valueOffset, startY + 20);

        const formattedDate = transaction.date ? new Date(transaction.date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }): 'N/A';
        doc.text(`Date:`, rightX, startY + 35).text(`${formattedDate}`, rightX + valueOffset, startY + 35);
        doc.text(`Method:`, rightX, startY + 50).text(`${transaction.paymentMethod || 'UPI'}`, rightX + valueOffset, startY + 50);

        // ==========================================
        // 5. THE AMOUNT HIGHLIGHT BOX
        // ==========================================
        doc.moveDown(4);
        doc.roundedRect(40, 220, 340, 50, 5).fillAndStroke('#f0fdf4', '#166534');
        doc.fillColor('#166534').font('Helvetica').fontSize(11).text('Amount Received', 60, 225);

        const formattedAmount = transaction.amountPaid ? Number(transaction.amountPaid).toLocaleString('en-IN') : '0'; 
        doc.font('Helvetica-Bold').fontSize(18).text(`Rs. ${formattedAmount}`, 60, 240);

        doc.fontSize(8).fillColor('#166534').text('Digitally Verified Receipt', 40, 285);

        // ==========================================
        // 6. FOOTER
        // ==========================================
        doc.moveTo(40, 320).lineTo(380, 320).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fontSize(8).fillColor('#888888').font('Helvetica').text(
            `This is a computer-generated provisional receipt.
            Final credit to the student's ledger is subject to actual realization of funds in the LNMIIT bank account.
            Keep this reference ID for hostel clearance. No physical signature is required.`,
            40, 325, { align: 'center', width: 340, lineGap: 2 }
        );

        // QR
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // const baseUrl = "http:172.22.61.174:3000";
        const qrData = `${baseUrl}/api/g45/verify/${sId}/${transaction.transactionId}`;        
        const qrImage = await QRCode.toDataURL(qrData, {margin: 0});
        doc.image(qrImage, 330, 227, { width: 40 });    

        // Finalize PDF
        doc.end();

    } catch (err) {
        console.error("[G45] PDF Generation Error:", err.message);
        if (!res.headersSent) res.status(500).send("Error generating PDF receipt.");
    }
};

/**
The QR Code validation endpoint. Reads a local HTML template and injects live database data to prove the receipt's authenticity.
 */

exports.verifyReceipt = async (req, res) => {
    try {
        const { studentId, txnId } = req.params;
        const sId = studentId.toUpperCase();

        // 1. Fetch the data
        const record = await G45_Payment.findOne({ studentId: sId });
        
        // ----------------------------------------------------
        // THE ERROR UI (If Student or Transaction not found)
        // ----------------------------------------------------
        const sendErrorUI = (message) => {
            const filePath = path.join(__dirname, '../public/G45_error.html');
            let errorHtml = fs.readFileSync(filePath, 'utf-8');
            errorHtml = errorHtml.replace('{{MESSAGE}}', message);
            res.status(404).send(errorHtml);
        };

        if (!record) return sendErrorUI("No financial record found for this Student ID.");

        const transaction = record.history.find(txn => txn.transactionId === txnId);
        if (!transaction) return sendErrorUI("This Transaction ID does not exist in our database. It may be fraudulent.");

        // ----------------------------------------------------
        // THE SUCCESS UI
        // ----------------------------------------------------
        const filePath = path.join(__dirname, '../public/G45_verify.html');
        let htmlContent = fs.readFileSync(filePath, 'utf-8');

        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        htmlContent = htmlContent.replace('{{STUDENT_ID}}', record.studentId);
        htmlContent = htmlContent.replace('{{TXN_ID}}', transaction.transactionId);
        htmlContent = htmlContent.replace('{{DATE}}', formattedDate);
        htmlContent = htmlContent.replace('{{AMOUNT}}', transaction.amountPaid.toLocaleString('en-IN'));
        htmlContent = htmlContent.replace('{{STATUS}}', record.status);

        res.send(htmlContent);

    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).send("Internal Server Error during verification.");
    }
};

/**
 * Fetches aggregate data for the Admin Analytics Dashboard
 * Calculates total expected revenue, collected revenue, and categorical status counts.
 */
exports.getAnalytics = async (req, res) => {
    try {
        const records = await G45_Payment.find({});
        
        let totalExpected = 0;
        let totalCollected = 0;
        let statusCounts = { Paid: 0, Partial: 0, Pending: 0 };

        records.forEach(r => {
            totalExpected += Math.round(r.totalAmount);
            totalCollected += Math.round(r.paidAmount);
            if (r.status === 'Paid') statusCounts.Paid++;
            else if (r.status === 'Partial') statusCounts.Partial++;
            else statusCounts.Pending++;
        });

        res.status(200).json({
            totalExpected,
            totalCollected,
            totalPending: totalExpected - totalCollected,
            statusCounts,
            totalStudents: records.length
        });
    } catch (err) {
        res.status(500).json({ message: "Analytics Error", error: err.message });
    }
};

/**
 * Fetches the global configuration settings for Late Fees. 
 * Initializes default settings if none exist in the database.
 */
exports.getSettings = async (req, res) => {
    try {
        let settings = await G45_Settings.findOne();
        // If no settings exist yet, create a default one
        if (!settings) {
            settings = await G45_Settings.create({ lateFeeDueDate: new Date('2026-05-10') });
        }
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Allows the Warden to update the global Late Fee deadline and penalty amount.
exports.updateSettings = async (req, res) => {
    try {
        const { lateFeeDueDate, lateFeeAmount } = req.body;
        const parsedAmount = Number(lateFeeAmount);
        if(Number.isNaN(parsedAmount) || parsedAmount < 0) return res.status(400).json({message:"Late Fee must be a valid number."});
        let settings = await G45_Settings.findOne();
        
        if (settings) {
            settings.lateFeeDueDate = new Date(lateFeeDueDate);
            settings.lateFeeAmount = parsedAmount;
            await settings.save();
        } else {
            settings = await G45_Settings.create({ lateFeeDueDate: new Date(lateFeeDueDate), lateFeeAmount: parsedAmount });
        }
        res.status(200).json({ message: "Settings updated successfully", settings });
    } catch (err) {
        console.error("Settings Update Error:", err);
        res.status(500).json({ error: err.message });
    }
};