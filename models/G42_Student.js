// Purpose: Defines the data structure (Schema) for this module's database entries.

const mongoose = require("mongoose");

// Helper function provided by Group 42 for automatic hostel selection
function getHostel(gender, year) {
  if (gender == "Female") return "GH";
  if (gender == "Male" && year == 1) return "BH4";
  if (gender == "Male" && year == 2) return "BH1";
  if (gender == "Male" && year == 3) return "BH3";
  if (gender == "Male" && year == 4) return "BH2";
  return "";
}

const G42_StudentSchema = new mongoose.Schema(
{
 
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true 
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  course: {
    type: String,
    required: true,
    trim: true
  },

  year: {
    type: Number,
    required: true
  },

  gender: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },


  allocatedHostel: {
    type: String
  }
},
{ timestamps: true }
);

G42_StudentSchema.pre("save", function() {
  this.allocatedHostel = getHostel(this.gender, this.year);
 
});


module.exports = mongoose.model("G42_Student", G42_StudentSchema);