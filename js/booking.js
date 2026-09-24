// ===== SHARP & CO. BOOKING SYSTEM =====

// Initialize Firebase
let db = null;
if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  } catch (e) {
    console.error('Firebase init failed:', e);
  }
}

// ===== SET MINIMUM DATE TO TODAY =====
document.addEventListener('DOMContentLoaded', function () {
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  const form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', handleBookingSubmit);
  }
});

// ===== HANDLE FORM SUBMIT =====
async function handleBookingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;

  const serviceRaw = document.getElementById('service').value;
  const barber = document.getElementById('barber').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const notes = document.getElementById('notes').value.trim();

  if (!serviceRaw || !barber || !date || !time || !name || !email || !phone) {
    alert('Please fill in all required fields.');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  const parts = serviceRaw.split('|');
  const serviceName = parts[0];
  const servicePrice = parts[1];
  const serviceDuration = parseInt(parts[2]) || 30;

  const booking = {
    service: serviceName,
    price: servicePrice,
    duration: serviceDuration,
    barber: barber,
    date: date,
    time: time,
    name: name,
    email: email,
    phone: phone,
    notes: notes,
    createdAt: new Date().toISOString()
  };

  let saved = false;
  if (db) {
    try {
      await db.collection('bookings').add(booking);
      saved = true;
      console.log('Booking saved to Firebase');
    } catch (err) {
      console.error('Firebase save failed:', err);
    }
  }

  showConfirmation(booking, saved);
}

// ===== SHOW CONFIRMATION =====
function showConfirmation(booking, savedToDb) {
  document.getElementById('bookingFormWrapper').style.display = 'none';
  document.getElementById('bookingSuccess').style.display = 'block';

  document.getElementById('confirmService').textContent = booking.service;
  document.getElementById('confirmBarber').textContent = booking.barber;
  document.getElementById('confirmDate').textContent = formatDateNice(booking.date);
  document.getElementById('confirmTime').textContent = booking.time;
  document.getElementById('confirmPrice').textContent = booking.price;

  const gcalUrl = buildGoogleCalendarUrl(booking);
  document.getElementById('googleCalBtn').href = gcalUrl;

  const icsBtn = document.getElementById('icsBtn');
  icsBtn.onclick = function (e) {
    e.preventDefault();
    downloadIcs(booking);
  };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== FORMAT DATE =====
function formatDateNice(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ===== BUILD GOOGLE CALENDAR URL =====
function buildGoogleCalendarUrl(booking) {
  const start = buildDateObject(booking.date, booking.time, 0);
  const end = buildDateObject(booking.date, booking.time, booking.duration);

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = encodeURIComponent('Haircut at Sharp & Co. — ' + booking.service);
  const details = encodeURIComponent(
    'Service: ' + booking.service + '\n' +
    'Barber: ' + booking.barber + '\n' +
    'Price: ' + booking.price + '\n\n' +
    'Booked via sharpandco.co.za'
  );
  const location = encodeURIComponent('Sharp & Co. Barbershop, 123 Bree Street, Cape Town, 8001');

  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + title +
    '&dates=' + fmt(start) + '/' + fmt(end) +
    '&details=' + details +
    '&location=' + location;
}

// ===== BUILD DATE OBJECT =====
function buildDateObject(dateStr, timeStr, addMinutes) {
  const dateParts = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);
  const year = dateParts[0], month = dateParts[1], day = dateParts[2];
  const hour = timeParts[0], minute = timeParts[1];
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  d.setUTCMinutes(d.getUTCMinutes() + addMinutes);
  return d;
}

// ===== DOWNLOAD .ICS FILE =====
function downloadIcs(booking) {
  const start = buildDateObject(booking.date, booking.time, 0);
  const end = buildDateObject(booking.date, booking.time, booking.duration);

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sharp & Co.//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + Date.now() + '@sharpandco.co.za',
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(start),
    'DTEND:' + fmt(end),
    'SUMMARY:Haircut at Sharp & Co. — ' + booking.service,
    'DESCRIPTION:Service: ' + booking.service + '\\nBarber: ' + booking.barber + '\\nPrice: ' + booking.price + '\\n\\nBooked via sharpandco.co.za',
    'LOCATION:Sharp & Co. Barbershop\\, 123 Bree Street\\, Cape Town\\, 8001',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder — Haircut at Sharp & Co.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sharp-co-booking-' + booking.date + '.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}