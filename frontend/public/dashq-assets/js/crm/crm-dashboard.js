/*------------------------------------------------------------------
[CRM Dashboard page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
// Total Contacts
new ApexCharts(document.querySelector("#contactsBarChart"), {
    chart: {
        type: 'bar',
        height: 100,
        sparkline: { enabled: true }
    },
    series: [{ data: [10, 25, 40, 30, 15, 28] }],
    tooltip: { enabled: true },
    colors: ['var(--bs-primary-dark)'],
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'vertical',
            gradientToColors: ['var(--bs-primary)'],
            stops: [0, 100]
        }
    },
    plotOptions: {
        bar: {
            borderRadius: 4,
            columnWidth: '60%'
        }
    },
}).render();

// Tasks Overview
new ApexCharts(document.querySelector("#taskDonut"), {
    chart: {
        type: 'donut',
        height: 200
    },
    series: [12, 10, 10],
    labels: ['Follow-ups', 'In Progress', 'Pending'],
    colors: ['var(--bs-primary)', 'var(--bs-gray-500)', 'var(--bs-gray-300)'],
    legend: { show: true },
    dataLabels: { enabled: false },
    legend: {
        position: "bottom",
        horizontalAlign: "center"
    }
}).render();

// Lead Analytics
function miniAreaChart(el, strokeColor, fillColor, data) {
    new ApexCharts(document.querySelector(el), {
        chart: {
            height: 160,
            type: 'area',
            sparkline: { enabled: true }
        },
        series: [{ data }],
        stroke: {
            width: 2,
            curve: 'smooth',
            colors: [strokeColor]
        },
        fill: {
            type: 'solid',
            colors: [fillColor],
            opacity: 0.1
        },
        colors: [strokeColor],
        markers: { size: 0 },
        tooltip: { enabled: true }
    }).render();
}
miniAreaChart(
    "#leadAreaChart",
    "var(--bs-primary)",        // stroke
    "#88A4B9",        // fill
    [26, 31, 28, 30, 28, 35, 40]
);

// Traffic Sources
var options = {
    chart: {
        type: 'bar',
        height: 90,
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
            name: 'Organic',
            data: [20]
        },{
            name: 'Direct',
            data: [30]
        },{
            name: 'Referral',
            data: [10]
        },{
            name: 'Social Media',
            data: [30]
        },{
            name: 'Email',
            data: [10]
        }],
    plotOptions: {
        bar: {
            horizontal: true,
            barHeight: '100%',
            borderRadius: 0
        }
    },
    dataLabels: {
        enabled: false,
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
};
var chart = new ApexCharts(document.querySelector("#TrafficSourcesChart"), options);
chart.render();

// Activity Log
new ApexCharts(document.querySelector("#activityChart"), {
    chart: {
        type: 'bar',
        height: 90,
        toolbar: { show: false }
    },
    series: [
        { name: 'Emails', data: Array(30).fill(0).map(()=>Math.floor(Math.random()*50)) }
    ],
    colors: ['var(--bs-gray-500)'],
    plotOptions: {
        bar: {
            columnWidth: '90%',
            borderRadius: 0
        }
    },
    xaxis: {
        labels: { show: false }
    },
    dataLabels: { enabled: false },
    yaxis: { show: false },
    grid: { show: false }
}).render();

// Pipeline Value
new ApexCharts(document.querySelector("#pipelineChart"), {
    chart: {
        type: 'radialBar',
        height: 220
    },
    series: [72],
    labels: ['Active Deals'],
    colors: ['var(--bs-primary)'],
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'vertical',
            gradientToColors: ['var(--bs-primary-dark)'],
            stops: [0, 100]
        }
    },
    plotOptions: {
        radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
                margin: 5, // margin is in pixels
            },
            dataLabels: {
            name: {
                show: false
            },
            value: {
                offsetY: -2,
                fontSize: '22px'
            }
            }
        }
    },
}).render();

// Orders
new ApexCharts(document.querySelector("#ordersHeatmap"), {
    chart: {
        type: 'heatmap',
        height: 260,
        toolbar: { show: false }
    },
    dataLabels: {
        enabled: false
    },
    plotOptions: {
        heatmap: {
        radius: 4,
        shadeIntensity: 0.6,
        colorScale: {
            ranges: [
                { from: 0, to: 20, color: "#DCE1EC" },
                { from: 21, to: 40, color: "#ACB2BC" },
                { from: 41, to: 60, color: "#88909E" },
                { from: 61, to: 80, color: "#666D76" },
                { from: 81, to: 100, color: "#4C545D" }
            ]
        }}
    },
    series: [
        { name: 'Facebook', data: genData() },
        { name: 'Youtube', data: genData() },
        { name: 'Instagram', data: genData() },
        { name: 'Tiktok', data: genData() },
        { name: 'Twitter', data: genData() }
    ],
    xaxis: {
        labels: {
            show: false
        },
    },
    yaxis: {
        labels: { style: { fontSize: '13px' } }
    },
    tooltip: {
        y: {
            formatter: val => `${val} Orders`
        }
    }
}).render();
function genData() {
    return [
        { x: '01', y: Math.floor(Math.random()*100) },
        { x: '06', y: Math.floor(Math.random()*100) },
        { x: '13', y: Math.floor(Math.random()*100) },
        { x: '20', y: Math.floor(Math.random()*100) },
        { x: '27', y: Math.floor(Math.random()*100) },
        { x: '31', y: Math.floor(Math.random()*100) }
    ];
}

const revenueData = {
    week: {
        total: "84,620",
        growth: "+6.2% vs last week",
        categories: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        data: [12000, 13800, 11000, 16000, 14800, 9600, 10420]
    },
    month: {
        total: "256,054",
        growth: "+20% vs last month",
        categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        data: [120000,350000,450000,120000,200000,180000,300000,120000,250000,350000,250000,180000]
    },
    year: {
        total: "3,124,880",
        growth: "+18% vs last year",
        categories: ['2019','2020','2021','2022','2023','2024'],
        data: [1800000, 2100000, 2350000, 2600000, 2900000, 3124880]
    }
};
/* RENAMED options */
const revenueChartOptions = {
    chart: {
        type: 'bar',
        height: 240,
        toolbar: { show: false }
    },
    series: [{
        name: 'Revenue',
        data: revenueData.week.data
    }],
    colors: ['var(--bs-primary-dark)'],
    plotOptions: {
        bar: {
            borderRadius: 4,
            columnWidth: '20%'
        }
    },
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'vertical',
            gradientToColors: ['var(--bs-primary)'],
            stops: [0, 100]
        }
    },
    xaxis: {
        categories: revenueData.week.categories,
        labels: { style: { fontSize: '14px' } }
    },
    yaxis: {
        labels: {
            formatter: val => `$${val / 1000}K`
        }
    },
    grid: {
        strokeDashArray: 5
    },
    dataLabels: { enabled: false }
};
const revenueChart = new ApexCharts(
    document.querySelector("#revenueChart"),
    revenueChartOptions
);
revenueChart.render();
/* TAB SWITCH */
function switchTab(type, el) {
    document.querySelectorAll('.btn-group .btn')
        .forEach(btn => btn.classList.remove('active'));

    el.classList.add('active');

    document.getElementById('revenueValue').innerText = revenueData[type].total;
    document.getElementById('revenueGrowth').innerText = revenueData[type].growth;

    revenueChart.updateOptions({
        xaxis: {
            categories: revenueData[type].categories
        }
    });

    revenueChart.updateSeries([{
        data: revenueData[type].data
    }]);
}