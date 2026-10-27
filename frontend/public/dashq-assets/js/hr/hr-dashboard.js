/*------------------------------------------------------------------
[HRMS Dashboard page Js - Optimized]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

// ====================== Counter ======================
const counters = document.querySelectorAll('.counter');

counters.forEach(counter => {
    const target = Number(counter.getAttribute('data-target'));
    if (isNaN(target)) return;

    const updateCount = () => {
        const count = Number(counter.innerText) || 0;
        const increment = Math.max(target / 100, 1);

        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(updateCount, 10);
        } else {
            counter.innerText = target.toLocaleString();
        }
    };

    updateCount();
});


// ====================== Dept Distribution ======================
const deptEl = document.querySelector("#DeptDistribution");
if (deptEl) {
    new ApexCharts(deptEl, {
        series: [44, 55, 13, 33],
        chart: { type: 'donut', height: 250 },
        labels: ['IT', 'HR', 'Sales', 'Admin'],
        colors: [
            'var(--bs-primary)',
            'var(--bs-gray-700)',
            'var(--bs-gray-600)',
            'var(--bs-gray-500)'
        ],
        legend: { position: 'bottom' }
    }).render();
}


// ====================== Attendance Overview ======================
const attendanceEl = document.querySelector("#attendanceDetailChart");
if (attendanceEl) {
    new ApexCharts(attendanceEl, {
        series: [
            { name: 'On Time', data: [110,115,108,120,180,120] },
            { name: 'Late', data: [80,70,110,40,55,30] },
            { name: 'Absent', data: [25,28,58,22,31,18] }
        ],
        chart: {
            type: 'bar',
            height: 220,
            stacked: true,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '45%'
            }
        },
        xaxis: {
            categories: ['Sep','Oct','Nov','Dec','Jan','Feb']
        },
        yaxis: {
            title: { text: 'Employee Count' }
        },
        colors: [
            'var(--bs-primary)',
            'var(--bs-gray-500)',
            'var(--bs-danger)'
        ],
        tooltip: {
            y: { formatter: val => val + " Employees" }
        }
    }).render();
}


// ====================== Company Pay ======================
const companyPayEl = document.querySelector("#CompanyPay");
if (companyPayEl) {
    new ApexCharts(document.querySelector("#CompanyPay"), {
        chart: {
            type: 'bar',
            height: 120,
            stacked: true,
            stackType: '100%',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true
            },
        },
        fill: {
            opacity: 1,
            colors: [
                'rgba(var(--bs-primary-rgb), 1)',
                'rgba(var(--bs-primary-rgb), 0.85)',
                'rgba(var(--bs-primary-rgb), 0.65)',
                'rgba(var(--bs-primary-rgb), 0.45)',
                'rgba(var(--bs-primary-rgb), 0.25)'
            ]
        },
        series: [{
                name: 'Commission',
                data: [19]
            },{
                name: 'Salary',
                data: [35]
            },{
                name: 'Overtime',
                data: [10]
            },{
                name: 'Benefits',
                data: [30]
            },{
                name: 'Bonus',
                data: [6]
            }],
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '100%',
                borderRadius: 0
            }
        },
        dataLabels: {
            enabled: true,
        },
        stroke: {
            width: 0
        },
        grid: {
            show: false,
            padding: {
                top: -15,
                bottom: -15,
                left: -15,
                right: 0
            }
        },
        xaxis: {
            categories: [""],
            labels: {
                show: false
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        legend: {
            position: "bottom",
            horizontalAlign: "left"
        }
    }).render();
}


// ====================== Working Format ======================
const workingEl = document.querySelector("#WorkingFormat");
if (workingEl) {
    new ApexCharts(workingEl, {
        chart: {
            type: 'donut',
            height: 180
        },
        series: [55, 15, 30],
        labels: ['Office', 'On site', 'Remote'],
        colors: [
            'var(--bs-primary)',
            'var(--bs-gray-500)',
            'var(--bs-gray-300)'
        ],
        dataLabels: { enabled: false },
        legend: {
            position: "bottom",
            horizontalAlign: "center"
        }
    }).render();
}