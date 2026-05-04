// Purpose: Handles frontend events, form submissions, and API calls (fetch) for this module.
let form = document.getElementById("student-form");
let title = document.getElementById("form-title");
let submitBtn = document.getElementById("submit-btn");
let cancel = document.getElementById("cancel-edit");
let msg = document.getElementById("message");

let studentId = document.getElementById("studentId");
let name1 = document.getElementById("name");
let course = document.getElementById("course");
let year = document.getElementById("year");
let gender = document.getElementById("gender");
let email = document.getElementById("email");
let phone = document.getElementById("phone");
let hostel = document.getElementById("allocatedHostel");
let recId = document.getElementById("record-id");

let body = document.getElementById("students-body");
let filter = document.getElementById("hostel-filter");

let students = [];

function getHostel(g, y) {
  if (g == "Female") return "GH";
  if (g == "Male" && y == 1) return "BH4";
  if (g == "Male" && y == 2) return "BH1";
  if (g == "Male" && y == 3) return "BH3";
  if (g == "Male" && y == 4) return "BH2";
  return "";
}

function showMsg(text, type) {
  msg.innerText = text;
  msg.className = "message " + type;

  setTimeout(() => {
    msg.className = "message hidden";
  }, 3000);
}

function clearForm() {
  form.reset();
  recId.value = "";
  hostel.value = "";
  title.innerText = "Register Student";
  submitBtn.innerText = "Save Student";
  cancel.classList.add("hidden");
}

function previewHostel() {
  hostel.value = getHostel(gender.value, Number(year.value));
}

async function api(url, options = {}) {
  let res = await fetch(url, options);
  let data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return data;
}

function validate() {
  if (studentId.value.trim().length < 2)
    return "Student ID minimum 2 characters";

  if (name1.value.trim().length < 2)
    return "Name minimum 2 characters";

  if (course.value.trim() == "")
    return "Enter Branch";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
    return "Invalid Email";

  if (!/^[0-9]{10}$/.test(phone.value))
    return "Phone must be 10 digits";

  return "";
}

function showTable() {
  let list = students;

  if (filter.value != "ALL") {
    list = students.filter(x => x.allocatedHostel == filter.value);
  }

  let rows = "";

  if (list.length == 0) {
    body.innerHTML =
      `<tr><td colspan="9" style="text-align:center">No Students Found</td></tr>`;
    return;
  }

  list.forEach(s => {
    rows += `
    <tr>
      <td>${s.studentId}</td>
      <td>${s.name}</td>
      <td>${s.course}</td>
      <td>${s.year}</td>
      <td>${s.gender}</td>
      <td>${s.email}</td>
      <td>${s.phone}</td>
      <td><span class="tag yes">${s.allocatedHostel}</span></td>
      <td>
        <button data-id="${s._id}" data-work="edit">Edit</button>
        <button data-id="${s._id}" data-work="delete" class="danger">Delete</button>
      </td>
    </tr>`;
  });

  body.innerHTML = rows;
}

async function loadData() {
  students = await api("/api/g42/");
  showTable();
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  let error = validate();

  if (error != "") {
    showMsg(error, "error");
    return;
  }

  let obj = {
    studentId: studentId.value.trim().toUpperCase(),
    name: name1.value,
    course: course.value,
    year: year.value,
    gender: gender.value,
    email: email.value,
    phone: phone.value
  };

  try {
    if (recId.value == "") {
      await api("/api/g42/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj)
      });

      showMsg("Student Added", "success");
    } else {
      await api("/api/g42/" + recId.value, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj)
      });

      showMsg("Student Updated", "success");
    }

    clearForm();
    loadData();

  } catch (err) {
    showMsg(err.message, "error");
  }
});


body.addEventListener("click", async function (e) {
  let btn = e.target.closest("button");
  if (!btn) return;

  let id = btn.dataset.id;
  let work = btn.dataset.work;

  if (work == "edit") {
    let s = students.find(x => x._id == id);

    studentId.value = s.studentId;
    name1.value = s.name;
    course.value = s.course;
    year.value = s.year;
    gender.value = s.gender;
    email.value = s.email;
    phone.value = s.phone;
    hostel.value = s.allocatedHostel;

    recId.value = s._id;
    title.innerText = "Edit Student";
    submitBtn.innerText = "Update Student";
    cancel.classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  if (work == "delete") {
    let ok = confirm("Delete this student?");
    if (!ok) return;

    await api("/api/g42/" + id, {
      method: "DELETE"
    });

    showMsg("Student Deleted", "success");
    loadData();
  }
});

gender.addEventListener("change", previewHostel);
year.addEventListener("change", previewHostel);
filter.addEventListener("change", showTable);
cancel.addEventListener("click", clearForm);

loadData();
clearForm();