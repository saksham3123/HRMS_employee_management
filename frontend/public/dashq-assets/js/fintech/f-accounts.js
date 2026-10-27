/*------------------------------------------------------------------
[Fintech Accounts page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};
    DashQ.Banking = DashQ.Banking || {};

    DashQ.Banking.init = function () {
        this.initWalletSparklines();
        this.initSuccessRate();
        this.initActivityChart();
    };

    // --- Balance, Income, & Expense Micro-Charts ---
    DashQ.Banking.initWalletSparklines = function () {
        const charts = [
            { id: "#balanceSpark", type: 'line', color: 'var(--bs-primary)', data: [18000, 19500, 19000, 20500, 21300] },
            { id: "#incomeBar", type: 'bar', color: 'var(--bs-success)', data: [300, 500, 700, 600, 820] },
            { id: "#expenseBar", type: 'bar', color: 'var(--bs-danger)', data: [200, 400, 350, 600, 430] }
        ];

        charts.forEach(cfg => {
            const el = document.querySelector(cfg.id);
            if (!el || typeof ApexCharts === 'undefined') return;

            new ApexCharts(el, {
                chart: { type: cfg.type, height: 60, sparkline: { enabled: true } },
                series: [{ data: cfg.data }],
                stroke: { curve: 'smooth', width: cfg.type === 'line' ? 2 : 0 },
                colors: [cfg.color],
                plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } }
            }).render();
        });
    };

    // --- Transaction Success Rate (Radial) ---
    DashQ.Banking.initSuccessRate = function () {
        const el = document.querySelector("#successRate");
        if (!el) return;

        new ApexCharts(el, {
            chart: { type: 'radialBar', height: 130, sparkline: { enabled: true } },
            series: [92],
            labels: ['Success'],
            colors: ['var(--bs-success)'],
            plotOptions: {
                radialBar: {
                    hollow: { size: '70%' },
                    dataLabels: {
                        name: { show: false },
                        value: { offsetY: 5, fontSize: '16px', fontWeight: 700, color: 'var(--bs-body-color)' }
                    }
                }
            }
        }).render();
    };

    // --- Main Wallet Activity (Income vs Expense) ---
    DashQ.Banking.initActivityChart = function () {
        const el = document.querySelector("#walletActivityChart");
        if (!el) return;

        const options = {
            chart: {
                type: 'area',
                height: 260,
                toolbar: { show: false },
                fontFamily: 'inherit'
            },
            series: [
                { name: 'Income', data: [4200, 4800, 5300, 6100, 6800, 7200, 7500, 8100, 8600, 9000, 9400, 10200] },
                { name: 'Expense', data: [3200, 3500, 3900, 4100, 4600, 5000, 5400, 5800, 6200, 6500, 7000, 7600] }
            ],
            colors: ['var(--bs-success)', 'var(--bs-danger)'],
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] }
            },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: {
                categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: {
                    formatter: val => `$${val.toLocaleString()}`,
                    style: { colors: 'var(--bs-gray-500)' }
                }
            },
            grid: { strokeDashArray: 4, borderColor: 'var(--bs-border-color)' },
            legend: { position: 'top', horizontalAlign: 'right' },
            dataLabels: { enabled: false }
        };

        new ApexCharts(el, options).render();
    };

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => DashQ.Banking.init());
    window.DashQ = DashQ;

})(window, document);