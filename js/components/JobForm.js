const { ref, reactive, computed, watch } = Vue;

export default {
    props: ['editData', 'errorMessage'],
    emits: ['save-job', 'cancel'],
    setup(props, { emit }) {
        const form = reactive({
            jobName: '',
            customerName: '',
            jobType: 'General', // Default type
            items: [
                { id: Date.now(), description: '', price: 0 }
            ],
            notes: ''
        });

        // Validation errors
        const errors = reactive({
            jobName: '',
            items: ''
        });

        const isEditing = computed(() => !!props.editData);

        // Initialize form with editData if provided
        watch(() => props.editData, (newData) => {
            if (newData) {
                form.jobName = newData.customerName; // Using customerName field for job name as per current schema
                form.jobType = newData.jobType || 'General';
                // Deep copy items to avoid reference issues
                form.items = JSON.parse(JSON.stringify(newData.items));
                form.notes = newData.notes || '';
            } else {
                // Reset form
                form.jobName = '';
                form.jobType = 'General';
                form.items = [{ id: Date.now(), description: '', price: 0 }];
                form.notes = '';
            }
            // Clear errors on reset/load
            errors.jobName = '';
            errors.items = '';
        }, { immediate: true });

        // Computed totals
        const subtotal = computed(() => {
            return form.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        });

        const vat = computed(() => {
            return subtotal.value * 0.07;
        });

        const grandTotal = computed(() => {
            return subtotal.value + vat.value;
        });

        // Item management
        const addItem = () => {
            form.items.push({
                id: Date.now(),
                description: '',
                price: 0
            });
        };

        const removeItem = (index) => {
            if (form.items.length > 1) {
                form.items.splice(index, 1);
            }
        };

        const validateForm = () => {
            let isValid = true;
            // Reset errors
            errors.jobName = '';
            errors.items = '';

            if (!form.jobName) {
                errors.jobName = 'กรุณากรอกชื่องาน';
                isValid = false;
            }

            if (form.items.some(i => !i.description)) {
                errors.items = 'กรุณากรอกรายละเอียดรายการให้ครบถ้วน';
                isValid = false;
            }

            return isValid;
        };

        const handleSubmit = () => {
            if (!validateForm()) {
                return;
            }

            const jobData = {
                // If editing, preserve ID, Status, CreatedAt
                id: isEditing.value ? props.editData.id : Date.now().toString(),
                status: isEditing.value ? props.editData.status : 'Pending',
                createdAt: isEditing.value ? props.editData.createdAt : new Date().toISOString(),

                // Updated fields
                customerName: form.jobName,
                jobType: form.jobType,
                items: JSON.parse(JSON.stringify(form.items)),
                subtotal: subtotal.value,
                vat: vat.value,
                estimatedPrice: grandTotal.value,
                notes: form.notes
            };
            emit('save-job', jobData);
        };

        return {
            form,
            errors,
            subtotal,
            vat,
            grandTotal,
            addItem,
            removeItem,
            handleSubmit,
            isEditing
        };
    },
    template: `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-semibold text-slate-900">{{ isEditing ? 'แก้ไขข้อมูลงาน' : 'สร้างงานใหม่' }}</h2>
                        <p class="text-sm text-slate-500 mt-1">เพิ่มรายการและราคา (Excel Style)</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-slate-500">วันที่: {{ new Date().toLocaleDateString('th-TH') }}</p>
                    </div>
                </div>
                
                <form @submit.prevent="handleSubmit" class="p-6 space-y-8">
                    
                    <!-- Job Info Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                ชื่องาน / ชื่อลูกค้า <span class="text-red-500">*</span>
                            </label>
                            <input 
                                v-model="form.jobName" 
                                type="text" 
                                class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                                :class="errors.jobName ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-slate-200'"
                                placeholder="ระบุชื่องาน หรือ ชื่อลูกค้า..."
                            >
                            <p v-if="errors.jobName" class="text-red-500 text-xs mt-1">{{ errors.jobName }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">ประเภทงาน</label>
                            <select 
                                v-model="form.jobType"
                                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="General">ทั่วไป (General)</option>
                                
                                <optgroup label="งานกลึงพื้นฐาน (Basic Turning)">
                                    <option value="Straight Turning">งานกลึงปอก (Straight Turning)</option>
                                    <option value="Facing">งานกลึงปาดหน้า (Facing)</option>
                                    <option value="Taper Turning">งานกลึงเรียว (Taper Turning)</option>
                                </optgroup>

                                <optgroup label="งานกลึงละเอียดและพิเศษ">
                                    <option value="Thread Cutting">งานกลึงเกลียว (Thread Cutting)</option>
                                    <option value="Boring">งานคว้านรูใน (Boring)</option>
                                    <option value="Grooving">งานเซาะร่อง/ตัดขาด (Grooving/Parting)</option>
                                    <option value="Form Turning">งานกลึงขึ้นรูป (Form Turning)</option>
                                    <option value="Knurling">งานพิมพ์ลาย (Knurling)</option>
                                </optgroup>

                                <optgroup label="ประเภทตามเทคโนโลยีและการใช้งาน">
                                    <option value="CNC Turning">งานกลึง CNC</option>
                                    <option value="Maintenance">งานซ่อมบำรุง (Maintenance)</option>
                                    <option value="Job Shop">งานตามแบบ (Job Shop)</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div class="border rounded-lg overflow-hidden" :class="errors.items ? 'border-red-300' : 'border-slate-200'">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th class="px-4 py-3 w-16 text-center">#</th>
                                    <th class="px-4 py-3">รายละเอียด (Description)</th>
                                    <th class="px-4 py-3 w-48 text-right">ราคา (Price)</th>
                                    <th class="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="(item, index) in form.items" :key="item.id" class="group hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-2 text-center text-slate-400 text-sm">
                                        {{ index + 1 }}
                                    </td>
                                    <td class="px-4 py-2">
                                        <input 
                                            v-model="item.description" 
                                            type="text" 
                                            class="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 placeholder-slate-300"
                                            :class="{'placeholder-red-300': errors.items && !item.description}"
                                            placeholder="ใส่รายละเอียดงาน..."
                                        >
                                    </td>
                                    <td class="px-4 py-2">
                                        <input 
                                            v-model.number="item.price" 
                                            type="number" 
                                            min="0"
                                            class="w-full bg-transparent border-none focus:ring-0 p-0 text-right font-mono text-slate-900"
                                            placeholder="0.00"
                                        >
                                    </td>
                                    <td class="px-4 py-2 text-center">
                                        <button 
                                            type="button" 
                                            @click="removeItem(index)"
                                            class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                            title="ลบรายการ"
                                            v-if="form.items.length > 1"
                                        >
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" class="px-4 py-3 bg-slate-50 border-t border-slate-200">
                                        <div class="flex justify-between items-center">
                                            <button 
                                                type="button" 
                                                @click="addItem"
                                                class="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                            >
                                                <i class="ph ph-plus-circle text-lg"></i>
                                                เพิ่มรายการใหม่
                                            </button>
                                            <span v-if="errors.items" class="text-red-500 text-xs">{{ errors.items }}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- Summary -->
                    <div class="flex flex-col items-end space-y-2">
                        <div class="w-full max-w-xs space-y-2">
                            <div class="flex justify-between text-slate-600">
                                <span>รวมเป็นเงิน (Subtotal)</span>
                                <span class="font-mono">{{ new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-slate-600">
                                <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                                <span class="font-mono">{{ new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(vat) }}</span>
                            </div>
                            <div class="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                                <span>ราคาสุทธิ (Grand Total)</span>
                                <span class="font-mono text-indigo-600">{{ new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(grandTotal) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                     <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">หมายเหตุ</label>
                        <textarea v-model="form.notes" rows="3" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"></textarea>
                    </div>

                    <!-- Global Error -->
                    <div v-if="errorMessage" class="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <i class="ph ph-warning-circle text-lg"></i>
                        {{ errorMessage }}
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                        <button type="button" @click="$emit('cancel')" class="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">ยกเลิก</button>
                        <button type="submit" class="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                            {{ isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `
}
