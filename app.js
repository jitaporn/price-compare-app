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
                ตกหน่วยละ: <span id="unit-${id}">0</span> ฿
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
        let unitMultiplier = parseFloat(document.getElementById(`unitType-${id}`).value); // ตัวคูณหน่วย
        
        const unitEl = document.getElementById(`unit-${id}`);

        // ดักจับข้อผิดพลาด (ถ้าว่างเปล่า, พิมพ์ตัวอักษรแปลกๆ, หรือติดลบ ให้ตีเป็น 0)
        if (isNaN(p) || p < 0) p = 0;
        if (isNaN(q) || q <= 0) q = 0;

        if (p > 0 && q > 0) {
            // แปลงปริมาณตามหน่วยที่เลือก (เช่น 1.5 kg * 1000 = 1500 กรัม)
            let realQuantity = q * unitMultiplier;
            let unitPrice = p / realQuantity;
            
            // ตัดทศนิยมส่วนเกินออก (ถ้าลงตัวให้เป็นจำนวนเต็ม ถ้าไม่ลงตัวโชว์สุดที่ 4 ตำแหน่ง)
            let displayPrice = Number(unitPrice.toFixed(4));
            unitEl.innerText = displayPrice;
            
            items.push({ id: id, unit: unitPrice, itemNumber: index + 1 });
            
            if (unitPrice < minPrice) minPrice = unitPrice; // หาตัวที่ถูกที่สุด
        } else {
            unitEl.innerText = '0';
        }
    });

    const verdict = document.getElementById('verdict');
    verdict.classList.remove('success');

    // ตรวจสอบและแสดงผลลัพธ์
    if (items.length > 1) {
        const winners = items.filter(i => i.unit === minPrice);
        
        // ไฮไลต์ผู้ชนะ
        winners.forEach(w => document.getElementById(`card-${w.id}`).classList.add('winner'));
        
        if (winners.length === items.length) {
            verdict.innerText = '⚖️ ราคาเท่ากันทุกชิ้นครับ';
        } else {
            const winnerNumbers = winners.map(w => w.itemNumber).join(', ');
            let displayMinPrice = Number(minPrice.toFixed(4)); // ตัดศูนย์ส่วนเกินในผลลัพธ์
            
            verdict.innerText = `✨ สินค้าชิ้นที่ ${winnerNumbers} คุ้มค่าสุด ราคา ${displayMinPrice} บาท/หน่วย`;
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
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอกลับไปบนสุด
}

// ลงทะเบียน Service Worker สำหรับ PWA
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Failed', err));
    }
}