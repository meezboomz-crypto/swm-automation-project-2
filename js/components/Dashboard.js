const { computed, onMounted, ref, watch } = Vue;

export default {
    props: ['jobs'],
    setup(props) {
        const chartCanvas = ref(null);
        let revenueChart = null;

        const stats = computed(() => {
            const totalJobs = props.jobs.length;
            const activeJobs = props.jobs.filter(j => ['Pending', 'In Progress'].includes(j.status)).length;
            const completedJobs = props.jobs.filter(j => j.status === 'Completed' || j.status === 'Delivered').length;
            const totalRevenue = props.jobs
                .filter(j => j.status !== 'Cancelled')
                .reduce((sum, j) => sum + (parseFloat(j.estimatedPrice) || 0), 0);

            return { totalJobs, activeJobs, completedJobs, totalRevenue };
        });

        const recentJobs = computed(() => {
            return props.jobs.slice(0, 5);
        });

        const initChart = () => {
            if (!chartCanvas.value) return;

            const ctx = chartCanvas.value.getContext('2d');

            // Group revenue by job type
            const revenueByType = {};
            props.jobs.forEach(job => {
                if (job.status === 'Cancelled') return;
                const type = job.jobType || 'Other';
                revenueByType[type] = (revenueByType[type] || 0) + (parseFloat(job.estimatedPrice) || 0);
            });

            const data = {
                labels: Object.keys(revenueByType),
                datasets: [{
                    label: 'รายได้แยกตามประเภทงาน (บาท)',
                    data: Object.values(revenueByType),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)', // Blue
                        'rgba(16, 185, 129, 0.8)', // Emerald
                        'rgba(245, 158, 11, 0.8)', // Amber
                        'rgba(99, 102, 241, 0.8)', // Indigo
                        'rgba(236, 72, 153, 0.8)', // Pink
                    ],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            };

            if (revenueChart) {
                revenueChart.destroy();
            }

            revenueChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#f1f5f9'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        };

        onMounted(() => {
            initChart();
        });

        watch(() => props.jobs, () => {
            initChart();
        }, { deep: true });

        const formatCurrency = (value) => {
            return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
        };

        const formatDate = (dateString) => {
            if (!dateString) return '-';
            return new Date(dateString).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'Pending': return 'bg-amber-100 text-amber-700';
                case 'In Progress': return 'bg-blue-100 text-blue-700';
                case 'Completed': return 'bg-emerald-100 text-emerald-700';
                case 'Delivered': return 'bg-slate-100 text-slate-700';
                case 'Cancelled': return 'bg-red-100 text-red-700';
                default: return 'bg-slate-100 text-slate-700';
            }
        };

        const getStatusLabel = (status) => {
            switch (status) {
                case 'Pending': return 'รอดำเนินการ';
                case 'In Progress': return 'กำลังทำ';
                case 'Completed': return 'เสร็จสิ้น';
                case 'Delivered': return 'ส่งมอบแล้ว';
                case 'Cancelled': return 'ยกเลิก';
                default: return status;
            }
        };

        return {
            stats,
            recentJobs,
            chartCanvas,
            formatCurrency,
            formatDate,
            getStatusColor,
            getStatusLabel
        };
    },
    template: `
        <div class="space-y-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <i class="ph-fill ph-briefcase text-xl"></i>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase">งานทั้งหมด</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-900">{{ stats.totalJobs }}</div>
                    <div class="text-sm text-slate-500 mt-1">งานในระบบ</div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <i class="ph-fill ph-clock-countdown text-xl"></i>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase">กำลังทำ/รอ</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-900">{{ stats.activeJobs }}</div>
                    <div class="text-sm text-slate-500 mt-1">งานที่ต้องจัดการ</div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <i class="ph-fill ph-check-circle text-xl"></i>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase">เสร็จสิ้น</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-900">{{ stats.completedJobs }}</div>
                    <div class="text-sm text-slate-500 mt-1">งานที่จบแล้ว</div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <i class="ph-fill ph-currency-dollar text-xl"></i>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase">รายได้รวม</span>
                    </div>
                    <div class="text-2xl font-bold text-slate-900">{{ formatCurrency(stats.totalRevenue) }}</div>
                    <div class="text-sm text-slate-500 mt-1">ประมาณการรายได้</div>
                </div>
            </div>

            <!-- Charts & Recent Jobs -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Chart -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="text-lg font-semibold text-slate-900 mb-6">สัดส่วนรายได้ตามประเภทงาน</h3>
                    <div class="h-64">
                        <canvas ref="chartCanvas"></canvas>
                    </div>
                </div>

                <!-- Recent Jobs List -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="text-lg font-semibold text-slate-900 mb-4">งานล่าสุด</h3>
                    <div class="space-y-4">
                        <div v-if="recentJobs.length === 0" class="text-center py-8 text-slate-400">
                            ยังไม่มีข้อมูลงาน
                        </div>
                        <div v-for="job in recentJobs" :key="job.id" class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                            <div>
                                <div class="font-medium text-slate-900 text-sm">{{ job.customerName || 'ลูกค้าทั่วไป' }}</div>
                                <div class="text-xs text-slate-500">{{ job.jobType }} • {{ formatDate(job.createdAt) }}</div>
                            </div>
                            <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusColor(job.status)]">
                                {{ getStatusLabel(job.status) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
