/*------------------------------------------------------------------
[App My Todo List page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};
    DashQ.Analytics = DashQ.Analytics || {};

    DashQ.Analytics.initUserActivity = function () {
        const el = document.querySelector("#activityChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        // Generate 60 points of random data (representative of 60 days/hours)
        const generateActivityData = (count) => {
            return Array.from({ length: count }, () => Math.floor(Math.random() * 5));
        };

        const options = {
            series: [{
                name: 'Activity Level',
                data: generateActivityData(60)
            }],
            chart: {
                height: 90,
                type: 'heatmap',
                toolbar: { show: false },
                sparkline: { enabled: true } // Better for small widgets
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.4,
                    radius: 2, // Slight radius looks more modern than 0
                    useFillColorAsStroke: false,
                    colorScale: {
                        ranges: [
                            { from: 0, to: 1, color: '#e2dbef', name: 'Low' },
                            { from: 2, to: 3, color: '#a29cae', name: 'Medium' },
                            { from: 4, to: 5, color: '#676172', name: 'High' }
                        ]
                    }
                }
            },
            dataLabels: { enabled: false },
            stroke: { width: 2, colors: ['var(--bs-body-bg)'] }, // Adds a gap between cells
            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { show: false } },
            grid: { show: false, padding: { top: 0, bottom: 0, left: 0, right: 0 } },
            tooltip: {
                enabled: true,
                x: { show: false },
                y: {
                    formatter: (val) => `${val} tasks completed`
                }
            }
        };

        new ApexCharts(el, options).render();
    };

    // Auto-init within the Analytics module
    document.addEventListener('DOMContentLoaded', () => {
        DashQ.Analytics.initUserActivity();
    });

    window.DashQ = DashQ;

})(window, document);