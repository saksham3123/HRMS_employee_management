 /*------------------------------------------------------------------
[Team Management page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
 // Monthly Leads Chart
 new ApexCharts(document.querySelector("#leadsMonthChart"), {
    chart: {
        type: 'line',
        height: 160,
        toolbar: {
            show: false // hide toolbar
        },
        dropShadow: {
            enabled: true,
            top: 4,
            left: 0,
            blur: 6,
            opacity: 0.15
        }
    },
    stroke: {
        width: 2, // 1px line
        curve: 'smooth'
    },
    series: [
        { name: 'Active Leads', data: [220, 240, 265, 290, 295, 299] },
        { name: 'Converted Leads', data: [201, 207, 210, 210, 235, 260] }
    ],
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    colors: ['var(--bs-primary)', 'var(--bs-success)'],
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: ['#8b5cf6', '#4ade80'],
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100]
        }
    },

    dataLabels: {
        enabled: false
    },
    grid: {
        strokeDashArray: 4
    },
    markers: {
        size: 0
    },
    legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        markers: {
            radius: 12
        }
    }
}).render();
// Team Performance Chart
new ApexCharts(document.querySelector("#teamPerformanceChart"), {
    chart:{ type:'bar', height:275 },
    series:[
        { name:'Team Management', data:[68,75,82,90,77,85] },
        { name:'Team Web', data:[62,70,78,83,80,88] },
        { name:'Team Mobile', data:[55,63,69,75,71,66] }
    ],
    xaxis:{ categories:['Jan','Feb','Mar','Apr','May','Jun'] },
    colors: ['var(--bs-primary)', 'var(--bs-gray-700)', 'var(--bs-gray-400)'],
    legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        markers: {
            radius: 12
        }
    }
}).render();
// Workforce Health Score
new ApexCharts(document.querySelector("#healthTrend"), {
    chart: {
        type: 'bar',
        height: 140,
        toolbar: { show: false },
        parentHeightOffset: 0
    },
    series: [{
        name: 'Health Score',
        data: [82, 85, 86, 87]
    }],
    xaxis: {
        categories: ['Mar', 'Apr', 'May', 'Jun'],
        labels: {
            style: { fontSize: '10px' },
            offsetY: 2
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        min: 80,
        max: 90,
        labels: {
            formatter: val => val + '%',
            style: { fontSize: '10px' },
            offsetX: -6
        }
    },
    plotOptions: {
        bar: {
            borderRadius: 6,
            columnWidth: '38%'
        }
    },
    grid: {
        padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: -3
        }
    },
    dataLabels: {
        enabled: true,
        formatter: val => val + '%',
        offsetY: 0,
        style: {
            fontSize: '10px',
        }
    },
    colors: ['var(--bs-primary)'],
    tooltip: {
        y: {
            formatter: val => val + '%'
        }
    }
}).render();