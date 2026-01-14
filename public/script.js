// ============================================
// 🔒 SECURITY: BLOCK SOURCE CODE VIEW
// ============================================
document.addEventListener('contextmenu', event => event.preventDefault()); 

document.onkeydown = function(e) {
    if (e.keyCode == 123) return false; 
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false; 
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false; 
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false; 
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false; 
};

// ============================================
// 🚀 MAIN LOGIC
// ============================================

function startSlider(cls, time) {
    let idx = 0; const slides = document.getElementsByClassName(cls);
    if (!slides.length) return;
    function show() {
        for (let i=0; i<slides.length; i++) slides[i].style.display = "none";
        idx++; if(idx > slides.length) idx=1;
        slides[idx-1].style.display = "block";
    }
    show(); setInterval(show, time);
}
startSlider('top-slide', 3000);
startSlider('guide-normal-slide', 2500);
startSlider('guide-expert-slide', 2500);

if (document.getElementById('bookingForm')) {
    // Variables
    const entryGate = document.getElementById('entryGate');
    const safariShift = document.getElementById('safariShift');
    const zoneName = document.getElementById('zoneName');
    const vehicleType = document.getElementById('vehicleType');
    const totalPrice = document.getElementById('totalPrice');
    const personsInput = document.getElementById('persons');
    const passengerContainer = document.getElementById('passengers-container');
    const bookingForm = document.getElementById('bookingForm');
    const mobileInput = document.getElementById('mobileNumber');
    const emailInput = document.getElementById('userEmail');
    const dateInput = document.getElementById('date');

    const zoneMapping = { 'Khatiya Gate': 'Khatiya Buffer', 'Mukki Gate': 'Khapa Buffer', 'Sarhi Gate': 'Sijhora Buffer' };
    const PRICE_SIMPLE = 9000;
    const PRICE_MODIFIED = 10000;

    // Price Update
    entryGate.addEventListener('change', () => { zoneName.value = zoneMapping[entryGate.value]; });
    
    function updatePrice() {
        totalPrice.textContent = (vehicleType.value === 'Modified Vehicle') ? "Rs. " + PRICE_MODIFIED : "Rs. " + PRICE_SIMPLE;
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
        
        let mainName = "Guest";
        if(cards.length > 0) {
            mainName = cards[0].querySelector('.p-name').value;
        }

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

    // --- PAYMENT SUBMIT ---
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const amountText = totalPrice.textContent.replace("Rs. ", "").replace("₹", "");
        
        try {
            const response = await fetch('http://localhost:3000/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountText })
            });

            if (!response.ok) throw new Error("Backend connection failed");
            const orderData = await response.json();

            const firstPassengerName = document.querySelector('.p-name').value;

            var options = {
                "key": "rzp_test_S2gHdEXUA554D9", 
                "amount": orderData.amount, 
                "currency": "INR",
                "name": "Wild Adventure",
                "description": "Safari Booking",
                "order_id": orderData.id, 
                "handler": function (response) {
                    try {
                        const finalData = getAllBookingData(response.razorpay_payment_id);
                        
                        // 1. PDF Try
                        generateProPDF(finalData);
                        
                        // 2. Email Try
                        sendDataToBackend(finalData);
                        
                        alert("✅ Booking Success! Ticket Downloaded & Email Sent.");
                        bookingForm.reset();
                        generatePassengerForms();

                    } catch (innerError) {
                        alert("❌ Error inside Handler: " + innerError.message);
                        console.error(innerError);
                    }
                },
                "prefill": {
                    "name": firstPassengerName,
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

    // ==========================================
    // 🎨 PRO PDF GENERATOR (Fixed Image)
    // ==========================================
    function generateProPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(34, 139, 34); doc.rect(0, 0, 210, 45, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
        doc.text("WILD ADVENTURE", 105, 20, null, null, "center");
        doc.setFontSize(12); doc.setFont("helvetica", "normal");
        doc.text("Official Safari Booking Confirmation", 105, 30, null, null, "center");

        // Info Box
        doc.setDrawColor(200, 200, 200); doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 55, 182, 50, 3, 3, "FD");

        doc.setFontSize(11); doc.setTextColor(50, 50, 50);

        // Details
        doc.setFont("helvetica", "bold"); doc.text("Booking ID:", 20, 65);
        doc.setFont("helvetica", "normal"); doc.text(String(data.payment_id), 50, 65);

        doc.setFont("helvetica", "bold"); doc.text("Date:", 20, 75);
        doc.setFont("helvetica", "normal"); doc.text(data.date, 50, 75);

        doc.setFont("helvetica", "bold"); doc.text("Booked By:", 20, 95);
        doc.setFont("helvetica", "normal"); doc.text(data.name, 50, 95);

        doc.setFont("helvetica", "bold"); doc.text("Total Paid:", 110, 85);
        doc.setTextColor(34, 139, 34);
        doc.setFont("helvetica", "bold"); doc.text(String(data.amount), 140, 85);
        doc.setTextColor(50, 50, 50);

        // Table
        if (typeof doc.autoTable === 'function') {
            const tableColumn = ["#", "Name", "Gender", "Age", "ID"];
            const tableRows = [];
            data.passengers.forEach((p, index) => {
                tableRows.push([index + 1, p.name, p.gender, p.age, p.id_number]);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 115,
                theme: 'grid',
                headStyles: { fillColor: [34, 139, 34] },
            });
        }

        // WhatsApp Section (With Safety Check)
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 120) + 20;
        doc.setDrawColor(200, 200, 200); doc.line(14, finalY, 196, finalY);

        try {
            // Updated Valid Base64 for WhatsApp Icon
            const waIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAclBMVEVHcEz/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQD/nQBjYy/nAAAAJXRSTlMAHA0X7+7uEhEQD+7u7u7u7hAQ7u7u7u7u7hAQ7u7u7u4QEBDP2W4kAAAAgElEQVR4nO3RuQ7CQAxE0e4O5b7v+w75/29RgoKCNIho40x25Xn4w5hZ2845N7vY1nU9xQts676e4gG29VxP8QDber+f4gG29V9P8QDbeu+neIBtfdZTPMC2PuspXmBbn/UUH2Bbn/UUL7Ct/3qKB9jWez3FA2zrvZ7iAbY1M7vY1n0B/p4X3iZ122MAAAAASUVORK5CYII=";
            
            doc.addImage(waIcon, 'PNG', 14, finalY + 5, 8, 8);
        } catch (imgError) {
            console.log("Image load failed, generating PDF without icon.");
        }

        doc.setFontSize(14); doc.setTextColor(37, 211, 102); doc.setFont("helvetica", "bold");
        doc.text("Chat on WhatsApp", 26, finalY + 11);
        doc.setFontSize(12); doc.setTextColor(0, 0, 0);
        doc.text("+91 8640075971", 26, finalY + 18);
        doc.link(14, finalY + 5, 100, 20, { url: 'https://wa.me/918640075971' });

        doc.save("Safari_Ticket.pdf");
    }

    // --- SEND EMAIL ---
    function sendDataToBackend(data) {
        fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    updatePrice();
    generatePassengerForms();
}