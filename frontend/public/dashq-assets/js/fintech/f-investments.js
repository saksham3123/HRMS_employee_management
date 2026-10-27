/*------------------------------------------------------------------
[Fintech Investments page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Portfolio = {
        init: function () {
            this.initAllocationDonut();
            this.initInvestmentTable();
            this.initCombinedAssetChart();
            this.initDetailSync();
        },

        // --- Asset Allocation (Donut) ---
        initAllocationDonut: function () {
            const el = document.querySelector("#assetAllocationChart");
            if (!el || typeof ApexCharts === 'undefined') return;

            new ApexCharts(el, {
                chart: { type: 'donut', height: 240 },
                labels: ['Stocks', 'Crypto', 'Bonds', 'Cash'],
                series: [45, 25, 20, 10],
                colors: ['var(--bs-primary)', 'var(--bs-gray-700)', 'var(--bs-gray-600)', 'var(--bs-gray-500)'],
                stroke: { width: 2, colors: ['var(--bs-body-bg)'] },
                plotOptions: { pie: { donut: { size: '60%' } } },
                legend: { position: 'bottom' },
                dataLabels: { enabled: false }
            }).render();
        },

        // --- Combined Assets (Grouped Bar) ---
        initCombinedAssetChart: function () {
            const el = document.querySelector('#combinedAssetChart');
            if (!el) return;

            new ApexCharts(el, {
                chart: { type: 'bar', height: 240, toolbar: { show: false } },
                series: [
                    { name: 'Stocks', data: [520000, 545000, 560000, 610000, 650000, 690000] },
                    { name: 'Mutual Funds', data: [260000, 275000, 285000, 295000, 305000, 310000] },
                    { name: 'Crypto', data: [220000, 210000, 230000, 200000, 215000, 240000] }
                ],
                xaxis: { 
                    categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    axisBorder: { show: false }
                },
                colors: ['var(--bs-primary)', 'var(--bs-gray-500)', 'var(--bs-gray-400)'],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                dataLabels: { enabled: false },
                grid: { strokeDashArray: 4, borderColor: 'var(--bs-border-color)' },
                legend: { position: 'bottom' }
            }).render();
        },

        // --- DataTables & Detail Synchronization ---
        initInvestmentTable: function () {
            const $table = $('.dataTable');
            if ($table.length && $.fn.DataTable) {
                $table.DataTable({
                    responsive: true,
                    paging: false,
                    searching: false,
                    lengthChange: false,
                    info: false,
                    dom: 'tp' // Only show table and pagination
                });
            }
        },

        initDetailSync: function () {
            // Event delegation for table rows
            document.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-asset]');
                if (!row) return;

                // Update detail labels
                const fields = ['asset', 'type', 'value', 'change'];
                fields.forEach(field => {
                    const targetEl = document.getElementById(`od${field.charAt(0).toUpperCase() + field.slice(1)}`);
                    if (targetEl) targetEl.textContent = row.dataset[field];
                });

                // Visual feedback
                row.parentElement.querySelectorAll('tr').forEach(r => r.classList.remove('table-active'));
                row.classList.add('table-active');
            });
        }
    };

    // Auto-init
    $(document).ready(() => DashQ.Portfolio.init());
    window.DashQ = DashQ;

})(window, document, jQuery);