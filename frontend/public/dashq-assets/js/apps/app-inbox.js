/*------------------------------------------------------------------
[App Inbox page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Inbox = {
        init: function () {
            this.pane = document.querySelector(".mail-detail-pane");
            this.body = document.querySelector(".inbox-body");
            
            this.initMailActions();
            this.initLayoutSync();
        },

        initMailActions: function () {
            // 1. Open Mail (Event Delegation)
            document.addEventListener('click', (e) => {
                const mailItem = e.target.closest('.mail-item');
                if (mailItem && this.pane) {
                    // Remove active class from others and add to current
                    document.querySelectorAll('.mail-item').forEach(el => el.classList.remove('active'));
                    mailItem.classList.add('active');
                    
                    this.pane.classList.add("open");
                }
            });

            // 2. Close Mail Detail
            document.addEventListener('click', (e) => {
                if (e.target.closest('.mail-detail-close')) {
                    if (this.pane) this.pane.classList.remove("open");
                    document.querySelectorAll('.mail-item').forEach(el => el.classList.remove('active'));
                }
            });
        },

        // --- Dynamic Height Calculation ---
        initLayoutSync: function () {
            if (!this.body) return;

            const updateHeight = () => {
                const header = document.querySelector("header")?.offsetHeight || 0;
                const footer = document.querySelector("footer")?.offsetHeight || 0;
                
                // Standard: Using style.setProperty for cleaner CSS integration
                const availableHeight = window.innerHeight - (header + footer);
                this.body.style.height = `${availableHeight}px`;
            };

            // Initial call and event listeners
            updateHeight();
            
            // Debounced resize for performance
            let resizeTimer;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(updateHeight, 100);
            });
        }
    };

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        DashQ.Inbox.init();
    });

    window.DashQ = DashQ;

})(window, document);