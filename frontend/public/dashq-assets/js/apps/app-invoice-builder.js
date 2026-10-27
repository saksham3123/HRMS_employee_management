/*------------------------------------------------------------------
[App Invoice page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Invoices = {
        init: function () {
            this.initTables();
            this.initInvoiceActions();
        },

        // --- DataTables Initialization ---
        initTables: function () {
            if (!$.fn.DataTable) return;

            // Global Config for all .dataTable instances
            $('.dataTable').each(function () {
                if (!$.fn.DataTable.isDataTable(this)) {
                    $(this).addClass('nowrap').DataTable({
                        lengthChange: false,
                        searching: false,
                        paging: true,
                        ordering: false,
                        info: true,
                        responsive: true,
                        language: {
                            // Professional touch: Customizing pagination text
                            paginate: {
                                next: '<i class="bi bi-chevron-right"></i>',
                                previous: '<i class="bi bi-chevron-left"></i>'
                            }
                        },
                        initComplete: function () {
                            // Assigning ID to search input if it exists
                            const container = this.api().table().container();
                            $('div.dataTables_filter input', container).attr('id', 'filterInput');
                        }
                    });
                }
            });

            // Specific Initialization for Invoice Table (if unique settings needed)
            const invoiceTable = document.getElementById("invoiceTable");
            if (invoiceTable && !$.fn.DataTable.isDataTable(invoiceTable)) {
                $(invoiceTable).DataTable({
                    // Add any specific invoice settings here
                });
            }
        },

        // --- Invoice PDF Modal Actions ---
        initInvoiceActions: function () {
            // Using Event Delegation for AJAX compatibility
            $(document).on("click", ".viewInvoice", function (e) {
                e.preventDefault();
                
                const pdfUrl = $(this).data("pdf");
                const frame = document.getElementById("pdfFrame");
                const modalEl = document.getElementById("invoicePDF");

                if (frame && pdfUrl) {
                    frame.setAttribute("src", pdfUrl);
                }

                if (modalEl) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                }
            });

            // Clean up PDF frame on modal hide to save memory
            $('#invoicePDF').on('hidden.bs.modal', function () {
                $("#pdfFrame").attr("src", "");
            });
        }
    };

    // Auto-init on load
    $(document).ready(() => {
        DashQ.Invoices.init();
    });

    window.DashQ = DashQ;

})(window, document, jQuery);