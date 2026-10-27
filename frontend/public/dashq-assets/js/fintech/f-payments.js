/*------------------------------------------------------------------
[Fintech Payments page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.QuickActions = {
        init: function () {
            this.initSparks();
            this.initTabbedTables();
        },

        // --- Micro Sparkline Charts ---
        initSparks: function () {
            if (typeof ApexCharts === 'undefined') return;

            const renderSpark = (selector, data, color) => {
                const el = document.querySelector(selector);
                if (!el) return;

                new ApexCharts(el, {
                    chart: { 
                        type: 'bar', 
                        height: 40, 
                        sparkline: { enabled: true },
                        animations: { enabled: true }
                    },
                    series: [{ data: data }],
                    stroke: { width: 2, curve: 'smooth' },
                    colors: [color],
                    plotOptions: {
                        bar: {
                            borderRadius: 2,
                            columnWidth: '60%'
                        }
                    },
                    tooltip: { 
                        enabled: true,
                        fixed: { enabled: false },
                        x: { show: false },
                        y: { title: { formatter: () => '' } },
                        marker: { show: false }
                    }
                }).render();
            };

            renderSpark('#sparkSend', [8,12,10,14,18,16,14,18,16,20], 'var(--bs-primary)');
            renderSpark('#sparkReceive', [12,15,14,14,18,16,18,22,25,28], 'var(--bs-success)');
            renderSpark('#sparkBank', [5,7,14,18,16,6,9,8,11,10], 'var(--bs-warning)');
            renderSpark('#sparkIntl', [2,3,4,3,5,14,18,16,6,5], 'var(--bs-info)');
        },

        // --- Tab-Aware DataTables ---
        initTabbedTables: function () {
            if (!$.fn.DataTable) return;

            // Global Initialization
            const tables = $('.dataTable').addClass('nowrap').DataTable({
                responsive: true,
                searching: false,
                info: false,
                ordering: true,
                paging: false,
                dom: 't', // Only show the table itself
                language: {
                    emptyTable: "No transactions found"
                }
            });

            // Fix for DataTables inside Bootstrap Pills/Tabs
            // This forces the table to recalculate its width when it becomes visible
            $('button[data-bs-toggle="pill"], a[data-bs-toggle="tab"]').on('shown.bs.tab', function() {
                $($.fn.dataTable.tables(true)).DataTable()
                    .columns.adjust()
                    .responsive.recalc();
            });
        }
    };

    // Auto-init
    $(document).ready(() => DashQ.QuickActions.init());
    window.DashQ = DashQ;

})(window, document, jQuery);