// 1. Patient Analytics Chart (Area Graphic)
        var optionsPatients = {
            chart: { type: 'bar', height: 260, toolbar: { show: false },},
            colors: ['var(--bs-primary)', 'var(--bs-gray-500)'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            series: [
                { name: 'Inpatients', data: [40, 65, 50, 85, 70, 95, 110] },
                { name: 'Outpatients', data: [20, 40, 35, 60, 45, 80, 95] }
            ],
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
        };
        new ApexCharts(document.querySelector("#patientAnalyticsChart"), optionsPatients).render();

        // 2. Revenue Stream Chart (Column Line Mix)
        var optionsRevenue = {
            chart: { type: 'bar', height: 260, toolbar: { show: false },},
            colors: ['var(--bs-primary)'],
            plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
            dataLabels: { enabled: false },
            series: [{ name: 'Net Revenue ($)', data: [2300, 4100, 3600, 5200, 4800, 6900, 5100] }],
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
        };
        new ApexCharts(document.querySelector("#revenueChart"), optionsRevenue).render();

        // 3. Department Performance Chart (Donut Layout)
        var optionsDept = {
            chart: { type: 'donut', height: 260,},
            colors: ['var(--bs-primary)', 'var(--bs-gray-700)', 'var(--bs-gray-600)', 'var(--bs-gray-500)'],
            series: [45, 25, 20, 10],
            labels: ['Cardiology', 'Emergency', 'Pediatrics', 'Neurology'],
            legend: { position: 'bottom' }
        };
        new ApexCharts(document.querySelector("#departmentChart"), optionsDept).render();