/*------------------------------------------------------------------
[Podcast Dashboard page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
// ====================== Quill Editor ======================
const editorEl = document.querySelector('#Podcast_Description');
if (editorEl && typeof Quill !== 'undefined') {
    new Quill(editorEl, { theme: 'snow' });
}


// ====================== Sparkline Charts ======================
function createSpark(id){
    const el = document.querySelector(id);
    if (!el) return;

    new ApexCharts(el, {
        chart: { 
            type: 'line',
            height: 60,
            sparkline: { enabled: true },
            toolbar: { show: false }
        },
        series: [{
            data: [10,15,14,18,17,22,19,24,28,25,30]
        }],
        stroke: {
            curve: 'smooth',
            width: 2
        },
        markers: {
            size: 4,
            hover: { size: 6 }
        },
        colors: ['var(--bs-primary)'],
        fill: { opacity: 0 },
        grid: { show: false },
        tooltip: { enabled: false }
    }).render();
}

["#spark1","#spark2","#spark3","#spark4"].forEach(createSpark);


// ====================== Followers Data ======================
const followersData = {
    week: {
        series: [200, 400, 1500, 800, 2200, 600, 500],
        categories: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
        summary: "+4.8k This Week"
    },
    month: {
        series: [4000, 5200, 6100, 7200],
        categories: ['Week 1','Week 2','Week 3','Week 4'],
        summary: "+18.4k This Month"
    },
    year: {
        series: [12000,18000,22000,28000,35000,42000,51000,61000,72000,85000,93000,110000],
        categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        summary: "+110k This Year"
    }
};


// ====================== Followers Chart ======================
const followersEl = document.querySelector("#followersChart");
let followersChart;

if (followersEl) {
    followersChart = new ApexCharts(followersEl, {
        chart: { type: 'bar', height: 240, toolbar: { show:false }},
        series: [{ name: "Followers", data: followersData.week.series }],
        xaxis: { categories: followersData.week.categories },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '65%'
            }
        },
        colors: ['var(--bs-primary)'],
        fill: {
            type: 'gradient',
            gradient: {
                type: 'vertical',
                shade: 'light',
                gradientToColors: ['var(--bs-primary)'],
                stops: [0, 100]
            }
        }
    });

    followersChart.render();
}


// ====================== Followers Tabs ======================
document.querySelectorAll("#followersTabs .nav-link").forEach(btn => {
    btn.addEventListener("click", function(){

        const type = this.dataset.type;

        // Active UI
        document.querySelectorAll("#followersTabs .nav-link")
            .forEach(el => el.classList.remove("active"));
        this.classList.add("active");

        if (!followersChart || !followersData[type]) return;

        // Update chart
        followersChart.updateOptions({
            xaxis: { categories: followersData[type].categories }
        });

        followersChart.updateSeries([{
            name: "Followers",
            data: followersData[type].series
        }]);

        // Update summary
        const summary = document.getElementById("followersSummary");
        if (summary) {
            summary.innerText = followersData[type].summary;
        }
    });
});


// ====================== Time Listened Chart ======================
const timeChartEl = document.querySelector("#timeChart");
if (timeChartEl) {
    new ApexCharts(timeChartEl, {
        chart: { type: 'donut' },
        series: [25, 65, 10],
        labels: ['Following','Followers','First-time'],
        colors: ['var(--bs-primary)','var(--bs-gray-600)','var(--bs-gray-400)'],
        legend: { position: 'bottom' }
    }).render();
}

(function($) {
    'use strict';
    /* map with markers */
    var markers = [
        {
            name: 'USA',
            coords: [37.0902, -95.7129],
            style: { initial: { fill: '#274BEA' } }
        },{
            name: 'India',
            coords: [20.5937, 78.9629],
            style: { initial: { fill: 'var(--bs-primary)' } }
        },{
            name: 'United Kingdom',
            coords: [55.3781, -3.4360],
            style: { initial: { fill: '#AC27EA' } }
        },{
            name: 'Canada',
            coords: [56.1304, -106.3468],
            style: { initial: { fill: '#EA27A9' } }
        },{
            name: 'UAE',
            coords: [23.4241, 53.8478],
            style: { initial: { fill: '#7CEA27' } }
        },{
            name: 'Russia',
            coords: [61, 105],
            style: {initial: {fill: '#EA7827'}}
        },{
            name: 'Japan',
            coords: [36.2048, 138.2529],
            style: { initial: { fill: '#EA2748' } }
        },{
            name: 'Australia',
            coords: [-25.2744, 133.7751],
            style: { initial: { fill: '#9F27EA' } }
        }
    ];

    var test = new jsVectorMap({
        map: 'world',
        selector: '#Top_Countries_Map',
        markersSelectable: true,
        onMarkerSelected(index, isSelected, selectedMarkers) {
            console.log(index, isSelected, selectedMarkers);
        },

        // -------- Labels --------
        labels: {
            markers: {
                render: function (marker) {
                    return marker.name
                },
            },
        },

        // -------- Marker and label style --------
        markers: markers,
        markerStyle: {
            hover: {
                stroke: "#DDD",
                strokeWidth: 3,
                fill: '#FFF'
            },
            selected: {
                fill: 'var(--bs-primary)'
            }
        },
        markerLabelStyle: {
            initial: {
                fontFamily: 'Poppins',
                fontSize: 13,
                fontWeight: 500,
                fill: 'var(--bs-gray-600)',
            },
        },
    })

    /* maps */
    var markers = [
        { name: 'USA', coords: [37.0902, -95.7129] },
        { name: 'India', coords: [20.5937, 78.9629] },
        { name: 'UK', coords: [55.3781, -3.4360], offsets: [5, 5] },
        { name: 'Canada', coords: [56.1304, -106.3468], offsets: [-5, 10] },
        { name: 'UAE', coords: [23.4241, 53.8478] },
        { name: 'Russia', coords: [61.5240, 105.3188] },
        { name: 'Japan', coords: [36.2048, 138.2529] },
        { name: 'Australia', coords: [-25.2744, 133.7751] }
    ];
}(jQuery) )