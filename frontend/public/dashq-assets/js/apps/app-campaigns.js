/*------------------------------------------------------------------
[App Campaigns page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document) {
    'use strict';

    const DashQ = window.DashQ || {};
    DashQ.Analytics = DashQ.Analytics || {};

    DashQ.Analytics.initDemographics = function () {
        this.initAgeGenderChart();
        this.initInterestRadar();
        this.initWorldMapMarkers();
    };

    // --- Age & Gender Distribution (Stacked Bar) ---
    DashQ.Analytics.initAgeGenderChart = function () {
        const el = document.querySelector("#ageGenderChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: { 
                type: "bar", 
                height: 240, 
                stacked: true,
                toolbar: { show: false } 
            },
            series: [
                { name: "Male", data: [22, 35, 48, 41, 29] },
                { name: "Female", data: [28, 42, 55, 47, 34] }
            ],
            colors: ['var(--bs-primary)', 'var(--bs-gray-400)'],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '45%',
                }
            },
            xaxis: { 
                categories: ["18-24", "25-34", "35-44", "45-54", "55+"],
                axisBorder: { show: false }
            },
            grid: { strokeDashArray: 4 },
            legend: { position: 'top', horizontalAlign: 'right' },
            dataLabels: { enabled: false }
        }).render();
    };

    // --- Interest Radar Chart ---
    DashQ.Analytics.initInterestRadar = function () {
        const el = document.querySelector("#interestChart");
        if (!el || typeof ApexCharts === 'undefined') return;

        new ApexCharts(el, {
            chart: { 
                type: "radar", 
                height: 240,
                toolbar: { show: false } 
            },
            series: [
                { name: "Instagram", data: [65, 45, 40, 55, 60] },
                { name: "Facebook", data: [45, 60, 55, 35, 50] }
            ],
            colors: ['var(--bs-gray-500)', 'var(--bs-primary)'],
            labels: ["Fashion", "Tech", "Sports", "Travel", "Food"],
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: 'var(--bs-border-color)',
                        connectorColors: 'var(--bs-border-color)',
                    }
                }
            },
            markers: { size: 4 },
            fill: { opacity: 0.2 },
            legend: { position: 'bottom' }
        }).render();
    };

    // --- Optimized World Map with Data Binding ---
    DashQ.Analytics.initWorldMapMarkers = function () {
        const el = document.getElementById('worldMap');
        if (!el || typeof jsVectorMap === 'undefined') return;

        // Unified Marker Data
        const markerData = [
            { name: 'USA', coords: [37.0902, -95.7129], style: { initial: { fill: '#274BEA' } } },
            { name: 'India', coords: [20.5937, 78.9629], style: { initial: { fill: 'var(--bs-primary)' } } },
            { name: 'UK', coords: [55.3781, -3.4360], style: { initial: { fill: '#AC27EA' } } },
            { name: 'Canada', coords: [56.1304, -106.3468], style: { initial: { fill: '#EA27A9' } } },
            { name: 'UAE', coords: [23.4241, 53.8478], style: { initial: { fill: '#7CEA27' } } },
            { name: 'Russia', coords: [61.5240, 105.3188], style: { initial: { fill: '#EA7827' } } },
            { name: 'Japan', coords: [36.2048, 138.2529], style: { initial: { fill: '#EA2748' } } },
            { name: 'Australia', coords: [-25.2744, 133.7751], style: { initial: { fill: '#9F27EA' } } }
        ];

        new jsVectorMap({
            map: 'world',
            selector: '#worldMap',
            markersSelectable: true,
            zoomOnScroll: false, // Better UX for admin dashboards
            labels: {
                markers: { render: (m) => m.name }
            },
            markers: markerData,
            markerStyle: {
                initial: { r: 6, strokeWidth: 0.5, stroke: '#fff', fillOpacity: 1 },
                hover: { stroke: "#fff", strokeWidth: 2, fillOpacity: 0.8 }
            },
            markerLabelStyle: {
                initial: { fontFamily: 'Inter', fontSize: 12, fontWeight: 500, fill: 'var(--bs-gray-600)' }
            }
        });
    };

    // Initialize all demographic components
    document.addEventListener('DOMContentLoaded', () => {
        DashQ.Analytics.initDemographics();
    });

    window.DashQ = DashQ;

})(window, document);