const { computed } = Vue;

export default {
    props: ['job'],
    setup(props) {
        const formatBahtText = (num) => {
            if (!num) return 'ศูนย์บาทถ้วน';
            num = parseFloat(num).toFixed(2);
            let [baht, satang] = num.split('.');
            let thaiNum = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
            let thaiUnit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

            const convert = (n) => {
                let res = '';
                let len = n.length;
                for (let i = 0; i < len; i++) {
                    let digit = parseInt(n[i]);
                    let pos = len - i - 1;
                    if (digit !== 0) {
                        if (pos === 1 && digit === 1) res += ''; // "สิบ" not "หนึ่งสิบ"
                        else if (pos === 1 && digit === 2) res += 'ยี่';
                        else if (pos === 0 && digit === 1 && len > 1) res += 'เอ็ด';
                        else res += thaiNum[digit];

                        res += thaiUnit[pos];
                    }
                }
                return res;
            };

            let bahtText = convert(baht);
            let satangText = convert(satang);

            if (bahtText === '') bahtText = 'ศูนย์';
            if (satangText === '' || parseInt(satang) === 0) {
                return bahtText + 'บาทถ้วน';
            } else {
                return bahtText + 'บาท' + satangText + 'สตางค์';
            }
        };

        const totalText = computed(() => {
            if (!props.job) return '';
            return formatBahtText(props.job.estimatedPrice);
        });

        const formatDate = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('th-TH', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });
        };

        const formatCurrency = (val) => {
            return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
        };

        return {
            totalText,
            formatDate,
            formatCurrency
        };
    },
    template: `
        <div class="invoice-container bg-white text-slate-900 font-sans text-xs leading-relaxed transform origin-top mx-auto h-full flex flex-col justify-between">
            
            <!-- Content Wrapper -->
            <div>
                <!-- Header -->
                <div class="flex justify-between gap-8 items-start mb-4">
                    <div class="w-1/2">
                        <div class="flex items-center gap-3 mb-4">
                            <!-- Logo Placeholder -->
                            <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                                SWM
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-indigo-900">SWM Machine Ltd.</h1>
                                <p class="text-slate-500 text-[10px]">Tax ID: 0-1234-56789-00-1</p>
                            </div>
                        </div>
                        <div class="text-[11px] text-slate-600">
                            <p>123/45 Muang District,</p>
                            <p>Pathum Thani, 12110</p>
                            <p>Tel: 02-123-4567</p>
                            <p>Email: contact@swm.co.th</p>
                        </div>
                    </div>
                    <div class="w-1/2 text-center">
                        <h2 class="text-2xl font-bold text-indigo-600 uppercase tracking-widest">ใบแจ้งหนี้</h2>
                        <span class="text-xs text-slate-400 font-medium tracking-wide uppercase">Invoice / Billing Note</span>
                        
                        <div class="text-left mt-4 space-y-1">
                             <div class="flex justify-start gap-8 text-[11px]">
                                <span class="text-slate-500 font-medium w-24">เลขที่เอกสาร:</span>
                                <span class="font-bold text-slate-900">{{ job?.id.substring(0, 8).toUpperCase() }}</span>
                            </div>
                            <div class="flex justify-start gap-8 text-[11px]">
                                <span class="text-slate-500 font-medium w-24">วันที่:</span>
                                <span class="text-slate-900">{{ formatDate(job?.createdAt) }}</span>
                            </div>
                             <div class="flex justify-start gap-8 text-[11px]">
                                <span class="text-slate-500 font-medium w-24">ผู้ขาย:</span>
                                <span class="text-slate-900">Admin</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="border-t border-b border-slate-200 py-4 relative bg-slate-50/50 -mx-4 px-4">
                    <div class="flex justify-between">
                        <div class="w-1/2 pr-4">
                            <h3 class="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wide">ลูกค้า (Customer)</h3>
                            <p class="text-[11px] text-slate-600">{{ job?.customerName }}</p>
                            <p class="text-[11px] text-slate-600">
                                (ที่อยู่ลูกค้า - รอข้อมูลเพิ่มเติม)<br>
                                Tax ID: -
                            </p>
                        </div>
                        <div class="w-1/2 pl-4 border-l border-slate-200">
                             <h3 class="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wide">หมายเหตุ (Note)</h3>
                             <p class="text-[11px] text-slate-600 whitespace-pre-line">{{ job?.notes || '-' }}</p>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="mb-8">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-wider text-slate-500 border-b border-indigo-100">
                                <th class="py-2 w-12 font-semibold">#</th>
                                <th class="py-2 font-semibold">รายละเอียด (Description)</th>
                                <th class="py-2 w-16 text-right font-semibold">จำนวน</th>
                                <th class="py-2 w-24 text-right font-semibold">ราคาต่อหน่วย</th>
                                <th class="py-2 w-20 text-right font-semibold">ส่วนลด</th>
                                <th class="py-2 w-24 text-right font-semibold">จำนวนเงิน</th>
                            </tr>
                        </thead>
                        <tbody class="text-[11px] text-slate-700">
                            <tr v-for="(item, index) in job?.items" :key="index" class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                <td class="py-3 align-top text-slate-400">{{ index + 1 }}</td>
                                <td class="py-3 align-top font-medium text-slate-900">{{ item.description }}</td>
                                <td class="py-3 align-top text-right">1</td>
                                <td class="py-3 align-top text-right">{{ formatCurrency(item.price) }}</td>
                                <td class="py-3 align-top text-right">-</td>
                                <td class="py-3 align-top text-right font-semibold text-slate-900">{{ formatCurrency(item.price) }}</td>
                            </tr>
                            
                            <!-- Empty rows filler (optional for aesthetics) -->
                             <tr v-if="!job?.items || job?.items.length < 5" class="h-8"></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Footer Section -->
            <div>
                 <div class="flex justify-between gap-8 items-start border-t border-slate-200 pt-4">
                    <!-- Text Amount -->
                    <div class="w-1/2 bg-slate-50 rounded-lg p-6 border border-slate-100">
                        <span class="text-[10px] text-slate-500 uppercase tracking-wide font-medium block mb-1">จำนวนเงินตัวอักษร</span>
                        <p class="font-medium text-indigo-700 text-sm">({{ totalText }})</p>
                    </div>

                    <!-- Totals -->
                    <div class="w-1/2 space-y-2 text-[11px]">
                         <div class="flex justify-between text-slate-600">
                            <span class="font-medium">รวมเป็นเงิน (Subtotal)</span>
                            <span class="font-medium">{{ formatCurrency(job?.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span class="font-medium">ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                            <span class="font-medium">{{ formatCurrency(job?.vat) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-lg font-bold text-indigo-900 border-t border-indigo-100 pt-3 mt-2">
                            <span>ยอดรวมสุทธิ (Total)</span>
                            <span>{{ formatCurrency(job?.estimatedPrice) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Signatures -->
                <div class="mt-12 grid grid-cols-2 gap-12 text-center text-[11px]">
                    <div class="flex flex-col items-center">
                        <div class="flex items-end justify-center gap-3 mb-2 w-full px-4">
                            <div class="h-0.5 bg-slate-300 flex-1"></div>
                            <div class="flex items-end gap-2 text-[10px] text-slate-400 whitespace-nowrap">
                                <span>วันที่</span>
                                <div class="h-0.5 bg-slate-300 w-16 mb-0.5"></div>
                            </div>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900 mb-1">ผู้รับวางบิล / ผู้รับสินค้า</p>
                            <p class="text-slate-500">Received By</p>
                        </div>
                    </div>
                     <div class="flex flex-col items-center">
                        <div class="flex items-end justify-center gap-3 mb-2 w-full px-4">
                            <div class="h-0.5 bg-slate-300 flex-1"></div>
                            <div class="flex items-end gap-2 text-[10px] text-slate-400 whitespace-nowrap">
                                <span>วันที่</span>
                                <div class="h-0.5 bg-slate-300 w-16 mb-0.5"></div>
                            </div>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900 mb-1">ผู้วางบิล / ผู้ส่งสินค้า</p>
                            <p class="text-slate-500">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
}
