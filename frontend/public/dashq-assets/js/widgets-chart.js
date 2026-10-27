/*------------------------------------------------------------------
[Apex Chart Widgets page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
// Cash flow summary
function generateData(count, lower = false) {
    return Array.from({ length: count }, (_, i) => ({
        x: i + 1,
        y: lower ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4)
    }));
}
const inflowData = [
    { name: '0-4h', data: generateData(31) },
    { name: '4-8h', data: generateData(31) },
    { name: '8-12h', data: generateData(31) },
    { name: '12-16h', data: generateData(31) }
];
const outflowData = [
    { name: '0-4h', data: generateData(31, true) },
    { name: '4-8h', data: generateData(31, true) },
    { name: '8-12h', data: generateData(31, true) },
    { name: '12-16h', data: generateData(31, true) }
];

const cashflowEl = document.querySelector("#cashflowChart");
let cashflowChart;
if (cashflowEl) {
    const cashflowOptions = {
        chart: {
            type: 'heatmap',
            height: 280,
            toolbar: { show: false }
        },
        plotOptions: {
            heatmap: {
                radius: 0,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, color: '#999999' },
                        { from: 1, to: 1, color: '#666666' },
                        { from: 2, to: 2, color: '#444444' },
                        { from: 3, to: 3, color: '#222222' }
                    ]
                }
            }
        },
        dataLabels: { enabled: false },
        xaxis: { type: 'category' },
        grid: { strokeDashArray: 4 },
        series: inflowData
    };

    cashflowChart = new ApexCharts(cashflowEl, cashflowOptions);
    cashflowChart.render();
}

// TAB SWITCH
document.getElementById('inflowTab')?.addEventListener('click', function () {
    setActiveTab(this);
    cashflowChart?.updateSeries(inflowData);
});
document.getElementById('outflowTab')?.addEventListener('click', function () {
    setActiveTab(this);
    cashflowChart?.updateSeries(outflowData);
});
function setActiveTab(activeBtn) {
    document.querySelectorAll('.nav-link').forEach(btn =>
    btn.classList.remove('active')
    );
    activeBtn.classList.add('active');
}

// Total Profit Overview
const profitEl = document.querySelector("#profitChart");
if (profitEl) {
    const profitChartOptions = {
        chart: {
            type: 'bar',
            height: 260,
            toolbar: { show: false }
        },
        series: [{
            name: 'Total Sales',
            data: [30, 70, 55, 35, 80, 90, 40, 65, 45, 75, 30, 45]
        },{
            name: 'Total Revenue',
            data: [0, 0, 0, 0, 60, 0, 0, 0, 67, 0, 0, 0]
        }],
        colors: ['var(--bs-gray-400)', 'var(--bs-primary)'],
        plotOptions: {
            bar: { columnWidth: '90%' }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        },
        grid: { strokeDashArray: 4 },
        legend: { show: false }
    };
const profitChart = new ApexCharts(profitEl, profitChartOptions);profitChart.render();
}

// Revenue Target
const revenueTargetEl = document.querySelector("#revenueTargetChart");
if (revenueTargetEl) {
    const revenueTargetOptions = {
        series: [75.55],
        chart: {
            type: 'radialBar',
            height: 240,
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                hollow: { size: '70%' },
                track: {
                    background: 'var(--bs-gray-200)',
                    strokeWidth: '100%'
                },
                dataLabels: {
                name: { show: false },
                value: {
                    fontSize: '24px',
                    fontWeight: 600,
                    formatter: val => val.toFixed(2) + '%'
                }
                }
            }
        },
        colors: ['var(--bs-primary)'],
        stroke: { lineCap: 'round' }
    };

    const revenueTargetChart = new ApexCharts(revenueTargetEl,revenueTargetOptions);
    revenueTargetChart.render();
}

// small line chart 
function sparkChart(selector, data, color) {
    const options = {
        chart: {
            type: 'line',
            height: 80,
            width: 160,
            sparkline: { enabled: true }
        },
        series: [{ data }],
        stroke: {
            width: 3,
            curve: 'smooth'
        },
        markers: {
            size: 4
        },
        colors: [color],
        tooltip: {
            enabled: false
        }
    };
    new ApexCharts(document.querySelector(selector), options).render();
}
// Initialize charts
sparkChart('#chartSession', [10, 25, 90, 95, 45], 'var(--bs-primary)');
sparkChart('#chartVisitor', [70, 50, 65, 30, 75], 'var(--bs-danger)');
sparkChart('#chartTime', [30, 20, 25, 80, 95], 'var(--bs-primary)');
sparkChart('#chartRequest', [25, 20, 75, 45, 60], 'var(--bs-success)');

// small crypto chart
function cryptoChart(selector, data) {
    const options = {
        chart: {
            type: 'line',
            height: 90,
            sparkline: { enabled: true }
        },
        series: [{ data }],
        stroke: {
            curve: 'smooth',
            width: 2
        },
        colors: ['#ffffff'],
        tooltip: { enabled: false }
    };
    new ApexCharts(document.querySelector(selector), options).render();
}
cryptoChart('#btcChart', [30, 50, 40, 65, 55, 70, 60]);
cryptoChart('#usdtChart', [40, 45, 42, 55, 50, 58, 54]);
cryptoChart('#ethChart', [35, 60, 50, 70, 65, 75, 60]);

// Major Expenses
const expenseData = {
    categories: ['Housing', 'Utilities', 'Food'],
    values: [9820, 6100, 2300] // ← dynamic
};
new ApexCharts(document.querySelector("#expensesChart"), {
    chart: {
        type: 'bar',
        height: 140,
        toolbar: { show: false }
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 0,
            barHeight: '45%'
        }
    },
    dataLabels: { enabled: false },
    series: [{
        data: expenseData.values
    }],
    xaxis: {
        categories: expenseData.categories,
        labels: { style: { colors: 'var(--bs-primary)' } }
    },
    colors: ['var(--bs-primary)'],
    tooltip: {
        y: {
            formatter: val => `$${val.toLocaleString()}`
        }
    }
}).render();
document.addEventListener("DOMContentLoaded", function () {

    // Credit Score
    const creditScore = 710; // 🔹 dynamic (0–850)
    const totalBars = 30;

    // Safety clamp
    const safeScore = Math.min(Math.max(creditScore, 0), 850);
    const activeBars = Math.round((safeScore / 850) * totalBars);

    document.getElementById("scoreValue").innerText = safeScore;

    // Score text
    const scoreText = document.getElementById("scoreText");
    scoreText.innerText =
    safeScore >= 750 ? "This score is considered to be Excellent." :
    safeScore >= 650 ? "This score is considered to be Good." :
    "This score needs improvement.";

    // Render bars
    const barContainer = document.getElementById("creditBars");
    barContainer.innerHTML = "";

    for (let i = 0; i < totalBars; i++) {
        const bar = document.createElement("span");
        if (i < activeBars) bar.classList.add("active");
        barContainer.appendChild(bar);
    }
});

// Monthly Sales Bar Chart
new ApexCharts(document.querySelector("#monthlySalesChart"), {
    chart: { 
        type: 'bar', 
        height: 140, 
        toolbar: { show: false },
        sparkline: { enabled: true } // removes extra padding
    },
    series: [{ data: [30, 40, 35, 50, 49, 45] }],
    plotOptions: {
        bar: {
            borderRadius: 8,          // rounded corners
            columnWidth: '80%'        // slimmer bars
        }
    },
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.3,
            gradientToColors: ['var(--bs-primary-dark)'], // end color
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100]
        }
    },
    colors: ['var(--bs-primary)'], // start color
    dataLabels: { enabled: true },
    grid: { show: false },
    tooltip: { enabled: true }
}).render();

// Storage Chart
new ApexCharts(document.querySelector("#storageChart"), {
    chart: { type: 'radialBar', height: 220 },
    series: [79],
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.3,
            gradientToColors: ['var(--bs-primary-dark)'], // end color
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100]
        }
    },
    colors: ['var(--bs-primary)'], // start color
    plotOptions: {
        radialBar: {
            hollow: { size: '65%' },
            dataLabels: { value: { fontSize: '20px' } }
        }
    },
    labels: ['Storage Used']
}).render();

// Daily Expense
new ApexCharts(document.querySelector("#dailyExpenseChart"),{
    chart:{
        type:'bar',
        stacked:true,
        height:260,
        toolbar:{
            show:false
        }
    },
    series:[
        {name:'Food',data:[10,15,12,14,18,16,20]},
        {name:'Grocery',data:[8,10,9,11,13,12,14]},
        {name:'Shopping',data:[6,8,7,9,10,9,11]},
        {name:'Transport',data:[4,5,6,5,7,6,8]}
    ],
    colors:[
        'rgba(var(--bs-primary-rgb),0.4)',
        'rgba(var(--bs-primary-rgb),0.6)',
        'rgba(var(--bs-primary-rgb),0.8)',
        'rgba(var(--bs-primary-rgb),1)',
    ],
    plotOptions:{bar:{borderRadius:4,columnWidth:'70%'}},
    xaxis:{categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},
    legend:{position:'bottom'}
}).render();