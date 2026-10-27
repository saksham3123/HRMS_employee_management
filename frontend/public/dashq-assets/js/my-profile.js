/*------------------------------------------------------------------
[My Profile page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Tables = {
        init: function () {
            this.initRowSelection();
        },

        initRowSelection: function () {
            // 1. Individual Row Check (Event Delegation)
            document.addEventListener('change', (e) => {
                const chk = e.target.closest('.row-check');
                if (chk) {
                    this.toggleRowState(chk);
                }
            });

            // 2. "Check All" Functionality
            document.addEventListener('change', (e) => {
                const chk = e.target.closest('.row-check');
                if (chk) {
                    this.toggleRowState(chk);
                    return;
                }

                const checkAll = e.target.closest('#checkAll');
                if (checkAll) {
                    const isChecked = checkAll.checked;
                    const table = checkAll.closest('table');
                    if (!table) return;

                    table.querySelectorAll('.row-check').forEach(chk => {
                        chk.checked = isChecked;
                        this.toggleRowState(chk);
                    });
                }
            });
        },

        // Helper to keep code DRY (Don't Repeat Yourself)
        toggleRowState: function (checkbox) {
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.toggle('active-row', checkbox.checked);
            }
        }
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        DashQ.Tables.init();
    });

    window.DashQ = DashQ;

})(window, document);