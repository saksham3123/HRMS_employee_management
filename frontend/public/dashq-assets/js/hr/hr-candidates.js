/*------------------------------------------------------------------
[HRMS Candidates page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
// Custom template for the card content
function createCard(name, designation, rating, subtext, type = "", avatarUrl) {
    let badge = type ? `<span class="fs-12 py-1 px-2 rounded-pill ${type === 'urgent' ? 'bg-danger-subtle' : 'bg-primary-subtle'} mb-2 d-inline-block">${subtext}</span>` : '';
    return `
        <div class="card rounded-4 mt-0">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <img src="${avatarUrl}" class="avatar" loading="lazy" alt="avatar">
                    <a href="#" class="text-muted"><i class="bi bi-file-earmark-pdf fs-5"></i></a>
                </div>
                <h6 class="mb-1">${name}</h6>
                <p class="small text-muted">${designation}</p>
                <div class="text-warning mb-2">
                    ${'<i class="bi bi-star-fill"></i>'.repeat(rating)}${'<i class="bi bi-star"></i>'.repeat(5 - rating)}
                </div>
                ${badge}
                <div class="d-flex justify-content-between mt-2 pt-2 border-top align-items-center">
                    <span class="text-muted fs-12"><i class="bi bi-chat-left-text me-1"></i> 3 Notes</span>
                    <i class="bi bi-three-dots"></i>
                </div>
            </div>
        </div>
    `;
}

const kanban = new jKanban({
    element: '#myKanban',
    gutter: '0',
    widthBoard: '320px',
    boards: [
        {
            id: '_applied',
            title: 'Applied (4)',
            item: [
                { title: createCard('Arjun Mehta', 'Web Designer', 4, 'Applied 2h ago', '', 'https://ui-avatars.com/api/?name=Arjun+M&background=6366f1&color=fff') },
                { title: createCard('Sarah Jenkins', 'SEO', 3, 'Applied 5h ago', '', 'https://ui-avatars.com/api/?name=Sarah+J&background=10b981&color=fff') }
            ]
        },{
            id: '_screening',
            title: 'Screening (2)',
            item: [
                { title: createCard('Marcus Chen', 'ReactJs Developer', 5, 'Portfolio Review', 'urgent', 'https://ui-avatars.com/api/?name=Marcus+C&background=f59e0b&color=fff') }
            ]
        },{
            id: '_interview',
            title: 'Interview (2)',
            item: [
                { title: createCard('Elena Gilbert', 'Marketing', 5, 'Feb 22, 10:00 AM', 'interview', 'https://ui-avatars.com/api/?name=Elena+G&background=random') },
                { title: createCard('David Wilson', 'Web Developer', 4, 'Feb 23, 02:30 PM', 'interview', 'https://ui-avatars.com/api/?name=David+W&background=random') }
            ]
        },{
            id: '_offer',
            title: 'Offer (1)',
            item: [
                { title: createCard('Sophia Rodriguez', 'Business Analyst', 5, '$155k/Year Negotiating', 'interview', 'https://ui-avatars.com/api/?name=Sophia+R&background=0ea5e9&color=fff') }
            ]
        }
    ],
    dropEl: function (el, target, source, sibling) {
        console.log("Candidate moved to new stage!");
    }
});