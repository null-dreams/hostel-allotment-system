// Purpose: The "Brain" of the module—this is where you write the actual functions that handle, process, and save data.
const Student = require("../models/G42_Student");


// hostel selection
function getHostel(gender, year) {
  if (gender == "Female") return "GH";
  if (gender == "Male" && year == 1) return "BH4";
  if (gender == "Male" && year == 2) return "BH1";
  if (gender == "Male" && year == 3) return "BH3";
  if (gender == "Male" && year == 4) return "BH2";
  return "";
}

// data validation
function checkData(data) {
  let errors = [];

  if (!data.studentId || data.studentId.trim().length < 2)
    errors.push("Student ID must be minimum 2 characters");

  if (!data.name || data.name.trim().length < 2)
    errors.push("Name must be minimum 2 characters");

  if (!data.course || data.course.trim() == "")
    errors.push("Course is required");

  if (![1, 2, 3, 4].includes(Number(data.year)))
    errors.push("Select valid year");

  if (!["Male", "Female"].includes(data.gender))
    errors.push("Select gender");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push("Enter valid email");

  if (!/^[0-9]{10}$/.test(data.phone))
    errors.push("Phone must be exactly 10 digits");

  return errors;
}

function makeData(data) {
  return {
    studentId: data.studentId.trim().toUpperCase(),
    name: data.name.trim(),
    course: data.course.trim(),
    year: Number(data.year),
    gender: data.gender,
    email: data.email.trim(),
    phone: data.phone.trim(),
    allocatedHostel: getHostel(data.gender, Number(data.year))
  };
}

exports.createStudent = async (req, res) => {
  try {
    let errors = checkData(req.body);
    if (errors.length > 0) return res.status(400).json({ message: errors[0] });

    let student = await Student.create(makeData(req.body));
    res.status(201).json(student);
  } catch (err) {
    console.error("❌ G42 Create Error:", err);E
    res.status(500).json({ message: err.message }); 
  
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    let data = await Student.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Cannot Fetch Data" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    let errors = checkData(req.body);
    if (errors.length > 0) return res.status(400).json({ message: errors[0] });

    let student = await Student.findByIdAndUpdate(req.params.id, makeData(req.body), { new: true });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Cannot Update Student" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Cannot Delete Student" });
  }
};