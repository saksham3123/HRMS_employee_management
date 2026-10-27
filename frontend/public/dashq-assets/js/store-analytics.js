/*------------------------------------------------------------------
[Store Analytics page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Analytics = {

        init: function () {
            this.initKPICharts();
            this.initSalesAnalysis();
            this.initVisitorHeatmap();
            this.initWorldMap();
        },

        // --- Top KPI Small Charts ---
        initKPICharts: function () {
            if (typeof ApexCharts === 'undefined') return;

            const miniBarConfig = (selector, color, data) => {
                const el = document.querySelector(selector);
                if (!el) return;
                new ApexCharts(el, {
                    chart: { type: 'bar', height: 60, sparkline: { enabled: true } },
                    series: [{ data }],
                    colors: [color],
                    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
                    tooltip: { enabled: true }
                }).render();
            };

            miniBarConfig("#kpiRevenue", "var(--bs-primary)", [20, 30, 25, 40, 35, 50, 45]);
            miniBarConfig("#kpiOrders", "var(--bs-success)", [10, 15, 12, 18, 20, 22, 25]);
            miniBarConfig("#kpiVisitors", "var(--bs-warning)", [30, 35, 40, 38, 45, 50, 55]);
            miniBarConfig("#kpiConversion", "var(--bs-danger)", [2, 3, 2.5, 3.5, 3.8, 4, 4.2]);
        },

        // --- Sales Analysis (Area Chart with Tab Switching) ---
        initSalesAnalysis: function () {
            const el = document.querySelector("#salesChart");
            if (!el || typeof ApexCharts === 'undefined') return;

            const salesData = {
                week: {
                    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    data: [12000, 18000, 15000, 22000, 26000, 30000, 28000]
                },
                month: {
                    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    data: [85000, 92000, 110000, 125000]
                },
                year: {
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    data: [420000, 480000, 520000, 610000, 680000, 720000, 760000, 820000, 880000, 940000, 1020000, 1100000]
                }
            };

            const options = {
                chart: {
                    type: 'area',
                    height: 260,
                    toolbar: { show: false },
                    animations: { easing: 'easeinout', speed: 600 }
                },
                series: [{ name: 'Sales', data: salesData.week.data }],
                xaxis: { categories: salesData.week.categories },
                stroke: { curve: 'smooth', width: 3 },
                dataLabels: { enabled: false },
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
                tooltip: { y: { formatter: val => '₹' + val.toLocaleString() } },
                grid: { strokeDashArray: 4 }
            };

            const chart = new ApexCharts(el, options);
            chart.render();

            // Professional Tab Switch (Event Delegation)
            document.addEventListener('click', (e) => {
                const tab = e.target.closest('[data-sales-range]');
                if (tab) {
                    const range = tab.dataset.salesRange;
                    // Active State Sync
                    tab.closest('.nav').querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    // Update Chart
                    chart.updateOptions({ xaxis: { categories: salesData[range].categories } });
                    chart.updateSeries([{ data: salesData[range].data }]);
                }
            });
        },

        // --- Visitor Heatmap ---
        initVisitorHeatmap: function () {
            const el = document.querySelector("#visitorHeatmap");
            if (!el || typeof ApexCharts === 'undefined') return;

            const options = {
                chart: { type: 'heatmap', height: 260, toolbar: { show: false } },
                dataLabels: { enabled: false },
                plotOptions: {
                    heatmap: {
                        radius: 6,
                        shadeIntensity: 0.5,
                        colorScale: {
                            ranges: [
                                { from: 0, to: 100, color: '#cccccc', name: 'Low' },
                                { from: 101, to: 250, color: '#999999', name: 'Medium' },
                                { from: 251, to: 400, color: '#555555', name: 'High' },
                                { from: 401, to: 600, color: '#222222', name: 'Very High' }
                            ]
                        }
                    }
                },
                series: [
                    { name: 'Whatsapp', data: [{ x: 'Mon', y: 320 }, { x: 'Tue', y: 410 }, { x: 'Wed', y: 380 }, { x: 'Thu', y: 140 }, { x: 'Fri', y: 160 }, { x: 'Sat', y: 80 }, { x: 'Sun', y: 220 }] },
                    { name: 'Instagram', data: [{ x: 'Mon', y: 120 }, { x: 'Tue', y: 390 }, { x: 'Wed', y: 310 }, { x: 'Thu', y: 210 }, { x: 'Fri', y: 90 }, { x: 'Sat', y: 140 }, { x: 'Sun', y: 420 }] },
                    { name: 'Google', data: [{ x: 'Mon', y: 210 }, { x: 'Tue', y: 330 }, { x: 'Wed', y: 70 }, { x: 'Thu', y: 400 }, { x: 'Fri', y: 420 }, { x: 'Sat', y: 150 }, { x: 'Sun', y: 130 }] },
                    { name: 'Facebook', data: [{ x: 'Mon', y: 310 }, { x: 'Tue', y: 420 }, { x: 'Wed', y: 60 }, { x: 'Thu', y: 130 }, { x: 'Fri', y: 160 }, { x: 'Sat', y: 390 }, { x: 'Sun', y: 220 }] },
                    { name: 'LinkedIn', data: [{ x: 'Mon', y: 140 }, { x: 'Tue', y: 410 }, { x: 'Wed', y: 80 }, { x: 'Thu', y: 120 }, { x: 'Fri', y: 210 }, { x: 'Sat', y: 330 }, { x: 'Sun', y: 390 }] }
                ],
                xaxis: { labels: { style: { fontSize: '12px' } } },
                yaxis: { labels: { style: { fontSize: '12px' } } },
                tooltip: { y: { formatter: val => `${val} visitors` } }
            };

            new ApexCharts(el, options).render();
        },

        // --- Vector Map Initialization ---
        initWorldMap: function () {
            const el = document.getElementById('worldMap');
            if (!el || typeof jsVectorMap === 'undefined') return;

            new jsVectorMap({
                map: 'world',
                selector: '#worldMap',
                markersSelectable: true,
                labels: {
                    markers: { render: (marker) => marker.name }
                },
                markers: [
                    { name: 'USA', coords: [37.0902, -95.7129], style: { initial: { fill: '#274BEA' } } },
                    { name: 'India', coords: [20.5937, 78.9629], style: { initial: { fill: 'var(--bs-primary)' } } },
                    { name: 'UK', coords: [55.3781, -3.4360], style: { initial: { fill: '#AC27EA' } } },
                    { name: 'Canada', coords: [56.1304, -106.3468], style: { initial: { fill: '#EA27A9' } } },
                    { name: 'UAE', coords: [23.4241, 53.8478], style: { initial: { fill: '#7CEA27' } } },
                    { name: 'Russia', coords: [61.5240, 105.3188], style: { initial: { fill: '#EA7827' } } },
                    { name: 'Japan', coords: [36.2048, 138.2529], style: { initial: { fill: '#EA2748' } } },
                    { name: 'Australia', coords: [-25.2744, 133.7751], style: { initial: { fill: '#9F27EA' } } }
                ],
                markerStyle: {
                    hover: { stroke: "#DDD", strokeWidth: 3, fill: '#FFF' },
                    selected: { fill: 'var(--bs-primary)' }
                },
                markerLabelStyle: {
                    initial: { fontFamily: 'Inter', fontSize: 13, fontWeight: 500, fill: 'var(--bs-gray-600)' }
                }
            });
        }
    };

    // Auto-init on load
    document.addEventListener('DOMContentLoaded', () => DashQ.Analytics.init());
    window.DashQ = DashQ;

})(window, document);