document.addEventListener('DOMContentLoaded', function() {
    // --- INITIALIZATION ---
    lucide.createIcons();
    const calendarEl = document.getElementById('calendar');
    const entryForm = document.getElementById('entryForm');
    const entryDateInput = document.getElementById('entryDate');
    const entryTypeInput = document.getElementById('entryType');
    const shiftWrapper = document.getElementById('shiftWrapper');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const modal = document.getElementById('reportModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const copyHtmlBtn = document.getElementById('copyHtmlBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const reportContent = document.getElementById('reportContent');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    entryDateInput.value = new Date().toISOString().slice(0, 10);
    // Using a new key for local storage to avoid conflicts with previous versions
    let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents_v3')) || [];

    // --- FULLCALENDAR SETUP ---
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: calendarEvents,
        eventDidMount: (info) => info.el.setAttribute('title', info.event.title),
        eventClick: (info) => {
            if (confirm(`Vuoi eliminare l'evento: "${info.event.title}"?`)) {
                calendarEvents = calendarEvents.filter(event => event.id !== info.event.id);
                saveAndRerender();
                showToast('Evento eliminato con successo.');
            }
        },
        editable: false,
        dayMaxEvents: true,
    });
    calendar.render();
