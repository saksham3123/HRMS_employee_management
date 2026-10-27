/*------------------------------------------------------------------
[Fintech Dashboard page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};
    DashQ.Finance = DashQ.Finance || {};

    DashQ.Finance.init = function () {
        this.initSmoothCounters();
        this.initAssetDonut();
        this.initCombinedAnalytics();
        this.initTransferFilter();
    };

    // --- High-Performance Animated Counters ---
    DashQ.Finance.initSmoothCounters = function () {
        const counters = document.querySelectorAll('.counter');
        
        const animate = (el) => {
            const target = +el.getAttribute('data-target');
            const duration = 1500; // 1.5 Seconds
            const start = +el.innerText.replace(/,/g, '') || 0;
            const startTime = performance.now();

            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // EaseOutExpo formula for premium feel
                const currentCount = Math.floor(progress === 1 ? target : target * (1 - Math.pow(2, -10 * progress)));
                
                el.innerText = currentCount.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        };

        // Trigger animation when element enters viewport (IntersectionObserver)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));
    };

    // --- Asset Allocation (Donut) ---
    DashQ.Finance.initAssetDonut = function () {
        const el = document.querySelector("#assetAllocationChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: { type: 'donut', height: 250 },
            labels: ['Stocks', 'Crypto', 'Bonds', 'Cash'],
            series: [45, 25, 20, 10],
            colors: ['var(--bs-primary)', 'var(--bs-warning)', 'var(--bs-gray-500)', 'var(--bs-gray-700)'],
            stroke: { width: 2, colors: ['var(--bs-body-bg)'] },
            plotOptions: { pie: { donut: { size: '75%' } } },
            legend: { position: 'bottom' },
            dataLabels: { enabled: false }
        }).render();
    };

    // --- User Growth & Transactions (Combined Line/Column) ---
    DashQ.Finance.initCombinedAnalytics = function () {
        const el = document.querySelector("#combinedAnalyticsChart");
        if (!el) return;

        new ApexCharts(el, {
            chart: { height: 335, type: "line", toolbar: { show: false }, zoom: { enabled: false } },
            series: [
                { name: "Transactions", type: "column", data: [8200, 9600, 11200, 13800, 16400, 18900] },
                { name: "Users", type: "line", data: [9200, 10400, 11800, 14200, 16800, 18420] }
            ],
            colors: ["var(--bs-primary)", "var(--bs-success)"],
            stroke: { width: [0, 3], curve: "smooth" },
            plotOptions: { bar: { columnWidth: "50%", borderRadius: 6 } },
            xaxis: { categories: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
            yaxis: [
                { title: { text: "Transactions" }, labels: { formatter: v => `${(v / 1000).toFixed(0)}k` } },
                { opposite: true, title: { text: "Users" }, labels: { formatter: v => `${(v / 1000).toFixed(0)}k` } }
            ],
            grid: { borderColor: 'var(--bs-border-color)', strokeDashArray: 4 },
            legend: { position: "bottom" },
            dataLabels: { enabled: false }
        }).render();
    };

    // --- Transfer Search & Filter (Event Delegation) ---
    DashQ.Finance.initTransferFilter = function () {
        const search = document.getElementById("transferSearch");
        const filter = document.getElementById("statusFilter");
        if (!search || !filter) return;

        const applyFilter = () => {
            const q = search.value.toLowerCase();
            const s = filter.value;
            const rows = document.querySelectorAll("tbody tr:not(.collapse)");

            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                const status = row.querySelector(".badge")?.innerText.trim() || "";
                const matchesSearch = text.includes(q);
                const matchesStatus = !s || status === s;

                row.style.display = matchesSearch && matchesStatus ? "" : "none";
            });
        };

        search.addEventListener("input", applyFilter);
        filter.addEventListener("change", applyFilter);
    };

    // Boot
    document.addEventListener('DOMContentLoaded', () => DashQ.Finance.init());
    window.DashQ = DashQ;

})(window, document);