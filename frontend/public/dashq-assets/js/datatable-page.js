/*------------------------------------------------------------------
[DataTable Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
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