// MODIFICA CHIAVE: Usiamo window.onload invece di DOMContentLoaded.
// Questo evento attende che TUTTE le risorse della pagina (inclusi gli script come Lucide) siano caricate.
window.onload = function() {
    try {
        // --- INIZIALIZZAZIONE ---
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

        // Controllo per elementi critici
        if (!generateReportBtn || !modal || !calendarEl) {
            throw new Error("Elemento HTML critico non trovato. Controllare gli ID in index.html.");
        }

        entryDateInput.value = new Date().toISOString().slice(0, 10);
        
        let calendarEvents = [];
        try {
            const storedEvents = localStorage.getItem('calendarEvents_v3');
            if (storedEvents) {
                calendarEvents = JSON.parse(storedEvents);
            }
        } catch (e) {
            console.error("Errore caricando eventi da localStorage", e);
            calendarEvents = [];
        }

        // --- IMPOSTAZIONE FULLCALENDAR ---
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

        // --- FUNZIONI ---
        function showToast(message) {
            if(toastMessage && toast) {
                toastMessage.textContent = message;
                toast.classList.remove('opacity-0', 'translate-y-10');
                setTimeout(() => toast.classList.add('opacity-0', 'translate-y-10'), 3000);
            } else {
                alert(message); // Fallback se il toast non funziona
            }
        }

        function saveAndRerender() {
            localStorage.setItem('calendarEvents_v3', JSON.stringify(calendarEvents));
            calendar.removeAllEvents();
            calendar.addEventSource(calendarEvents);
        }

        function toggleShiftInput() {
            if(entryTypeInput && shiftWrapper) {
                shiftWrapper.style.display = (entryTypeInput.value === 'need') ? 'block' : 'none';
            }
        }

        function generateReportHtml() {
            if (!calendarEvents || calendarEvents.length === 0) {
                return '<p class="text-center text-gray-500">Nessun dato da mostrare. Aggiungi prima una voce al calendario.</p>';
            }

            const sortedEvents = [...calendarEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
            const firstDate = new Date(sortedEvents[0].start + 'T00:00:00');
            const lastDate = new Date(sortedEvents[sortedEvents.length - 1].start + 'T00:00:00');
            const today = new Date();
            const groupedData = {};
            
            sortedEvents.forEach(event => {
                const date = event.start.split('T')[0];
                if (!groupedData[date]) {
                    groupedData[date] = { needs: { early: 0, medium: 0, late: 0 }, leaves: 0 };
                }
                const props = event.extendedProps;
                if (props.type === 'need') {
                    groupedData[date].needs[props.shift] += props.quantity;
                } else if (props.type === 'leave') {
                    groupedData[date].leaves += props.quantity;
                }
            });

            const formatDate = (d) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            let reportHtml = `<div style="font-family: Arial, sans-serif; color: #000; border: 1px solid #000; padding: 20px;"><style>.report-table{border-collapse:collapse;width:100%;font-size:14px;}.report-table th,.report-table td{border:1px solid #000;padding:8px;text-align:left;vertical-align:middle;}.report-table th{background-color:#e0e0e0;font-weight:bold;}.icon-cell{width:40px;text-align:center;}</style><h2 style="text-align:center;font-size:20px;font-weight:bold;margin:0 0 20px 0;">Stato degli effettivi: dal ${formatDate(firstDate)} al ${formatDate(lastDate)}</h2><table style="width:100%;margin-bottom:20px;font-size:14px;border:none;"><tr><td style="border:none;padding:2px;"><strong>Deposito:</strong> ${document.getElementById('deposito').value}</td><td style="border:none;padding:2px;text-align:right;"><strong>Disponibilità di congedi =</strong> <span style="display:inline-block;width:15px;height:15px;background-color:#22c55e;border:1px solid #000;vertical-align:middle;"></span></td></tr><tr><td style="border:none;padding:2px;"><strong>Situazione al:</strong> ${formatDate(today)}</td><td style="border:none;padding:2px;text-align:right;"><strong>Mancanza di personale =</strong> <span style="color:#ef4444;font-size:20px;vertical-align:middle;">&#9650;</span></td></tr></table><table class="report-table"><thead><tr><th>Data</th><th class="icon-cell"></th><th>Nr. Turni / Nr. Congedi possibili</th><th>Osservazioni</th></tr></thead><tbody>`;

            for (const dateStr in groupedData) {
                const data = groupedData[dateStr];
                const date = new Date(dateStr + 'T00:00:00');
                const needs = data.needs;
                const hasNeeds = needs.early > 0 || needs.medium > 0 || needs.late > 0;
                let icon = '', description = '';
                if (hasNeeds) {
                    icon = '<span style="color:#ef4444;font-size:24px;line-height:1;">&#9650;</span>';
                    let parts = [];
                    if (needs.early > 0) parts.push(`${needs.early} presto`);
                    if (needs.medium > 0) parts.push(`${needs.medium} medio`);
                    if (needs.late > 0) parts.push(`${needs.late} tardi`);
                    description = parts.join(' + ');
                } else if (data.leaves > 0) {
                    icon = `<span style="display:inline-block;width:18px;height:18px;background-color:#22c55e;border:1px solid #000;"></span>`;
                    description = `${data.leaves} congedi`;
                }
                if (icon) {
                    reportHtml += `<tr><td>${formatDate(date)}</td><td class="icon-cell">${icon}</td><td>${description}</td><td></td></tr>`;
                }
            }
            reportHtml += `</tbody></table><p style="margin-top:20px;"><strong>Particolarità del mese:</strong> ${document.getElementById('particolarita').value}</p><p style="margin-top:20px;font-size:12px;">Se desiderate prendere un giorno di congedo o dare la vostra disponibilità, anche in cambio di un congedo, siete pregati di inserire la richiesta in Sopre.<br>Eventualmente contattare: Distributore mensile, +41 51 285 11 11.</p><p style="font-size:12px;">Vi ringraziamo per la vostra collaborazione.</p></div>`;
            return reportHtml;
        }

        function openModal() {
            try {
                const reportHtml = generateReportHtml();
                reportContent.innerHTML = reportHtml;
                modal.classList.remove('hidden');
                setTimeout(() => {
                    const modalContent = modal.querySelector('div');
                    if (modalContent) {
                        modalContent.classList.remove('scale-95', 'opacity-0');
                    }
                }, 10);
            } catch (error) {
                console.error("Errore in openModal:", error);
                showToast(`Errore: ${error.message}.`);
            }
        }

        function closeModal() {
            const modalContent = modal.querySelector('div');
            if (modalContent) {
                modalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        }

        // --- EVENT LISTENERS ---
        generateReportBtn.addEventListener('click', openModal);
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Sei sicuro di voler cancellare tutti i dati?')) {
                calendarEvents = [];
                saveAndRerender();
                showToast('Tutti i dati sono stati cancellati.');
            }
        });
        entryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(entryForm);
            const date = formData.get('entryDate');
            const type = formData.get('entryType');
            const shift = formData.get('shiftType');
            const quantity = parseInt(formData.get('quantity'), 10);
            let title = '', color = '', extendedProps = { type, quantity };
            if (type === 'need') {
                const shiftText = { early: 'Presto', medium: 'Medio', late: 'Tardi' }[shift];
                title = `Turno da coprire: ${quantity} (${shiftText})`;
                color = '#ef4444';
                extendedProps.shift = shift;
            } else if (type === 'leave') {
                title = `Congedo/Disponibilità: ${quantity}`;
                color = '#22c55e';
            }
            calendarEvents.push({ id: Date.now().toString(), title, start: date, allDay: true, color, extendedProps });
            saveAndRerender();
            showToast('Voce aggiunta al calendario.');
            entryForm.reset();
            entryDateInput.value = new Date().toISOString().slice(0, 10);
            toggleShiftInput();
        });
        entryTypeInput.addEventListener('change', toggleShiftInput);
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        copyHtmlBtn.addEventListener('click', () => {
            const textarea = document.createElement('textarea');
            textarea.value = reportContent.innerHTML;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Codice HTML copiato!');
            } catch (err) { showToast('Errore durante la copia.'); }
            document.body.removeChild(textarea);
});
        sendEmailBtn.addEventListener('click', () => {
            const subject = `Stato effettivi: ${document.getElementById('deposito').value}`;
            const body = reportContent.innerHTML;
            sendEmailBtn.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
        
        toggleShiftInput();

    } catch (error) {
        console.error("ERRORE FATALE DURANTE L'INIZIALIZZAZIONE:", error);
        alert("Si è verificato un errore critico all'avvio dello script. Controlla la console (F12) per i dettagli. Errore: " + error.message);
    }
};
