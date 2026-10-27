/*------------------------------------------------------------------
[CRM Leads page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Leads = {
        init: function () {
            this.initTables();
            this.initMiniCharts();
        },

        // --- DataTables: Clean & Responsive ---
        initTables: function () {
            const $table = $('.dataTable');
            if (!$table.length || !$.fn.DataTable) return;

            $table.addClass('nowrap').DataTable({
                responsive: true,
                paging: true,         // Changed to true for better UI
                searching: false,
                lengthChange: false,
                info: false,
                pageLength: 5,        // Set a numeric value instead of false
                language: {
                    paginate: {
                        next: '<i class="bi bi-chevron-right"></i>',
                        previous: '<i class="bi bi-chevron-left"></i>'
                    }
                },
                initComplete: function () {
                    const container = this.api().table().container();
                    $('div.dataTables_filter input', container).attr('id', 'filterInput');
                }
            });
        },

        // --- Lead Sparklines: Reusable Logic ---
        initMiniCharts: function () {
            if (typeof ApexCharts === 'undefined') return;

            const renderLeadChart = (selector, strokeColor, data) => {
                const el = document.querySelector(selector);
                if (!el) return;

                new ApexCharts(el, {
                    chart: {
                        height: 50,
                        type: 'area',
                        sparkline: { enabled: true },
                        animations: { enabled: true }
                    },
                    series: [{ data: data }],
                    stroke: {
                        width: 2, // 1px can be too thin on high-res screens
                        curve: 'smooth',
                        colors: [strokeColor]
                    },
                    fill: {
                        type: 'solid',
                        colors: ['#DDE3EB'],
                        opacity: 0.3
                    },
                    colors: [strokeColor],
                    markers: { size: 0 },
                    tooltip: { enabled: false }
                }).render();
            };

            // Initialize all sparklines
            renderLeadChart("#websiteLeadsChart", "var(--bs-success)", [20, 25, 22, 30, 28, 35, 40]);
            renderLeadChart("#emailLeadsChart", "var(--bs-primary)", [18, 20, 19, 24, 23, 26, 28]);
            renderLeadChart("#socialLeadsChart", "var(--bs-warning)", [12, 14, 13, 16, 15, 18, 17]);
            renderLeadChart("#referralLeadsChart", "var(--bs-danger)", [10, 9, 11, 10, 8, 7, 9]);
        }
    };

    // Auto-init on DOM Load
    $(document).ready(() => {
        DashQ.Leads.init();
    });

    window.DashQ = DashQ;

})(window, document, jQuery);