/*------------------------------------------------------------------
[Fintech Loans page Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
// EMI Amortization Chart (Principal vs Interest)
new ApexCharts(document.querySelector('#emiChart'), {
    chart: { type: 'area', height: 240, toolbar: { show: false } },
    series: [
        { name: 'Principal', data: [8000, 8200, 8400, 8600, 8800, 9000] },
        { name: 'Interest', data: [7200, 7000, 6800, 6600, 6400, 6200] }
    ],
    xaxis: { categories: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    colors: ['#0d6efd', '#dc3545'],
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    legend: { position: 'top' }
}).render();

// Your Investments
$(document).ready( function () {
    $('.dataTable')
    .addClass( 'nowrap' )
    .dataTable( {
        responsive: true,
        paging: false,        // Enable pagination
        searching: false,     // Enable search box
        lengthChange: false,  // Show entries dropdown
        pageLength: false,      // Default rows per page
        info: false,
        initComplete: function () {
          $('div.dataTables_filter input', this.api().table().container()).attr('id', 'filterInput');
        }
    });
});