/*------------------------------------------------------------------
[Support Dashboard page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    // Fetch existing Analytics object or create if it doesn't exist
    const DashQ = window.DashQ || {};
    DashQ.Analytics = DashQ.Analytics || {};

    // Extend Analytics with Support-specific charts
    DashQ.Analytics.initSupportDashboard = function () {
        this.initAgentWorkload();
        this.initSLAStatus();
        this.initSLAHeatmap();
    };

    // --- Agent Workload (Bar Chart) ---
    DashQ.Analytics.initAgentWorkload = function () {
        const el = document.querySelector("#agentChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: { 
                type: 'bar', 
                height: 182,
                toolbar: { show: false } 
            },
            colors: ['var(--bs-primary)'],
            series: [{ name: 'Tickets', data: [32, 28, 21, 18] }],
            xaxis: { 
                categories: ['Alex', 'Sarah', 'David', 'Maria'],
                axisBorder: { show: false }
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '50%'
                }
            },
            grid: { strokeDashArray: 4 }
        }).render();
    };

    // --- SLA Status (Donut Chart) ---
    DashQ.Analytics.initSLAStatus = function () {
        const el = document.querySelector("#slaChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: {
                type: 'donut',
                height: 260
            },
            series: [78, 16, 6],
            labels: ['Within SLA', 'At Risk', 'Breached'],
            colors: ['var(--bs-primary)', 'var(--bs-warning)', 'var(--bs-danger)'],
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '13px',
                markers: { width: 10, height: 10, radius: 12 },
                itemMargin: { horizontal: 12, vertical: 6 }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Compliance',
                                formatter: () => '78%'
                            }
                        }
                    }
                }
            },
            dataLabels: { enabled: false }
        }).render();
    };

    // --- SLA Heatmap (Performance Tracking) ---
    DashQ.Analytics.initSLAHeatmap = function () {
        const el = document.querySelector("#slaHeatmap");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: { 
                type: 'heatmap', 
                height: 260,
                toolbar: { show: false }
            },
            plotOptions: {
                heatmap: {
                    radius: 4,
                    enableShades: false,
                    colorScale: {
                        ranges: [
                            { from: 0, to: 50, color: 'rgba(var(--bs-danger-rgb),.7)', name: 'Critical' },
                            { from: 51, to: 80, color: 'rgba(var(--bs-warning-rgb),.4)', name: 'Warning' },
                            { from: 81, to: 100, color: 'var(--bs-primary)', name: 'Excellent' }
                        ]
                    }
                }
            },
            series: [{
                name: 'SLA %',
                data: [
                    { x: 'Rahul', y: 85 },
                    { x: 'Anita', y: 72 },
                    { x: 'John', y: 95 },
                    { x: 'Sara', y: 60 },
                    { x: 'Amit', y: 40 }
                ]
            }],
            dataLabels: { enabled: true, style: { colors: ['#fff'] } }
        }).render();
    };

    // Hook into the main initialization flow
    document.addEventListener('DOMContentLoaded', () => {
        DashQ.Analytics.initSupportDashboard();
    });

    window.DashQ = DashQ;

})(window, document);