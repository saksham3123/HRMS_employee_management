/*------------------------------------------------------------------
[Event Tickets page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
var options = {
    chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false }
    },
    series: [{
        name: 'Revenue',
        data: [120000, 180000, 260000, 340000, 420000, 520000]
    }],
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    stroke: {
        curve: 'smooth',
        width: 3
    },
    dataLabels: {
        enabled: false
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
        }
    },
    colors: ['#4f46e5'],
    grid: {
        strokeDashArray: 4
    },
    tooltip: {
        y: {
            formatter: function (val) {
                return "₹" + val.toLocaleString();
            }
        }
    }
};

var chart = new ApexCharts(document.querySelector("#revenueChart"), options);
chart.render();