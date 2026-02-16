import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import JobForm from './components/JobForm.js';
import JobList from './components/JobList.js';
import Login from './components/Login.js';

const { createApp, ref, computed, onMounted, watch } = Vue;

const App = {
    components: {
        Sidebar,
        Dashboard,
        JobForm,
        JobList,
        Login
    },
    setup() {
        const currentUser = ref(null);
        const currentView = ref('dashboard'); // dashboard, new-job, jobs
        const jobs = ref([]);
        const editingJob = ref(null);
        const loginError = ref('');
        const isLoading = ref(false); // Global loading state

        const API_URL = '/api';

        const fetchJobs = async () => {
            isLoading.value = true;
            try {
                const response = await fetch(`${API_URL}/jobs`);
                if (response.ok) {
                    jobs.value = await response.json();
                } else {
                    console.error('Failed to fetch jobs');
                    jobs.value = []; // Reset on error
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
                jobs.value = []; // Reset on error
            } finally {
                isLoading.value = false;
            }
        };

        // Load jobs and check session on mount
        onMounted(() => {
            fetchJobs();

            // Check for saved session (simple persistence)
            const savedUser = localStorage.getItem('swm_system_user');
            if (savedUser) {
                currentUser.value = JSON.parse(savedUser);
            }
        });

        const handleLogin = async (credentials) => {
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });

                if (response.ok) {
                    const data = await response.json();
                    const { accessToken, ...user } = data; // Extract token
                    currentUser.value = user;
                    localStorage.setItem('swm_system_user', JSON.stringify(user));
                    localStorage.setItem('swm_auth_token', accessToken); // Store token
                    loginError.value = '';
                } else {
                    const error = await response.json();
                    loginError.value = error.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginError.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
            }
        };

        const handleLogout = () => {
            currentUser.value = null;
            localStorage.removeItem('swm_system_user');
            localStorage.removeItem('swm_auth_token'); // Clear token
            currentView.value = 'dashboard';
            editingJob.value = null;
        };

        // Helper to get headers with token
        const getAuthHeaders = () => {
            const token = localStorage.getItem('swm_auth_token');
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
        };

        // Modified addJob to handle both Create and Update
        const saveError = ref(''); // State for save errors

        const handleSaveJob = async (jobData) => {
            saveError.value = '';
            try {
                let response;
                if (editingJob.value) {
                    // Update existing job
                    response = await fetch(`${API_URL}/jobs/${jobData.id}`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(jobData)
                    });
                } else {
                    // Add new job
                    response = await fetch(`${API_URL}/jobs`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(jobData)
                    });
                }

                if (response.ok) {
                    await fetchJobs(); // Refresh list
                    editingJob.value = null;
                    currentView.value = 'jobs';
                } else {
                    const error = await response.json();
                    saveError.value = error.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
                }
            } catch (error) {
                console.error('Error saving job:', error);
                saveError.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
            }
        };

        const updateJobStatus = async (jobId, newStatus) => {
            // Optimistic update
            const job = jobs.value.find(j => j.id === jobId);
            const oldStatus = job.status;
            if (job) job.status = newStatus;

            try {
                const response = await fetch(`${API_URL}/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: newStatus })
                });
                if (!response.ok) {
                    throw new Error('Failed to update status');
                }
            } catch (error) {
                console.error('Error updating status:', error);
                // Revert
                if (job) job.status = oldStatus;
            }
        };

        // Delete single job (Admin only)
        const handleDeleteJob = async (jobId) => {
            if (confirm('คุณต้องการลบงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
                try {
                    const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (response.ok) {
                        jobs.value = jobs.value.filter(j => j.id !== jobId);
                    } else {
                        alert('ลบข้อมูลไม่สำเร็จ');
                    }
                } catch (error) {
                    console.error('Error deleting job:', error);
                }
            }
        };

        // Clear all data (Admin only)
        const handleClearData = async () => {
            if (confirm('คุณต้องการลบข้อมูลงานทั้งหมดใช่หรือไม่?!!!\n\nการกระทำนี้จะลบข้อมูลงานทั้งหมดในระบบและไม่สามารถกู้คืนได้')) {
                try {
                    const response = await fetch(`${API_URL}/jobs`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (response.ok) {
                        jobs.value = [];
                        alert('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว');
                    } else {
                        alert('ล้างข้อมูลไม่สำเร็จ');
                    }
                } catch (error) {
                    console.error('Error clearing data:', error);
                }
            }
        };

        // Start edit mode
        const handleEditJob = (job) => {
            editingJob.value = JSON.parse(JSON.stringify(job)); // Deep copy 
            currentView.value = 'new-job';
        };

        const handleCancelEdit = () => {
            editingJob.value = null;
            currentView.value = 'jobs';
        };

        return {
            currentUser,
            currentView,
            jobs,
            handleSaveJob,
            updateJobStatus,
            handleLogin,
            handleLogout,
            loginError,
            handleDeleteJob,
            handleClearData,
            handleEditJob,
            editingJob,
            handleCancelEdit,
            handleCancelEdit,
            saveError,
            isLoading
        };
    },
    template: `
        <Login v-if="!currentUser" @login="handleLogin" :error-message="loginError" />
        <div v-else class="flex h-screen overflow-hidden bg-background">
            <!-- Sidebar -->
            <Sidebar 
                :current-view="currentView" 
                :current-user="currentUser"
                @navigate="currentView = $event; editingJob = null" 
                @logout="handleLogout" 
            />

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto p-8 relative">
                
                <!-- Loading Overlay -->
                <div v-if="isLoading" class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div class="flex flex-col items-center gap-4">
                        <i class="ph ph-spinner animate-spin text-4xl text-indigo-600"></i>
                        <p class="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>

                <div class="max-w-7xl mx-auto">
                    
                    <!-- Header -->
                    <header class="mb-8 flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold text-slate-900">
                                {{ currentView === 'dashboard' ? 'ภาพรวมกิจการ' : 
                                   currentView === 'new-job' ? (editingJob ? 'แก้ไขข้อมูลงาน' : 'สร้างงานใหม่') : 
                                   currentView === 'jobs' ? 'รายการงานทั้งหมด' : '' }}
                            </h1>
                            <p class="text-slate-500 mt-1">
                                {{ currentView === 'dashboard' ? 'สรุปสถานะงานและรายได้' : 
                                   currentView === 'new-job' ? 'กรอกข้อมูลเพื่อประเมินราคาและบันทึกงาน' : 
                                   currentView === 'jobs' ? 'จัดการและติดตามสถานะงาน' : '' }}
                            </p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right hidden sm:block">
                                <p class="text-sm font-medium text-slate-900">{{ currentUser.name }}</p>
                                <p class="text-xs text-slate-500 capitalize">{{ currentUser.role }} Mode</p>
                            </div>
                            <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                {{ currentUser.username.charAt(0).toUpperCase() }}
                            </div>
                        </div>
                    </header>

                    <!-- Views -->
                    <Dashboard 
                        v-if="currentView === 'dashboard'" 
                        :jobs="jobs"
                    />
                    
                    <JobForm 
                        v-if="currentView === 'new-job'" 
                        :edit-data="editingJob"
                        :error-message="saveError"
                        @save-job="handleSaveJob"
                        @cancel="handleCancelEdit"
                    />
                    
                    <JobList 
                        v-if="currentView === 'jobs'" 
                        :jobs="jobs"
                        :user-role="currentUser.role"
                        @update-status="updateJobStatus"
                        @delete-job="handleDeleteJob"
                        @edit-job="handleEditJob"
                        @clear-data="handleClearData"
                    />

                </div>
            </main>
        </div>
    `
};

createApp(App).mount('#app');
