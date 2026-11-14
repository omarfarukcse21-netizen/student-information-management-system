// ===== ১. দরকারি মডিউল =====
const fs = require('fs');     // ফাইল পড়া ও লেখার জন্য
const path = require('path'); // ফাইলের ঠিকানা বানানোর জন্য

// ডাটা সেভ হবে এই ফাইলে
const DATA_FILE = path.join(__dirname, 'students.json');

// ডিপার্টমেন্ট ও সেমিস্টারের তালিকা (চাইলে নিজের মতো বদলাতে পারবে)
const DEPARTMENTS = ['CSE', 'EEE', 'Civil', 'Mechanical', 'BBA', 'English'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ===== ২. গ্লোবাল ভেরিয়েবল =====
let students = [];     // সব স্টুডেন্টের তালিকা এখানে থাকবে
let editingId = null;  // এডিট চললে কোন ID এডিট হচ্ছে সেটা এখানে থাকবে
let currentPhoto = ''; // বাছাই করা ছবির (ছোট করা) ডাটা এখানে থাকবে

// ===== ৩. HTML-এর এলিমেন্টগুলো ধরা =====
const form = document.getElementById('student-form');
const idInput = document.getElementById('studentId');
const nameInput = document.getElementById('studentName');
const deptSelect = document.getElementById('department');
const semSelect = document.getElementById('semester');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photo-preview');
const errorMsg = document.getElementById('error-msg');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

const searchInput = document.getElementById('searchInput');
const filterDept = document.getElementById('filterDept');
const tableBody = document.getElementById('student-table-body');
const emptyMsg = document.getElementById('empty-msg');
const countBadge = document.getElementById('count');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// ===== ৪. ফাইল থেকে ডাটা পড়া ও ফাইলে ডাটা লেখা =====
function loadStudents() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const text = fs.readFileSync(DATA_FILE, 'utf-8');
      students = JSON.parse(text);
    } else {
      students = [];
    }
  } catch (error) {
    console.error('Could not read data file:', error);
    students = [];
  }
}

function saveStudents() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
}

// ===== ৫. ড্রপডাউন ভরা =====
function fillSelects() {
  deptSelect.innerHTML = '<option value="">Select department</option>';
  semSelect.innerHTML = '<option value="">Select semester</option>';
  filterDept.innerHTML = '<option value="">All Departments</option>';

  DEPARTMENTS.forEach(function (d) {
    deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
    filterDept.innerHTML += `<option value="${d}">${d}</option>`;
  });

  SEMESTERS.forEach(function (s) {
    semSelect.innerHTML += `<option value="${s}">Semester ${s}</option>`;
  });
}

// ===== ৬. ছোট সাহায্যকারী ফাংশন =====
// ব্যবহারকারীর লেখা যেন HTML হিসেবে না চলে, সেজন্য এই ফাংশন
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(message) {
  errorMsg.textContent = message;
}

// ছবি ছোট করে (সর্বোচ্চ ২০০px) টেক্সট আকারে (base64) বানানো
// এতে students.json ফাইল ভারী হয় না
function readPhoto(file, callback) {
  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.onload = function () {
      const MAX = 200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function showPreview(src) {
  if (src) {
    photoPreview.src = src;
    photoPreview.classList.remove('hidden');
  } else {
    photoPreview.removeAttribute('src');
    photoPreview.classList.add('hidden');
  }
}

function clearForm() {
  form.reset();
  currentPhoto = '';
  showPreview('');
  showError('');
  editingId = null;
  idInput.disabled = false;
  formTitle.textContent = 'Add New Student';
  saveBtn.textContent = 'Save Student';
  cancelBtn.classList.add('hidden');
}

// ===== ৭. টেবিল আঁকা (সার্চ ও ফিল্টারসহ) =====
function renderTable() {
  const keyword = searchInput.value.trim().toLowerCase();
  const dept = filterDept.value;

  // শর্ত মিললে তবেই স্টুডেন্ট তালিকায় থাকবে
  const result = students.filter(function (s) {
    const matchText =
      s.id.toLowerCase().includes(keyword) ||
      s.name.toLowerCase().includes(keyword);
    const matchDept = dept === '' || s.department === dept;
    return matchText && matchDept;
  });

  countBadge.textContent = result.length;
  tableBody.innerHTML = '';
  emptyMsg.classList.toggle('hidden', result.length > 0);

  result.forEach(function (s) {
    const row = document.createElement('tr');
    const photoCell = s.photo
      ? `<img class="thumb" src="${s.photo}" alt="photo">`
      : `<div class="avatar">${escapeHtml(s.name.charAt(0).toUpperCase())}</div>`;

    row.innerHTML = `
      <td>${photoCell}</td>
      <td>${escapeHtml(s.id)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${escapeHtml(s.semester)}</td>
      <td>${escapeHtml(s.phone || '-')}</td>
      <td>
        <button class="action-btn view-btn" data-action="view" data-id="${escapeHtml(s.id)}">View</button>
        <button class="action-btn edit-btn" data-action="edit" data-id="${escapeHtml(s.id)}">Edit</button>
        <button class="action-btn delete-btn" data-action="delete" data-id="${escapeHtml(s.id)}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== ৮. ফর্ম সাবমিট (নতুন যোগ বা আপডেট) =====
function handleSubmit(event) {
  event.preventDefault(); // পেজ রিলোড হওয়া আটকাবে

  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const department = deptSelect.value;
  const semester = semSelect.value;
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  // --- যাচাই (validation) ---
  if (id === '' || name === '' || department === '' || semester === '') {
    showError('Please fill in all required (*) fields.');
    return;
  }

  if (phone !== '' && !/^01\d{9}$/.test(phone)) {
    showError('Phone number must be 11 digits and start with 01.');
    return;
  }

  if (email !== '' && !/^\S+@\S+\.\S+$/.test(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  if (editingId === null) {
    // নতুন স্টুডেন্ট: একই ID আগে থেকে থাকলে আটকাও
    const exists = students.some(function (s) {
      return s.id === id;
    });
    if (exists) {
      showError('This Student ID already exists.');
      return;
    }
    students.push({ id, name, department, semester, phone, email, photo: currentPhoto });
  } else {
    // এডিট: ওই ID-র স্টুডেন্টকে খুঁজে তথ্য বদলাও
    const index = students.findIndex(function (s) {
      return s.id === editingId;
    });
    students[index] = { id: editingId, name, department, semester, phone, email, photo: currentPhoto };
  }

  saveStudents();
  clearForm();
  renderTable();
}

// ===== ৯. View / Edit / Delete =====
function findStudent(id) {
  return students.find(function (s) {
    return s.id === id;
  });
}

function viewStudent(id) {
  const s = findStudent(id);
  const photoHtml = s.photo ? `<img class="modal-photo" src="${s.photo}" alt="photo">` : '';
  modalBody.innerHTML = `
    ${photoHtml}
    <div class="detail-row"><span>ID</span><span>${escapeHtml(s.id)}</span></div>
    <div class="detail-row"><span>Name</span><span>${escapeHtml(s.name)}</span></div>
    <div class="detail-row"><span>Department</span><span>${escapeHtml(s.department)}</span></div>
    <div class="detail-row"><span>Semester</span><span>${escapeHtml(s.semester)}</span></div>
    <div class="detail-row"><span>Phone</span><span>${escapeHtml(s.phone || '-')}</span></div>
    <div class="detail-row"><span>Email</span><span>${escapeHtml(s.email || '-')}</span></div>
  `;
  modal.classList.remove('hidden');
}

function startEdit(id) {
  const s = findStudent(id);
  editingId = id;

  idInput.value = s.id;
  idInput.disabled = true; // ID বদলানো যাবে না
  nameInput.value = s.name;
  deptSelect.value = s.department;
  semSelect.value = s.semester;
  phoneInput.value = s.phone;
  emailInput.value = s.email;
  currentPhoto = s.photo || '';
  photoInput.value = '';
  showPreview(currentPhoto);

  formTitle.textContent = 'Edit Student';
  saveBtn.textContent = 'Update Student';
  cancelBtn.classList.remove('hidden');
  showError('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteStudent(id) {
  const ok = confirm('Are you sure you want to delete this student?');
  if (!ok) return;

  students = students.filter(function (s) {
    return s.id !== id;
  });
  saveStudents();
  if (editingId === id) clearForm();
  renderTable();
}

// ===== ১০. ইভেন্ট (বাটন চাপা, লেখা ইত্যাদি) =====
form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', clearForm);
searchInput.addEventListener('input', renderTable);

// ছবি বাছাই করলে ছোট করে প্রিভিউ দেখাবে
photoInput.addEventListener('change', function () {
  const file = photoInput.files[0];
  if (!file) return;
  readPhoto(file, function (dataUrl) {
    currentPhoto = dataUrl;
    showPreview(dataUrl);
  });
});
filterDept.addEventListener('change', renderTable);
modalClose.addEventListener('click', function () {
  modal.classList.add('hidden');
});

// টেবিলের ভেতরের যেকোনো বাটন চাপলে এখানে ধরা পড়বে
tableBody.addEventListener('click', function (event) {
  const btn = event.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'view') viewStudent(id);
  if (action === 'edit') startEdit(id);
  if (action === 'delete') deleteStudent(id);
});

// ===== ১১. অ্যাপ চালু হলে যা যা হবে =====
fillSelects();
loadStudents();
renderTable();
