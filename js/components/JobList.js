const { ref, computed, watch, nextTick } = Vue;
import InvoiceView from './InvoiceView.js';

export default {
    components: {
        InvoiceView
    },
    props: ['jobs', 'userRole'],
    emits: ['update-status', 'edit-job', 'delete-job', 'clear-data'],
    setup(props) {
        // State
        const filterStatus = ref('All');
        const searchQuery = ref('');
        const sortKey = ref('createdAt'); // Default sort by Date
        const sortOrder = ref('desc'); // Default Newest first
        const currentPage = ref(1);
        const itemsPerPage = ref(10); // Default 10 rows
        const showInvoiceModal = ref(false);
        const selectedJob = ref(null);
        const isGeneratingPDF = ref(false);

        // Utils
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        };

        const formatCurrency = (val) => {
            return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
        };

        // Status Colors & Labels
        const getStatusConfig = (status) => {
            const configs = {
                'Pending': { label: 'รอดำเนินการ', class: 'bg-slate-100 text-slate-700 border-slate-200' },
                'In Progress': { label: 'กำลังทำ', class: 'bg-blue-50 text-blue-700 border-blue-200' },
                'Completed': { label: 'เสร็จสิ้น', class: 'bg-green-50 text-green-700 border-green-200' },
                'Delivered': { label: 'ส่งมอบแล้ว', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                'Cancelled': { label: 'ยกเลิก', class: 'bg-red-50 text-red-700 border-red-200' }
            };
            return configs[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
        };

        // Computed
        const filteredJobs = computed(() => {
            let result = props.jobs;

            // 1. Filter by Status
            if (filterStatus.value !== 'All') {
                result = result.filter(j => j.status === filterStatus.value);
            } else {
                // If 'All', exclude 'Cancelled' (Soft Deleted)
                result = result.filter(j => j.status !== 'Cancelled');
            }

            // 2. Search
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase();
                result = result.filter(j =>
                    (j.customerName || '').toLowerCase().includes(query) ||
                    (j.notes || '').toLowerCase().includes(query) ||
                    (j.jobType || '').toLowerCase().includes(query)
                );
            }

            return result;
        });

        const sortedJobs = computed(() => {
            if (!filteredJobs.value) return [];
            return [...filteredJobs.value].sort((a, b) => {
                let aVal = a[sortKey.value];
                let bVal = b[sortKey.value];

                // Safe checks
                if (aVal === null || aVal === undefined) aVal = '';
                if (bVal === null || bVal === undefined) bVal = '';

                // Handle dates
                if (sortKey.value === 'createdAt') {
                    aVal = new Date(aVal || 0).getTime();
                    bVal = new Date(bVal || 0).getTime();
                }

                if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
                return 0;
            });
        });

        const totalPages = computed(() => Math.ceil(sortedJobs.value.length / itemsPerPage.value));

        const paginatedJobs = computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage.value;
            const end = start + itemsPerPage.value;
            return sortedJobs.value.slice(start, end);
        });

        // Watchers to reset pagination
        watch([filterStatus, searchQuery, itemsPerPage], () => {
            currentPage.value = 1;
        });

        // Methods
        const handleSort = (key) => {
            if (sortKey.value === key) {
                sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
            } else {
                sortKey.value = key;
                sortOrder.value = 'asc'; // Default to asc for new key
                if (key === 'createdAt' || key === 'estimatedPrice') sortOrder.value = 'desc'; // Number/Date desc default intuitive
            }
        };

        const exportCSV = () => {
            const headers = ['ID', 'Customer Name', 'Type', 'Price', 'VAT', 'Total', 'Status', 'Date', 'Notes'];
            const rows = sortedJobs.value.map(j => [
                j.id,
                `"${j.customerName}"`,
                j.jobType,
                j.subtotal,
                j.vat,
                j.estimatedPrice,
                j.status,
                new Date(j.createdAt).toISOString().split('T')[0],
                `"${j.notes || ''}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8,"
                + headers.join(",") + "\n"
                + rows.map(e => e.join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `jobs_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const generateInvoice = (job) => {
            selectedJob.value = job;
            showInvoiceModal.value = true;
        };

        const downloadPDF = () => {
            window.print();
        };

        return {
            filterStatus,
            searchQuery,
            sortKey,
            sortOrder,
            currentPage,
            itemsPerPage,
            paginatedJobs,
            filteredJobs,
            totalPages,
            formatDate,
            formatCurrency,
            getStatusConfig,
            handleSort,
            exportCSV,
            generateInvoice,
            showInvoiceModal,
            selectedJob,
            downloadPDF,
            isGeneratingPDF
        };
    },
    template: `
        <div class="space-y-6">
            <!-- Controls & Filters -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                
                <!-- Search & Filters Group -->
                <div class="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <!-- Search -->
                    <div class="relative group w-full sm:w-64">
                        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="ค้นหา..." 
                            class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                        >
                    </div>

                    <!-- Status Filter Buttons -->
                    <div class="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <button 
                            v-for="status in ['All', 'Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled']"
                            :key="status"
                            @click="filterStatus = status"
                            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-1 sm:flex-none text-center"
                            :class="filterStatus === status 
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
                        >
                            {{ status === 'All' ? 'ทั้งหมด' : getStatusConfig(status).label }}
                        </button>
                    </div>
                </div>

                <!-- Actions Group -->
                <div class="flex items-center gap-2 w-full xl:w-auto justify-end border-t xl:border-t-0 border-slate-100 pt-3 xl:pt-0">

                    <button @click="exportCSV" class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-sm font-medium whitespace-nowrap">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            <!-- List -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th @click="handleSort('customerName')" class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none min-w-[200px]">
                                    <div class="flex items-center gap-1">
                                        ลูกค้า / รายละเอียด
                                        <i class="ph" :class="sortKey === 'customerName' ? (sortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-caret-up-down text-slate-300'"></i>
                                    </div>
                                </th>
                                <th @click="handleSort('jobType')" class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap">
                                    <div class="flex items-center gap-1">
                                        ประเภท
                                        <i class="ph" :class="sortKey === 'jobType' ? (sortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-caret-up-down text-slate-300'"></i>
                                    </div>
                                </th>
                                <th @click="handleSort('estimatedPrice')" class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap">
                                    <div class="flex items-center gap-1">
                                        ราคาประเมิน
                                        <i class="ph" :class="sortKey === 'estimatedPrice' ? (sortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-caret-up-down text-slate-300'"></i>
                                    </div>
                                </th>
                                <th @click="handleSort('createdAt')" class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap">
                                    <div class="flex items-center gap-1">
                                        วันที่รับงาน
                                        <i class="ph" :class="sortKey === 'createdAt' ? (sortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-caret-up-down text-slate-300'"></i>
                                    </div>
                                </th>
                                <th @click="handleSort('status')" class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                                    <div class="flex items-center gap-1">
                                        สถานะ
                                        <i class="ph" :class="sortKey === 'status' ? (sortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-caret-up-down text-slate-300'"></i>
                                    </div>
                                </th>
                                <th class="px-6 py-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="paginatedJobs.length === 0">
                                <td colspan="6" class="px-6 py-12 text-center">
                                    <div class="flex flex-col items-center justify-center text-slate-400">
                                        <i class="ph ph-magnifying-glass text-4xl mb-2 opacity-50"></i>
                                        <p>ไม่พบข้อมูลงาน</p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="job in paginatedJobs" :key="job.id" class="hover:bg-slate-50 transition-colors group">
                                <td class="px-6 py-4">
                                    <div class="font-medium text-slate-900">{{ job.customerName }}</div>
                                    <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <i class="ph ph-list-dashes"></i>
                                        {{ job.items ? job.items.length : 0 }} รายการ
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                                        {{ job.jobType || 'General' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-slate-900 font-medium font-mono whitespace-nowrap">
                                    {{ formatCurrency(job.estimatedPrice) }}
                                </td>
                                <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                    {{ formatDate(job.createdAt) }}
                                </td>
                                <td class="px-6 py-4">
                                    <div v-if="userRole === 'admin'" class="flex flex-wrap gap-1 w-64">
                                        <button 
                                            v-for="s in ['Pending', 'In Progress', 'Completed', 'Delivered']"
                                            :key="s"
                                            @click="$emit('update-status', job.id, s)"
                                            class="px-2 py-0.5 text-[10px] rounded border transition-all"
                                            :class="job.status === s 
                                                ? getStatusConfig(s).class + ' ring-1 ring-offset-1 ring-black/10' 
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'"
                                            :title="getStatusConfig(s).label"
                                        >
                                            {{ getStatusConfig(s).label }}
                                        </button>
                                    </div>
                                    <div v-else>
                                        <span 
                                            :class="[
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                                                getStatusConfig(job.status).class
                                            ]"
                                        >
                                            <div class="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-50"></div>
                                            {{ getStatusConfig(job.status).label }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right whitespace-nowrap">
                                    <div v-if="job.status !== 'Cancelled'" class="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            @click="generateInvoice(job)"
                                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="ใบแจ้งหนี้ (PDF)"
                                        >
                                            <i class="ph ph-file-pdf text-lg"></i>
                                        </button>
                                        
                                        <template v-if="userRole === 'admin'">
                                            <button 
                                                @click="$emit('edit-job', job)"
                                                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <i class="ph ph-pencil-simple text-lg"></i>
                                            </button>
                                            <button 
                                                @click="$emit('delete-job', job.id)"
                                                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ยกเลิกงาน"
                                            >
                                                <i class="ph ph-trash text-lg"></i>
                                            </button>
                                        </template>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Footer / Pagination -->
                <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <div>
                        แสดง {{ (currentPage - 1) * itemsPerPage + 1 }} ถึง {{ Math.min(currentPage * itemsPerPage, filteredJobs.length) }} จาก {{ filteredJobs.length }} รายการ
                    </div>
                    
                    <div class="flex items-center gap-4">
                        <!-- Items Per Page Buttons -->
                        <div class="flex bg-white rounded-lg border border-slate-200 p-1">
                             <button 
                                v-for="size in [10, 25, 50]" 
                                :key="size"
                                @click="itemsPerPage = size"
                                class="px-3 py-1 text-xs font-medium rounded transition-colors"
                                :class="itemsPerPage === size ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'"
                            >
                                {{ size }}
                            </button>
                        </div>
                        <div class="h-4 w-px bg-slate-300"></div>

                        <!-- Pagination -->
                        <div class="flex items-center gap-1">
                            <button 
                                @click="currentPage--" 
                                :disabled="currentPage === 1"
                                class="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <i class="ph ph-caret-left text-lg"></i>
                            </button>
                            
                            <div class="flex items-center gap-1">
                                <span v-for="p in totalPages" :key="p">
                                    <button 
                                        v-if="Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages"
                                        @click="currentPage = p"
                                        class="w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors"
                                        :class="currentPage === p ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'hover:bg-white hover:shadow-sm'"
                                    >
                                        {{ p }}
                                    </button>
                                    <span v-else-if="Math.abs(p - currentPage) === 2" class="px-1 text-slate-300">...</span>
                                </span>
                            </div>

                            <button 
                                @click="currentPage++" 
                                :disabled="currentPage === totalPages"
                                class="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <i class="ph ph-caret-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Modal (Preview & Print) -->
            <div v-if="showInvoiceModal && selectedJob" class="fixed inset-0 z-50 overflow-y-auto print:p-0">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity print:hidden" @click="showInvoiceModal = false"></div>

                <!-- Modal Content -->
                <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0 print:p-0 print:block">
                    <div class="relative transform bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl print:shadow-none print:w-full print:max-w-none print:my-0 print:rounded-none">
                        
                        <!-- Actions Header (Hide on Print) -->
                        <div class="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white print:hidden rounded-t-lg">
                            <div class="flex items-center gap-2">
                                <i class="ph ph-file-pdf text-xl"></i>
                                <h3 class="text-base font-bold leading-6">ตัวอย่างใบแจ้งหนี้</h3>
                            </div>
                            <div class="flex items-center gap-2">
                                <button 
                                    @click="downloadPDF"
                                    class="inline-flex justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 border border-transparent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all"
                                >
                                    <i class="ph ph-printer text-lg"></i>
                                    พิมพ์ / บันทึก PDF
                                </button>
                                <button @click="showInvoiceModal = false" class="inline-flex justify-center rounded-lg bg-black/20 hover:bg-black/40 border border-transparent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all">
                                    ปิด
                                </button>
                            </div>
                        </div>

                        <!-- Invoice Paper Container -->
                        <div class="bg-slate-100 p-8 print:p-0 flex justify-center overflow-auto max-h-[calc(100vh-100px)] print:max-h-none print:overflow-visible rounded-b-lg">
                             <div id="invoice-paper" class="bg-white shadow-lg print:shadow-none p-8 md:p-8 w-[210mm] min-h-[297mm] print:w-full print:min-h-0 print:p-0 mx-auto">
                                <InvoiceView :job="selectedJob" />
                             </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Print Styles -->
            <component :is="'style'">
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #invoice-paper, #invoice-paper * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #invoice-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        min-height: 283mm;
                        margin: 0;
                        padding: 0 8mm;
                        background: white;
                        box-shadow: none;
                        z-index: 9999;
                        overflow: visible;
                    }
                }

            </component>
        </div>
    `
}
