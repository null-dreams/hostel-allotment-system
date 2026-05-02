const G44_Allotment = require('../models/G44_Allotment');
const G42_Student = require('../models/G42_Student'); 
const G43_Room = require('../models/G43_Room');       

const getAllotments = async (req, res) => {
    try {
        const allotments = await G44_Allotment.find();
        res.status(200).json(allotments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching allotments', error: error.message });
    }
};

const assignRoom = async (req, res) => {
    try {
        const { studentId, roomNumber, academicYear } = req.body;
        const sId = studentId.toUpperCase().toUpperCase();

        // 🛡️ GATE 1: Verify student exists in G42
        const student = await G42_Student.findOne({ studentId: sId });
        if (!student) {
            return res.status(404).json({ message: "Error: This Student ID is not registered in Group 42's records." });
        }

        // 🛡️ GATE 2: Verify room exists in G43
        const room = await G43_Room.findOne({ roomNumber: roomNumber });
        if (!room) {
            return res.status(404).json({ message: "Error: Room number not found in Group 43's database." });
        }

        // Logic check: Is the room already full?
        if (room.currentOccupancy >= room.maxCapacity) {
            return res.status(400).json({ message: "Error: This room is already at maximum capacity." });
        }

        // Everything is valid, proceed with allotment
        const newAllotment = new G44_Allotment({ studentId: sId, roomNumber, academicYear });
        const savedAllotment = await newAllotment.save();
        
        res.status(201).json({ message: 'Room allotted successfully!', data: savedAllotment });

    } catch (error) {
        // Handle Mongoose duplicate student error
        if (error.code === 11000) {
            return res.status(400).json({ message: "Error: This student is already assigned to a room." });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports = { getAllotments, assignRoom };