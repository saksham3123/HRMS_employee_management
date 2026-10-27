/*------------------------------------------------------------------
[Project Dashboard page Js - Optimized]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

// ====================== Time Summary ======================
const timeSummaryEl = document.querySelector("#timeSummaryChart");
if (timeSummaryEl) {
    new ApexCharts(timeSummaryEl, {
        chart:{type:'donut',height:230},
        series:[132,24],
        labels:['Billable','Non-Billable'],
        colors:['var(--bs-primary)','var(--bs-danger)'],
        legend:{position:'bottom'}
    }).render();
}


// ====================== Project Analysis ======================
const chartData = {
    week: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        series: [
            { name:'Revenue', type:'column', data:[22,28,25,30,35,40,38] },
            { name:'Budgets %', type:'column', data:[90,92,94,93,95,96,97] },
            { name:'Expenses', type:'line', data:[18,20,22,25,28,30,29] }
        ]
    },
    month: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        series: [
            { name:'Revenue', type:'column', data:[140,150,160,155,170,186,175,168,172,180,190,205] },
            { name:'Budgets %', type:'column', data:[92,96,94,95,97,101,98,99,97,96,100,102] },
            { name:'Expenses', type:'line', data:[130,145,150,148,165,170,168,160,162,170,175,180] }
        ]
    },
    year: {
        labels: ['2021','2022','2023','2024','2025'],
        series: [
            { name:'Revenue', type:'column', data:[920,980,1050,1120,1240] },
            { name:'Budgets %', type:'column', data:[88,90,93,95,97] },
            { name:'Expenses', type:'line', data:[860,910,980,1020,1100] }
        ]
    }
};

const projectEl = document.querySelector("#ProjectAnalysisChart");
let projectChart;

if (projectEl) {
    projectChart = new ApexCharts(projectEl, {
        chart: { height: 270, type: 'line', toolbar: { show: false } },
        series: chartData.month.series,
        labels: chartData.month.labels,
        stroke: { width: [0, 0, 3] },
        colors: ['var(--bs-primary)','var(--bs-gray-400)','var(--bs-danger)'],
        dataLabels: { enabled: false },
        legend: {
            position: 'bottom',
            horizontalAlign: 'left',
            fontSize: '12px',
            markers: { radius: 12 }
        }
    });

    projectChart.render();
}


// ====================== Filter Buttons ======================
function setActive(btnId) {
    document.querySelectorAll('.btn-light')
        .forEach(btn => btn.classList.remove('active'));

    const el = document.getElementById(btnId);
    if (el) el.classList.add('active');
}

const filterWeek = document.getElementById('filterWeek');
if (filterWeek && projectChart) {
    filterWeek.addEventListener('click', () => {
        projectChart.updateOptions({
            labels: chartData.week.labels,
            series: chartData.week.series
        });
        setActive('filterWeek');
    });
}

const filterMonth = document.getElementById('filterMonth');
if (filterMonth && projectChart) {
    filterMonth.addEventListener('click', () => {
        projectChart.updateOptions({
            labels: chartData.month.labels,
            series: chartData.month.series
        });
        setActive('filterMonth');
    });
}

const filterYear = document.getElementById('filterYear');
if (filterYear && projectChart) {
    filterYear.addEventListener('click', () => {
        projectChart.updateOptions({
            labels: chartData.year.labels,
            series: chartData.year.series
        });
        setActive('filterYear');
    });
}


// ====================== Monthly Target ======================
const monthlyTargetEl = document.querySelector("#monthlyTargetChart");
if (monthlyTargetEl) {
    new ApexCharts(monthlyTargetEl, {
        chart: {
            type: 'radialBar',
            height: 260,
            offsetY: -10,
            sparkline: { enabled: true }
        },
        series: [81],
        colors: ['var(--bs-primary)'],
        labels: ['Progress'],
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                hollow: { size: '65%' },
                track: {
                    background: '#eef0f6',
                    strokeWidth: '100%'
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: -5,
                        fontSize: '28px',
                        fontWeight: 700,
                        formatter: val => val + '%'
                    }
                }
            }
        }
    }).render();
}


// ====================== Table Row Selection ======================

// Row check
document.querySelectorAll(".row-check").forEach(chk => {
    chk.addEventListener("change", function () {
        this.closest("tr")?.classList.toggle("active-row", this.checked);
    });
});

// Check All
const checkAll = document.getElementById("checkAll");
if (checkAll) {
    checkAll.addEventListener("change", function () {
        document.querySelectorAll(".row-check").forEach(chk => {
            chk.checked = this.checked;
            chk.closest("tr")?.classList.toggle("active-row", this.checked);
        });
    });
}