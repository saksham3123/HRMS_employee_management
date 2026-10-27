/*------------------------------------------------------------------
[App JKanban page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
const kanban3 = new jKanban({
    element: '.kanban-wrapper .jkanban-advanced',
    gutter: '0',
    widthBoard: '300px',

    click: function (el) {
        // OPEN MODAL INSTEAD OF ALERT
        const modalBody = document.getElementById('taskModalBody');
        modalBody.innerHTML = el.innerHTML;

        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();
    },

    boards: [
        {
            id: 'todo',
            title: 'To Do',
            class: 'info',
            item: [
                { title: taskHTML("Create Icon Set", "Design 24 new system icons.", ["avatar-2.png"], 0, 1) },
                { title: taskHTML("API Contract Review", "Check request/response structure.", ["avatar-4.png","avatar-2.png"], 3, 6) },
                { title: taskHTML("Mobile App Wireframes", "Build low-fidelity screens.", ["avatar-1.png"], 8, 2) },
            ]
        },{
            id: 'working',
            title: 'Working',
            class: 'warning',
            item: [
                { title: taskHTML("Payment Gateway Integration", "Working on Stripe checkout flow.", ["avatar-3.png"], 7, 4) },
                { title: taskHTML("User Profile Update", "Building editable user profile module.", ["avatar-1.png","avatar-4.png"], 2, 1) },
                { title: taskHTML("Dark Mode UI Adjustments", "Fix contrast issues in dark mode.", ["avatar-2.png"], 11, 0) },
                { title: taskHTML("Email Template Coding", "Responsive email layouts.", ["avatar-3.png"], 4, 7) }
            ]
        },{
            id: 'done',
            title: 'Done',
            class: 'success',
            item: [
                { title: taskHTML("Database Indexing", "Improved query performance.", ["avatar-4.png"], 2, 3) },
                { title: taskHTML("Login System QA", "Tested login/password reset.", ["avatar-2.png"], 1, 5) }
            ]
        }
    ]
});

// Helper function to generate items
function taskHTML(title, desc, avatars = [], attach = 0, comments = 0) {
    return `
        <div class="fw-semibold mb-0 small">${title}</div>
        <span class="small text-muted">${desc}</span>
        <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="project-members d-flex gap-1">
                ${avatars.map(a => `<img class="avatar avatar-xs rounded-circle" src="../assets/images/avatar/${a}">`).join("")}
            </div>
            <div class="task-action d-flex gap-1 small">
                <span class="p-1 text-muted"><i class="bi bi-paperclip"></i> ${attach}</span>
                <span class="p-1 text-muted"><i class="bi bi-chat"></i> ${comments}</span>
            </div>
        </div>
    `;
}

// ADD NEW TODO ITEM
document.getElementById('addToDo').addEventListener('click', () => {
    kanban3.addElement('todo', {
        title: `
            <div class="fw-semibold mb-0 small">New To-Do</div>
            <span class="fs-14 lh-base">Auto added item demo.</span>
        `
    });
});

// ADD NEW BOARD
document.getElementById('addDefault').addEventListener('click', () => {
    kanban3.addBoards([
        {
            id: 'default-board',
            title: 'Kanban Default',
            item: [
                { title: 'Default Item' },
                { title: 'Default Item 2' }
            ]
        }
    ]);
});

// REMOVE DONE BOARD
document.getElementById('removeBoard').addEventListener('click', () => {
    kanban3.removeBoard('done');
});