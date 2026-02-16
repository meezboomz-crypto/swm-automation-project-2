const { ref, reactive } = Vue;

export default {
    props: ['errorMessage'],
    emits: ['login'],
    setup(props, { emit }) {
        const credentials = reactive({
            username: '',
            password: ''
        });

        const error = ref('');

        const handleLogin = () => {
            if (!credentials.username || !credentials.password) {
                error.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
                return;
            }
            emit('login', { ...credentials });
        };

        return {
            credentials,
            error,
            handleLogin
        };
    },
    template: `
        <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="h-16 w-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
                            <i class="ph ph-wrench text-3xl"></i>
                        </div>
                        <h1 class="text-2xl font-bold text-slate-900">SWM System</h1>
                        <p class="text-slate-500 mt-2">เข้าสู่ระบบเพื่อจัดการงาน</p>
                    </div>

                    <form @submit.prevent="handleLogin" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ใช้</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="ph ph-user text-slate-400"></i>
                                </div>
                                <input 
                                    v-model="credentials.username" 
                                    type="text" 
                                    class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Username"
                                >
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">รหัสผ่าน</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="ph ph-lock-key text-slate-400"></i>
                                </div>
                                <input 
                                    v-model="credentials.password" 
                                    type="password" 
                                    class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••"
                                >
                            </div>
                        </div>

                        <div v-if="error || errorMessage" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                            <i class="ph ph-warning-circle"></i>
                            {{ error || errorMessage }}
                        </div>

                        <button 
                            type="submit" 
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5"
                        >
                            เข้าสู่ระบบ
                        </button>
                    </form>
                </div>
                <div class="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                    <p class="text-xs text-slate-500">
                        สำหรับพนักงานและผู้ดูแลระบบเท่านั้น
                    </p>
                </div>
            </div>
        </div>
    `
}
