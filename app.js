let itemCount = 0;

// เริ่มต้นแอปให้มี 2 สินค้ามารอไว้เลย และลงทะเบียน Service Worker
window.onload = () => {
    addItem();
    addItem();
    registerSW();
};

function addItem() {
    itemCount++;
    const id = Date.now() + '-' + itemCount; // สร้าง ID ไม่ซ้ำกัน
    const container = document.getElementById('cards-container');
    
    // โครงสร้าง Card แบบใหม่ เพิ่มช่องเลือกหน่วย
    const cardHTML = `
        <div class="card" id="card-${id}">
            <div class="card-header">
                <span class="card-title">สินค้า</span>
                <button class="btn-del" onclick="removeItem('${id}')" title="ลบ">✕</button>
            </div>
            <div class="input-row">
                <div class="input-group">
                    <label>ราคา (฿)</label>
                    <input type="number" id="price-${id}" inputmode="decimal" placeholder="0" oninput="calculate()">
                </div>
                <div class="input-group">
                    <label>ปริมาณ และ หน่วย</label>
                    <div class="qty-wrapper">
                        <input type="number" id="qty-${id}" inputmode="decimal" placeholder="1" oninput="calculate()">
                        <select id="unitType-${id}" class="unit-select" onchange="calculate()">
                            <option value="1">ชิ้น / กรัม / ml</option>
                            <option value="1000">กิโลกรัม (kg)</option>
                            <option value="1000">ลิตร (L)</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="unit-price">
                ตกหน่วยละ: <span id="unit-${id}">0</span> บาท
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
    updateTitles();
    calculate();
}

function removeItem(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
        card.remove();
        updateTitles();
        calculate();
    }
}

// อัปเดตเลขบนหัวการ์ดให้เรียงลำดับใหม่เสมอ
function updateTitles() {
    const titles = document.querySelectorAll('.card-title');
    titles.forEach((el, index) => {
        el.innerText = `สินค้าชิ้นที่ ${index + 1}`;
    });
}

function calculate() {
    const cards = document.querySelectorAll('.card');
    let minPrice = Infinity;
    let items = [];

    // ดึงค่าทั้งหมดมาคำนวณราคาต่อหน่วย
    cards.forEach((card, index) => { 
        card.classList.remove('winner');
        const id = card.id.replace('card-', '');
        
        let p = parseFloat(document.getElementById(`price-${id}`).value);
        let q = parseFloat(document.getElementById(`qty-${id}`).value);
        let unitMultiplier = parseFloat(document.getElementById(`unitType-${id}`).value); 
        
        const unitEl = document.getElementById(`unit-${id}`);

        if (isNaN(p) || p < 0) p = 0;
        if (isNaN(q) || q <= 0) q = 0;

        if (p > 0 && q > 0) {
            let realQuantity = q * unitMultiplier;
            let unitPrice = p / realQuantity;
            
            let displayPrice = Number(unitPrice.toFixed(4));
            unitEl.innerText = displayPrice;
            
            items.push({ id: id, unit: unitPrice, itemNumber: index + 1 });
            
            if (unitPrice < minPrice) minPrice = unitPrice; 
        } else {
            unitEl.innerText = '0';
        }
    });

    const verdict = document.getElementById('verdict');
    verdict.classList.remove('success');

    // ตรวจสอบและแสดงผลลัพธ์
    if (items.length > 1) {
        const winners = items.filter(i => i.unit === minPrice);
        
        // ---- ส่วนที่แก้ไข: เพิ่มคำว่า "บาท/หน่วย" ลงไปให้ชัดเจน ----
        let compareSummaryText = items.map(i => `ชิ้นที่ ${i.itemNumber} = ${Number(i.unit.toFixed(4))} บาท/หน่วย`).join(' | ');

        // ไฮไลต์ผู้ชนะ
        winners.forEach(w => document.getElementById(`card-${w.id}`).classList.add('winner'));
        
        if (winners.length === items.length) {
            verdict.innerHTML = `
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px; font-weight: normal; line-height: 1.4;">${compareSummaryText}</div>
                <div>⚖️ ราคาเท่ากันทุกชิ้นครับ</div>
            `;
        } else {
            const winnerNumbers = winners.map(w => w.itemNumber).join(', ');
            verdict.innerHTML = `
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px; font-weight: normal; line-height: 1.4;">${compareSummaryText}</div>
                <div style="font-size: 16px;">✨ ชิ้นที่ ${winnerNumbers} คุ้มค่าสุด!</div>
            `;
            verdict.classList.add('success');
        }
    } else {
        verdict.innerText = 'พิมพ์ราคาและปริมาณให้ครบเพื่อเปรียบเทียบ';
    }
}

function clearAll() {
    document.getElementById('cards-container').innerHTML = '';
    itemCount = 0;
    addItem();
    addItem();
    calculate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ลงทะเบียน Service Worker สำหรับ PWA
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Failed', err));
    }
}