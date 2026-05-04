// Purpose: The "Traffic Controller"—it maps web addresses (URLs) to the correct function in the controller.
const express = require("express");
const router = express.Router();
const studentCtrl = require("../controllers/G42_studentCtrl");

router.get("/", studentCtrl.getAllStudents);
router.post("/", studentCtrl.createStudent);
router.put("/:id", studentCtrl.updateStudent);
router.delete("/:id", studentCtrl.deleteStudent);

module.exports = router;