/*------------------------------------------------------------------
[Index page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    // Extend the existing DashQ object or create it
    const DashQ = window.DashQ || {};

    DashQ.Charts = {

        init: function () {
            this.initSortable();
            this.initLeadAnalytics();
            this.initDriveChart();
            this.initCreditScore();
            this.initRevenueChart();
        },

        // --- Draggable App Menu ---
        initSortable: function () {
            const appMenu = document.getElementById('appMenu');
            if (typeof Sortable !== 'undefined' && appMenu) {
                new Sortable(appMenu, {
                    animation: 150,
                    ghostClass: 'blue-background-class'
                });
            }
        },

        // --- Lead Analytics (Area Chart) ---
        initLeadAnalytics: function () {
            const el = document.querySelector("#leadAreaChart");
            if (!el || typeof ApexCharts === 'undefined') return;

            const options = {
                chart: {
                    height: 120,
                    type: 'area',
                    sparkline: { enabled: true }
                },
                series: [{ data: [26, 31, 28, 30, 28, 35, 40] }],
                stroke: {
                    width: 2,
                    curve: 'smooth',
                    colors: ['var(--bs-primary)']
                },
                fill: {
                    type: 'solid',
                    colors: ['#88A4B9'],
                    opacity: 0.1
                },
                colors: ['var(--bs-primary)'],
                markers: { size: 0 },
                tooltip: { enabled: true }
            };

            new ApexCharts(el, options).render();
        },

        // --- Drive Storage (Stacked Bar) ---
        initDriveChart: function () {
            const el = document.querySelector("#WelcometoDrive");
            if (!el || typeof ApexCharts === 'undefined') return;

            const options = {
                chart: {
                    type: "bar",
                    height: 120,
                    stacked: true,
                    stackType: "100%",
                    toolbar: { show: false }
                },
                colors: [
                    'rgba(var(--bs-primary-rgb),.7)',
                    'rgba(var(--bs-success-rgb),.7)',
                    'rgba(var(--bs-info-rgb),.7)',
                    'rgba(var(--bs-warning-rgb),.7)',
                    'rgba(var(--bs-danger-rgb),.7)'
                ],
                series: [
                    { name: "File", data: [25] },
                    { name: "Images", data: [35] },
                    { name: "Apps", data: [10] },
                    { name: "Video", data: [10] },
                    { name: "Js", data: [20] }
                ],
                plotOptions: { bar: { horizontal: true } },
                dataLabels: {
                    dropShadow: { enabled: true },
                    formatter: (val) => val ? val.toFixed(1) + '%' : ''
                },
                stroke: { width: 0 },
                grid: {
                    show: false,
                    padding: { top: 0, bottom: -30, right: 0, left: 0 }
                },
                xaxis: {
                    categories: [""],
                    labels: { show: false },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                legend: { position: "bottom", horizontalAlign: "right" }
            };

            new ApexCharts(el, options).render();
        },

        // --- Credit Score (Radial Bar) ---
        initCreditScore: function () {
            const el = document.querySelector("#creditScoreChart");
            if (!el || typeof ApexCharts === 'undefined') return;

            const creditData = {
                score: 735,
                min: 300,
                max: 900,
                remark: "Great score! You are eligible for premium credit offers."
            };

            const scorePercent = ((creditData.score - creditData.min) / (creditData.max - creditData.min)) * 100;
            
            // UI Updates
            const valEl = document.getElementById("scoreValue");
            const remEl = document.getElementById("scoreRemark");
            if (valEl) valEl.innerText = creditData.score;
            if (remEl) remEl.innerText = creditData.remark;

            new ApexCharts(el, {
                chart: { type: 'radialBar', height: 260, sparkline: { enabled: true } },
                series: [scorePercent],
                colors: ['var(--bs-primary)'],
                plotOptions: {
                    radialBar: {
                        startAngle: -90,
                        endAngle: 90,
                        hollow: { margin: 0, size: '65%' },
                        track: { background: 'var(--bs-gray-200)', strokeWidth: '100%' },
                        dataLabels: { show: false }
                    }
                },
                stroke: { lineCap: 'round' }
            }).render();
        },

        // --- Revenue Chart & Tab Switch ---
        initRevenueChart: function () {
            const el = document.querySelector("#revenueChart");
            if (!el || typeof ApexCharts === 'undefined') return;

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

            const options = {
                chart: { type: 'bar', height: 200, toolbar: { show: false } },
                series: [{ name: 'Revenue', data: revenueData.week.data }],
                colors: ['var(--bs-primary-dark)'],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
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
                    labels: { style: { fontSize: '12px' } }
                },
                yaxis: { labels: { formatter: val => `$${val / 1000}K` } },
                grid: { strokeDashArray: 5 },
                dataLabels: { enabled: false }
            };

            const chart = new ApexCharts(el, options);
            chart.render();

            // Tab Switch logic via Event Delegation
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-revenue-tab]');
                if (btn) {
                    const type = btn.dataset.revenueTab; // e.g., "month"
                    
                    // Update active class
                    btn.closest('.btn-group').querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Update UI text
                    document.getElementById('revenueValue').innerText = revenueData[type].total;
                    document.getElementById('revenueGrowth').innerText = revenueData[type].growth;

                    // Update Chart
                    chart.updateOptions({ xaxis: { categories: revenueData[type].categories } });
                    chart.updateSeries([{ data: revenueData[type].data }]);
                }
            });
        }
    };

    // Initialize charts on load
    document.addEventListener('DOMContentLoaded', () => DashQ.Charts.init());
    
    // Save to window
    window.DashQ = DashQ;

})(window, document);