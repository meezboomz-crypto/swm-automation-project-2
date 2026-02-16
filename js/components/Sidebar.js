export default {
    props: ['currentView', 'currentUser'],
    emits: ['navigate', 'logout'],
    template: `
        <aside class="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
            <!-- Logo -->
            <div class="h-16 flex items-center px-6 border-b border-slate-100">
                <div class="flex items-center gap-2 text-indigo-600">
                    <i class="ph-fill ph-nut text-2xl"></i>
                    <span class="text-lg font-bold tracking-tight text-slate-900">SWM System</span>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-3 py-4 space-y-1">
                <button 
                    @click="$emit('navigate', 'dashboard')"
                    :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        currentView === 'dashboard' 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    ]"
                >
                    <i class="ph ph-squares-four text-lg"></i>
                    ภาพรวม (Dashboard)
                </button>

                <button 
                    @click="$emit('navigate', 'new-job')"
                    :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        currentView === 'new-job' 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    ]"
                >
                    <i class="ph ph-plus-circle text-lg"></i>
                    สร้างงานใหม่
                </button>

                <button 
                    @click="$emit('navigate', 'jobs')"
                    :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        currentView === 'jobs' 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    ]"
                >
                    <i class="ph ph-list-dashes text-lg"></i>
                    รายการงานทั้งหมด
                </button>
            </nav>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-100">
                <div class="bg-slate-50 rounded-lg p-3">
                    <p class="text-xs font-medium text-slate-500 uppercase mb-2">สถานะระบบ</p>
                    <div class="flex items-center gap-2 text-sm text-slate-700">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ออนไลน์
                    </div>
                    


                    <button 
                        @click="$emit('logout')"
                        class="w-full flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors mt-3 pt-3 border-t border-slate-200"
                    >
                        <i class="ph ph-sign-out text-lg"></i>
                        ออกจากระบบ
                    </button>
                    <p class="text-xs text-slate-400 mt-2">v1.2.0</p>
                </div>
            </div>
        </aside>
    `
}
