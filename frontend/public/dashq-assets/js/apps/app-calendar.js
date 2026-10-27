/*------------------------------------------------------------------
[App Calendar page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const miniCalendarEl = document.getElementById('miniCalendar');

    // Modal elements
    const eventModalEl = document.getElementById('eventModal');
    const eventModal = new bootstrap.Modal(eventModalEl);
    const eventForm = document.getElementById('eventForm');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDateInput = document.getElementById('eventDate');
    const eventStartTimeInput = document.getElementById('eventStartTime');
    const eventEndTimeInput = document.getElementById('eventEndTime');
    const eventColorSelect = document.getElementById('eventColor');

    const addEventBtn = document.getElementById('addEventBtn');

    // Helper: open modal with optional date/time
    function openEventModal(dateObj) {
        const d = dateObj ? new Date(dateObj) : new Date();

        const isoDate = d.toISOString().slice(0, 10);
        eventDateInput.value = isoDate;

        eventStartTimeInput.value = d.toTimeString().slice(0, 5) || '09:00';
        const end = new Date(d.getTime() + 60 * 60 * 1000);
        eventEndTimeInput.value = end.toTimeString().slice(0, 5);

        eventTitleInput.value = '';
        eventColorSelect.value = '#bfdbfe';
        eventModal.show();
        setTimeout(() => eventTitleInput.focus(), 150);
    }

    // MAIN calendar with some default events
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        initialDate: '2025-11-12',
        nowIndicator: true,
        slotMinTime: '08:00:00',
        slotMaxTime: '18:00:00',
        height: 'auto',
        headerToolbar: {
            right: 'prev,next',
            center: 'title',
            left: 'timeGridDay,timeGridWeek,dayGridMonth'
        },
        buttonText: {
            today: 'Today',
            month: 'Monthly',
            week: 'Weekly',
            day: 'Daily'
        },

        selectable: true,
        selectMirror: true,

        // 🔹 make events draggable & resizable
        editable: true,
        eventStartEditable: true,
        eventDurationEditable: true,

        // DEFAULT EVENTS
        events: [
            {
                title: 'Weekly Meeting',
                start: '2025-11-12T08:00:00',
                end:   '2025-11-12T09:00:00',
                backgroundColor: '#fecaca',
                borderColor: '#fecaca'
            },{
                title: 'Sprint 1',
                start: '2025-11-10T10:00:00',
                end:   '2025-11-10T13:00:00',
                backgroundColor: '#bfdbfe',
                borderColor: '#bfdbfe'
            },{
                title: 'Daily Standup',
                start: '2025-11-11T09:00:00',
                end:   '2025-11-11T09:30:00',
                backgroundColor: '#e9d5ff',
                borderColor: '#e9d5ff'
            },{
                title: 'Prototype Review',
                start: '2025-11-12T11:00:00',
                end:   '2025-11-12T13:00:00',
                backgroundColor: '#e9d5ff',
                borderColor: '#e9d5ff'
            },{
                title: 'High Fidelity Design',
                start: '2025-11-13T12:00:00',
                end:   '2025-11-13T15:00:00',
                backgroundColor: '#bbf7d0',
                borderColor: '#bbf7d0'
            },{
                title: 'Team Lunch',
                start: '2025-11-12T13:00:00',
                end:   '2025-11-12T14:00:00',
                backgroundColor: '#fde68a',
                borderColor: '#fde68a'
            }
        ],

        // click empty slot to create event
        dateClick: function(info) {
            openEventModal(info.date);
        },

        // select range (drag) to create event
        select: function(info) {
            openEventModal(info.start);
        },

        // 🔹 called when an event is dragged & dropped
        eventDrop: function(info) {
            const ev = info.event;

            console.log('moved event:', {
                title: ev.title,
                start: ev.start.toISOString(),
                end: ev.end ? ev.end.toISOString() : null
            });

            // If you later add saving to backend/localStorage:
            //  - do your save here
            //  - if saving fails, call info.revert();
        },

        // 🔹 called when an event is resized (duration changed by drag)
        eventResize: function(info) {
            const ev = info.event;

            console.log('resized event:', {
                title: ev.title,
                start: ev.start.toISOString(),
                end: ev.end ? ev.end.toISOString() : null
            });

            // same idea: save, or info.revert() on error
        }
    });

    calendar.render();

    // MINI month calendar
    const miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
        initialView: 'dayGridMonth',
        initialDate: '2025-11-12',
        headerToolbar: { left: 'prev', center: 'title', right: 'next' },
        height: 'auto',
        selectable: true,
        fixedWeekCount: false,
        aspectRatio: 1.4,
        dateClick: function(info) {
            // jump main calendar and open modal with that date
            calendar.gotoDate(info.date);
            openEventModal(info.date);
        }
    });

    miniCalendar.render();

    // Add Event button (top right)
    addEventBtn.addEventListener('click', function () {
        openEventModal(); // today by default
    });

    // Handle event form submit: add event to calendar
    eventForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const title = eventTitleInput.value.trim();
        const date = eventDateInput.value;
        const startTime = eventStartTimeInput.value || '09:00';
        const endTime = eventEndTimeInput.value || '10:00';
        const color = eventColorSelect.value;

        if (!title || !date) return;

        const start = date + 'T' + startTime + ':00';
        const end = date + 'T' + endTime + ':00';

        calendar.addEvent({
            title: title,
            start: start,
            end: end,
            backgroundColor: color,
            borderColor: color
        });

        eventModal.hide();
        eventForm.reset();
    });
});