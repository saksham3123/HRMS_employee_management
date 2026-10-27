/*------------------------------------------------------------------
[Podcast Episode Analytics page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
new Quill('#Podcast_Description', {
    theme: 'snow'
});

// Plays Over Time
new ApexCharts(document.querySelector("#playsChart"), {
    chart:{ type:'area', height:350, toolbar:{show:false}},
    series:[{ name:"Plays", data:[1200,1500,1800,2200,2500,2100,2800]}],
    xaxis:{ categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},
    stroke:{ curve:'smooth', width:3},
    fill:{ opacity:0.2}
}).render();

// Retention Curve
new ApexCharts(document.querySelector("#retentionChart"), {
    chart:{ type:'line', height:280, toolbar:{show:false}},
    series:[{ name:"Retention %", data:[100,95,90,80,70,60,50,40,30]}],
    xaxis:{ categories:['0m','5m','10m','15m','20m','25m','30m','35m','40m']},
    stroke:{ curve:'smooth', width:3},
    colors: ['var(--bs-primary)'],
}).render();

// Drop-off Chart
new ApexCharts(document.querySelector("#dropoffChart"), {
    chart:{ type:'bar', height:280, toolbar:{show:false}},
    series:[{ name:"Drop-off %", data:[5,8,12,15,18,22,30]}],
    xaxis:{ categories:['5m','10m','15m','20m','25m','30m','35m']},
    plotOptions:{ bar:{ borderRadius:6 }},
    colors: ['var(--bs-primary)'],
}).render();

// Traffic Sources
new ApexCharts(document.querySelector("#trafficChart"), {
    chart:{ type:'donut', height:260 },
    series:[45,25,15,10,5],
    labels:['Spotify','Apple Podcasts','YouTube','Direct','Other'],
    legend:{ position:'bottom'},
    colors: ['var(--bs-primary)','var(--bs-gray-800)','var(--bs-gray-700)','var(--bs-gray-600)','var(--bs-gray-500)'],
}).render();