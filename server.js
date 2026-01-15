// ============================================
// 🔒 SECURITY
// ============================================
document.addEventListener('contextmenu', event => event.preventDefault()); 

// ============================================
// 🖼️ PART 1: SLIDER LOGIC (Sirf Home Page ke liye)
// ============================================
function startSlider(cls, time) {
    let idx = 0; const slides = document.getElementsByClassName(cls);
    if (!slides.length) return; // Agar slider nahi hai toh ruk jao
    function show() {
        for (let i=0; i<slides.length; i++) slides[i].style.display = "none";
        idx++; if(idx > slides.length) idx=1;
        slides[idx-1].style.display = "block";
    }
    show(); setInterval(show, time);
}

// Ye tabhi chalega jab Slider HTML mein hoga
startSlider('top-slide', 3000);
startSlider('guide-normal-slide', 2500);
startSlider('guide-expert-slide', 2500);


// ============================================
// 🚀 PART 2: BOOKING LOGIC (Sirf Booking Page ke liye)
// ============================================

const bookingForm = document.getElementById('bookingForm');

// Agar Booking Form dikhe, tabhi ye code chalao
if (bookingForm) {
    const entryGate = document.getElementById('entryGate');
    const safariShift = document.getElementById('safariShift');
    const zoneName = document.getElementById('zoneName');
    const vehicleType = document.getElementById('vehicleType');
    const totalPrice = document.getElementById('totalPrice');
    const personsInput = document.getElementById('persons');
    const passengerContainer = document.getElementById('passengers-container');
    const mobileInput = document.getElementById('mobileNumber');
    const emailInput = document.getElementById('userEmail');
    const dateInput = document.getElementById('date');

    const zoneMapping = { 'Khatiya Gate': 'Khatiya Buffer', 'Mukki Gate': 'Khapa Buffer', 'Sarhi Gate': 'Sijhora Buffer' };
    
    // 🛠️ PRICES
    const PRICE_SIMPLE = 9000;
    const PRICE_MODIFIED = 10000;

    // Logic
    entryGate.addEventListener('change', () => { zoneName.value = zoneMapping[entryGate.value]; });
    
    function updatePrice() {
        if (vehicleType.value === 'Premium Safari') {
            totalPrice.textContent = "Rs. " + PRICE_MODIFIED;
        } else {
            totalPrice.textContent = "Rs. " + PRICE_SIMPLE;
        }
    }
    vehicleType.addEventListener('change', updatePrice);

    // Form Generator
    function generatePassengerForms() {
        let count = parseInt(personsInput.value);
        if (count < 1) count = 1; if (count > 6) { count = 6; personsInput.value = 6; }
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `<div class="member-card">
                <div style="background:#33c1ff; color:white; padding:5px; font-weight:bold;">👤 Member ${i}</div>
                <div class="form-group"><label>Name</label><input type="text" class="p-name" placeholder="Full Name" required></div>
                <div class="grid-2">
                    <div class="form-group"><label>Gender</label><select class="p-gender"><option>Male</option><option>Female</option></select></div>
                    <div class="form-group"><label>Age</label><input type="number" class="p-age" placeholder="Age" required></div>
                </div>
                <div class="form-group"><label>ID Number</label><input type="text" class="p-id" placeholder="Aadhar/PAN ID" required></div>
            </div>`;
        }
        passengerContainer.innerHTML = html;
    }
    personsInput.addEventListener('change', generatePassengerForms);
    personsInput.addEventListener('keyup', generatePassengerForms);

    // Data Collector
    function getAllBookingData(paymentId) {
        let allPassengers = [];
        const cards = document.querySelectorAll('.member-card');
        let mainName = cards.length > 0 ? cards[0].querySelector('.p-name').value : "Guest";

        cards.forEach((card) => {
            allPassengers.push({
                name: card.querySelector('.p-name').value || "-",
                gender: card.querySelector('.p-gender').value || "-",
                age: card.querySelector('.p-age').value || "-",
                id_number: card.querySelector('.p-id').value || "-"
            });
        });

        return {
            name: mainName,
            mobile: mobileInput.value,
            email: emailInput.value,
            date: dateInput.value,
            shift: safariShift.value,
            gate: entryGate.value,
            vehicle: vehicleType.value,
            amount: totalPrice.textContent,
            payment_id: paymentId,
            passengers: allPassengers
        };
    }

    // Payment Logic
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const amountText = totalPrice.textContent.replace("Rs. ", "").replace("₹", "");
        
        try {
            const response = await fetch('/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountText })
            });

            if (!response.ok) throw new Error("Backend connection failed");
            const orderData = await response.json();

            var options = {
                "key": "rzp_test_S2gHdEXUA554D9", 
                "amount": orderData.amount, 
                "currency": "INR",
                "name": "Wild Adventure",
                "description": "Safari Booking",
                "order_id": orderData.id, 
                "handler": function (response) {
                    const finalData = getAllBookingData(response.razorpay_payment_id);
                    generateProPDF(finalData);
                    sendDataToBackend(finalData);
                    alert("✅ Booking Success!");
                    bookingForm.reset();
                    generatePassengerForms();
                },
                "prefill": {
                    "name": "Guest",
                    "email": emailInput.value,
                    "contact": mobileInput.value
                },
                "theme": { "color": "#28a745" }
            };
            var rzp1 = new Razorpay(options);
            rzp1.open();
        } catch (err) {
            alert("⚠️ Start Error: " + err.message);
        }
    });

    // Initialize
    updatePrice();
    generatePassengerForms();
}

// ============================================
// 🛠️ SHARED FUNCTIONS (PDF & EMAIL)
// ============================================
function generateProPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(34, 139, 34); doc.rect(0, 0, 210, 45, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
    doc.text("WILD ADVENTURE", 105, 20, null, null, "center");
    
    doc.setFontSize(11); doc.setTextColor(0, 0, 0);
    doc.text(`Booking ID: ${data.payment_id}`, 20, 60);
    doc.text(`Safari Type: ${data.vehicle}`, 20, 70);
    doc.text(`Total Paid: ${data.amount}`, 20, 80);

    if (typeof doc.autoTable === 'function') {
        const tableColumn = ["Name", "Gender", "Age", "ID"];
        const tableRows = [];
        data.passengers.forEach(p => tableRows.push([p.name, p.gender, p.age, p.id_number]));
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 90 });
    }
    doc.save("Safari_Ticket.pdf");
}

function sendDataToBackend(data) {
    fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}