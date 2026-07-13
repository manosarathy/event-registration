let currentUser = null;
let selectedEvent = null;

const form = document.getElementById('registrationForm');
const idField = document.getElementById('id');
const participantName = document.getElementById('participant_name');
const eventName = document.getElementById('eventName');
const displayEventName = document.getElementById('display_event_name');
const eventDate = document.getElementById('event_date');
const contactNumber = document.getElementById('contact_number');
const tableBody = document.getElementById('registrationTableBody');
const resetBtn = document.getElementById('resetBtn');
const loginForm = document.getElementById('loginForm');

// PAGE NAVIGATION
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageName).classList.add('active');
}

function goToEvents() {
  showPage('eventsPage');
  form.reset();
  idField.value = '';
  selectedEvent = null;
  displayEventName.value = '';
  document.getElementById('selectedEventTitle').textContent = '';
  loadRegistrations();
}

function logout() {
  currentUser = null;
  selectedEvent = null;
  showPage('loginPage');
  loginForm.reset();
}

// LOGIN
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const name = document.getElementById('loginName').value;
  const studentId = document.getElementById('studentId').value;
  
  currentUser = { email, name, studentId };
  
  showPage('eventsPage');
  loginForm.reset();
});

// EVENT REGISTRATION FLOW
function registerForEvent(event) {
  selectedEvent = event;
  displayEventName.value = event;
  eventName.value = event;
  document.getElementById('selectedEventTitle').textContent = `Register for: ${event}`;
  showPage('registrationPage');
  form.reset();
  idField.value = '';
  participantName.value = currentUser.name;
  displayEventName.value = event;
  eventName.value = event;
  loadRegistrations();
}

// LOAD REGISTRATIONS
async function loadRegistrations() {
  try {
    const res = await fetch('/api/registrations');
    if (!res.ok) {
      throw new Error(`Failed to fetch registrations: ${res.status}`);
    }
    const data = await res.json();

    tableBody.innerHTML = '';

    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.participant_name}</td>
        <td>${item.event_name}</td>
        <td>${item.event_date ? item.event_date.split('T')[0] : ''}</td>
        <td>${item.contact_number}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editRegistration(${item.id})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteRegistration(${item.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading registrations:', err);
  }
}

// FORM SUBMISSION
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    participant_name: participantName.value,
    event_name: eventName.value,
    event_date: eventDate.value,
    contact_number: contactNumber.value
  };

  const id = idField.value;

  try {
    let res;
    if (id) {
      res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || 'Something went wrong while saving.');
      return;
    }

    form.reset();
    idField.value = '';
    participantName.value = currentUser.name;
    displayEventName.value = selectedEvent;
    eventName.value = selectedEvent;
    await loadRegistrations();
  } catch (err) {
    console.error('Error saving registration:', err);
    alert('Failed to save registration. Check the console for details.');
  }
});

// EDIT REGISTRATION
async function editRegistration(id) {
  try {
    const res = await fetch(`/api/registrations/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch registration ${id}: ${res.status}`);
    }
    const data = await res.json();

    idField.value = data.id;
    participantName.value = data.participant_name;
    eventName.value = data.event_name;
    displayEventName.value = data.event_name;
    eventDate.value = data.event_date ? data.event_date.split('T')[0] : '';
    contactNumber.value = data.contact_number;
  } catch (err) {
    console.error('Error loading registration for edit:', err);
  }
}

// DELETE REGISTRATION
async function deleteRegistration(id) {
  const confirmDelete = confirm('Are you sure you want to delete this registration?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/registrations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }
    await loadRegistrations();
  } catch (err) {
    console.error('Error deleting registration:', err);
  }
}

// RESET BUTTON
resetBtn.addEventListener('click', () => {
  form.reset();
  idField.value = '';
  participantName.value = currentUser.name;
  displayEventName.value = selectedEvent;
  eventName.value = selectedEvent;
});