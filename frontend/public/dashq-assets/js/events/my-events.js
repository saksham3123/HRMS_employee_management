/*------------------------------------------------------------------
[My Events page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Events = {
        init: function () {
            this.initTicketSales();
            this.initAttendance();
            this.initEventTable();
        },

        // --- Ticket Sales: Stacked Column Chart ---
        initTicketSales: function () {
            const el = document.querySelector("#ticketSalesChart");
            if (!el || typeof ApexCharts === 'undefined') return;

            new ApexCharts(el, {
                chart: {
                    type: 'bar',
                    height: 260,
                    stacked: true,
                    toolbar: { show: false }
                },
                series: [
                    { name: 'Gold', data: [80, 120, 180, 260, 340, 420, 600] },
                    { name: 'Silver', data: [60, 90, 140, 200, 280, 350, 480] },
                    { name: 'Bronze', data: [40, 70, 100, 160, 220, 300, 390] }
                ],
                xaxis: {
                    categories: ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'],
                    axisBorder: { show: false }
                },
                colors: ['#fbbf24', '#9ca3af', '#b45309'], // Gold, Silver, Bronze
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: '45%',
                        borderRadius: 4
                    }
                },
                dataLabels: { enabled: false },
                legend: { position: 'top', horizontalAlign: 'left' },
                grid: { strokeDashArray: 4 }
            }).render();
        },

        // --- Attendance Distribution (Donut) ---
        initAttendance: function () {
            const el = document.querySelector("#attendanceChart");
            if (!el) return;

            new ApexCharts(el, {
                chart: { type: 'donut', height: 280 },
                series: [65, 25, 10],
                labels: ['In-Person', 'Online', 'VIP'],
                colors: ['var(--bs-gray-400)', 'var(--bs-gray-600)', 'var(--bs-primary)'],
                plotOptions: {
                    pie: {
                        donut: {
                            size: '70%',
                            labels: {
                                show: true,
                                total: { show: true, label: 'Total', formatter: () => '100%' }
                            }
                        }
                    }
                },
                legend: { position: 'bottom' },
                dataLabels: { enabled: false }
            }).render();
        },

        // --- Event Participant Table ---
        initEventTable: function () {
            const $table = $('.dataTable');
            if (!$table.length || !$.fn.DataTable) return;

            // Check if already initialized to prevent errors
            if (!$.fn.DataTable.isDataTable('.dataTable')) {
                $table.addClass('nowrap').DataTable({
                    responsive: true,
                    paging: false,        // Enable pagination
                    searching: false,     // Enable search box
                    lengthChange: false,  // Show entries dropdown
                    pageLength: false,      // Default rows per page
                    info: false,
                });
            }
        }
    };

    // Auto-init
    $(document).ready(() => {
        DashQ.Events.init();
    });

    window.DashQ = DashQ;

})(window, document, jQuery);
