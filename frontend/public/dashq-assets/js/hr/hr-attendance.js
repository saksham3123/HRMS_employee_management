/*------------------------------------------------------------------
[HRMS Employee Attendance page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var drawerEl = document.getElementById('attendanceDrawer');
    var offcanvas = new bootstrap.Offcanvas(drawerEl);

    // Initialize Calendar
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'title',
            center: '',
            right: 'today prev,next'
        },
        events: [
            { title: 'P:265', start: '2026-07-02', className: 'border-0 fs-12 bg-success' },
            { title: 'L:34', start: '2026-07-02', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:24', start: '2026-07-02', className: 'border-0 fs-12 bg-info' },
            { title: 'A:09', start: '2026-07-02', className: 'border-0 fs-12 bg-danger' },

            { title: 'P:256', start: '2026-07-10', className: 'border-0 fs-12 bg-success' },
            { title: 'L:11', start: '2026-07-10', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:67', start: '2026-07-10', className: 'border-0 fs-12 bg-info' },
            { title: 'A:22', start: '2026-07-10', className: 'border-0 fs-12 bg-danger' },

            { title: 'P:244', start: '2026-07-12', className: 'border-0 fs-12 bg-success' },
            { title: 'L:14', start: '2026-07-12', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:44', start: '2026-07-12', className: 'border-0 fs-12 bg-info' },
            { title: 'A:17', start: '2026-07-12', className: 'border-0 fs-12 bg-danger' },
            
            { title: 'P:265', start: '2026-08-02', className: 'border-0 fs-12 bg-success' },
            { title: 'L:34', start: '2026-08-02', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:24', start: '2026-08-02', className: 'border-0 fs-12 bg-info' },
            { title: 'A:09', start: '2026-08-02', className: 'border-0 fs-12 bg-danger' },

            { title: 'P:256', start: '2026-08-10', className: 'border-0 fs-12 bg-success' },
            { title: 'L:11', start: '2026-08-10', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:67', start: '2026-09-10', className: 'border-0 fs-12 bg-info' },
            { title: 'A:22', start: '2026-08-10', className: 'border-0 fs-12 bg-danger' },

            { title: 'P:244', start: '2026-08-12', className: 'border-0 fs-12 bg-success' },
            { title: 'L:14', start: '2026-08-12', className: 'border-0 fs-12 bg-warning' },
            { title: 'W:44', start: '2026-08-12', className: 'border-0 fs-12 bg-info' },
            { title: 'A:17', start: '2026-09-12', className: 'border-0 fs-12 bg-danger' },

            // Today (Assuming Feb 18, 2026)
            { title: 'Active Now', start: '2026-07-18', className: 'border-0 px-1 fs-12 text-center rounded-pill bg-success' }
        ],
        // Click Handler
        dateClick: function(info) {
            // Update the date in the drawer header
            const dateObj = new Date(info.dateStr);
            document.getElementById('selectedDateText').innerText = dateObj.toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric' 
            });
            // Open the Offcanvas
            offcanvas.show();
        }
    });
    
    calendar.render();

    // Search Filter Logic
    document.getElementById('searchStaff').addEventListener('input', function(e) {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.employee-card').forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            card.style.display = name.includes(val) ? 'block' : 'none';
        });
    });
});