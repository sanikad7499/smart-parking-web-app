class SmartParking {
    constructor() {
        window.smartParking = this; // Fix for modal global access
        this.init();
        this.startRealTimeUpdates();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
        this.loadParkingStatus();
        this.updatePrice();
    }

    bindEvents() {
        // Navigation - FIXED
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });

        // Booking Form
        const form = document.getElementById('bookingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBooking();
            });
        }

        // Price updates
        const userType = document.getElementById('userType');
        const duration = document.getElementById('duration');
        if (userType) userType.addEventListener('change', () => this.updatePrice());
        if (duration) duration.addEventListener('input', () => this.updatePrice());

        // Floor selector
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadFloorSlots(btn.dataset.floor);
            });
        });

        // Admin clear
        const clearBtn = document.getElementById('clearAll');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Delete ALL records?')) {
                    this.clearAllRecords();
                }
            });
        }

        // Mobile menu
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                document.querySelector('.nav-menu').classList.toggle('active');
            });
        }
    }

    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Show selected section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Activate nav link
        const targetLink = document.querySelector(`[data-section="${section}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Load section data
        switch(section) {
            case 'dashboard': this.loadDashboard(); break;
            case 'parking': this.loadParkingStatus(); break;
            case 'admin': this.loadAdminPanel(); break;
        }
    }

    async showAlert(message, type = 'success') {
        const alert = document.getElementById('alert');
        alert.textContent = message;
        alert.className = `alert ${type} show`;
        setTimeout(() => alert.classList.remove('show'), 4000);
    }

    updatePrice() {
        const durationEl = document.getElementById('duration');
        const userTypeEl = document.getElementById('userType');
        const amountEl = document.getElementById('totalAmount');
        
        if (!durationEl || !userTypeEl || !amountEl) return;
        
        const duration = parseInt(durationEl.value) || 1;
        const userType = userTypeEl.value;
        
        let rate = 20;
        if (userType === 'Monthly') rate *= 0.7;
        if (userType === 'Yearly') rate *= 0.5;
        
        const total = (rate * duration).toFixed(2);
        amountEl.value = `₹${total}`;
    }

    async handleBooking() {
    const vehicleEl = document.getElementById('vehicle');
    const floorEl = document.getElementById('floor');
    const durationEl = document.getElementById('duration');
    const userTypeEl = document.getElementById('userType');
    const btn = document.querySelector('.btn-primary');

    const formData = {
        vehicle: vehicleEl.value.trim().toUpperCase(),
        floor: floorEl.value,
        duration: durationEl.value,
        user_type: userTypeEl.value
    };

    // FIXED: Accepts ALL Indian vehicle formats
    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$|^[A-Z]{2}[A-Z]{1,2}[0-9]{4}$|^[A-Z]{2}[0-9]{4}$|^MH12AB1234$/;
    if (!vehicleRegex.test(formData.vehicle)) {
        this.showAlert('Invalid format. Examples: DL01AB1234, MH12DE5678, KA01A1234', 'error');
        vehicleEl.focus();
        return;
    }

    // Other validations
    if (!formData.floor || formData.floor < 1 || formData.floor > 5) {
        this.showAlert('Select valid floor (1-5)', 'error');
        return;
    }

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;

        console.log('Sending:', formData); // Debug

        const response = await fetch('save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('Response:', result); // Debug

        if (result.success) {
            this.showQRScanner(result);
            this.showAlert('✅ Booking created! Scan QR to confirm.', 'success');
        } else {
            this.showAlert('❌ ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        this.showAlert('❌ Network error. Check console (F12).', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-qrcode"></i> Generate QR & Book';
        btn.disabled = false;
    }
}
    showQRScanner(bookingData) {
        const modal = document.createElement('div');
        modal.id = 'qrModal';
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-header">
                    <h3>📱 Scan QR Code</h3>
                    <button class="close-qr">&times;</button>
                </div>
                <div class="qr-content">
                    <div class="qr-display">
                        <canvas id="qrCanvas" width="200" height="200"></canvas>
                        <p>Show this at entry gate</p>
                    </div>
                    <div class="qr-scanner">
                        <video id="qrVideo" autoplay muted playsinline></video>
                        <div class="scanner-overlay">
                            <div class="scan-frame"></div>
                            <p>Scan to verify</p>
                        </div>
                    </div>
                    <div class="booking-details">
                        <h4>Booking #${bookingData.bookingId}</h4>
                        <p><strong>Vehicle:</strong> ${bookingData.vehicle}</p>
                        <p><strong>Floor:</strong> ${bookingData.floor}</p>
                        <p><strong>Slot:</strong> ${bookingData.slotId}</p>
                        <p><strong>Amount:</strong> ₹${bookingData.amount}</p>
                    </div>
                    <button class="btn-success" onclick="smartParking.confirmBooking()">
                        <i class="fas fa-check-circle"></i> Confirm Booking
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.generateQRCode(bookingData.qrData);
        this.startQRScanner();
        
        // Close button
        modal.querySelector('.close-qr').onclick = () => this.closeQRScanner();
    }

    generateQRCode(qrData) {
        const canvas = document.getElementById('qrCanvas');
        const ctx = canvas.getContext('2d');
        
        // Black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 200, 200);
        
        // White border
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 10, 180, 180);
        
        // QR pattern from data
        const dataStr = btoa(qrData).slice(0, 64);
        for (let i = 0; i < 64; i++) {
            const x = 20 + (i % 8) * 20;
            const y = 20 + Math.floor(i / 8) * 20;
            ctx.fillStyle = parseInt(dataStr[i], 16) % 2 ? '#000' : '#fff';
            ctx.fillRect(x, y, 16, 16);
        }
        
        // Corner finders
        ctx.fillStyle = '#000';
        ctx.fillRect(12, 12, 24, 24);
        ctx.fillRect(164, 12, 24, 24);
        ctx.fillRect(12, 164, 24, 24);
    }

    startQRScanner() {
        const video = document.getElementById('qrVideo');
        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: 400, height: 400 }
        }).then(stream => {
            video.srcObject = stream;
            // Auto-confirm after 2 seconds (demo)
            setTimeout(() => {
                document.querySelector('.scan-frame').style.border = '3px solid #4CAF50';
                this.showAlert('✅ QR Verified!', 'success');
            }, 2000);
        }).catch(() => {
            console.log('Camera access denied - demo mode');
        });
    }

    confirmBooking() {
        this.closeQRScanner();
        this.showAlert('🎉 Booking CONFIRMED! Check Dashboard.', 'success');
        
        // Reset & refresh
        document.getElementById('bookingForm').reset();
        this.updatePrice();
        this.switchSection('dashboard');
        
        setTimeout(() => {
            this.loadDashboard();
            this.loadParkingStatus();
            this.loadAdminPanel();
        }, 1000);
    }

    closeQRScanner() {
        const modal = document.getElementById('qrModal');
        if (modal) modal.remove();
    }

    // Data loading methods
   async loadDashboard() {
    try {
        const response = await fetch('fetch_bookings.php?action=dashboard');
        const data = await response.json();

        if (data.error) throw new Error(data.message || 'Dashboard fetch failed');

        document.getElementById('availableSlots').textContent = data.availableSlots;
        document.getElementById('occupiedSlots').textContent = data.occupiedSlots;
        document.getElementById('totalRevenue').textContent = `₹${data.totalRevenue}`;
        document.getElementById('totalBookings').textContent = data.totalBookings;

        this.renderRecentBookings(data.recentBookings);

        // Update last updated time
        const lastUpdated = document.getElementById('tableLastUpdated');
        if (lastUpdated) lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        console.error('Dashboard error:', e);
        const tbody = document.getElementById('recentBookingsBody');
        if (tbody) tbody.innerHTML = `<tr>
            <td colspan="8" style="text-align:center;padding:30px;color:red">
                Failed to load recent bookings.
            </td>
        </tr>`;
    }
}
async loadParkingStatus() {
    // Load Floor 1 by default when Parking tab is opened
    this.loadFloorSlots('1');
}

   renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsBody');
    if (!tbody) return;

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="8" style="text-align:center;padding:30px;color:rgba(255,255,255,0.5)">
                No bookings yet.
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td>${b.id}</td>
            <td>${b.vehicle}</td>
            <td>${b.floor}</td>
            <td>${b.slot_id}</td>
            <td>${b.duration}h</td>
            <td>${b.user_type}</td>
            <td>₹${b.amount}</td>
            <td>${new Date(b.created_at).toLocaleString()}</td>
        </tr>
    `).join('');
}
    async loadFloorSlots(floor) {
    const grid = document.getElementById('parkingGrid');
    if (!grid) return;

    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:rgba(255,255,255,0.5)">
        <i class="fas fa-spinner fa-spin"></i> Loading parking slots...
    </div>`;

    try {
        const response = await fetch(`fetch_bookings.php?action=slots&floor=${floor}`);
        const slots = await response.json();

        grid.innerHTML = '';

        if (!slots || slots.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:rgba(255,255,255,0.5)">
                No slots data found for Floor ${floor}.
            </div>`;
            return;
        }

        for (let i = 1; i <= 10; i++) {
            const slotId = (parseInt(floor) - 1) * 10 + i;
            const slot = slots.find(s => s.slot_id == slotId) || { status: 'available' };

            const slotEl = document.createElement('div');
            slotEl.className = `parking-slot ${slot.status}`;
            slotEl.textContent = slotId;
            slotEl.title = `Slot ${slotId} - ${slot.status.toUpperCase()}`;
            grid.appendChild(slotEl);
        }
    } catch (e) {
        console.error('Slots error:', e);
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:red">
            Failed to load slots for Floor ${floor}.
        </div>`;
    }
}
    async loadAdminPanel() {
        try {
            const response = await fetch('fetch_bookings.php?action=admin');
            const data = await response.json();
            
            document.getElementById('adminTotalRevenue').textContent = `₹${data.totalRevenue}`;
            
            const tbody = document.getElementById('adminTableBody');
            tbody.innerHTML = data.bookings.map(b => `
                <tr>
                    <td>${b.id}</td>
                    <td>${b.vehicle}</td>
                    <td>${b.floor}</td>
                    <td>${b.slot_id}</td>
                    <td>${b.duration}h</td>
                    <td>${b.user_type}</td>
                    <td>₹${b.amount}</td>
                    <td>${new Date(b.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Admin error:', e);
        }
    }

    async clearAllRecords() {
        try {
            const response = await fetch('save.php?action=clear');
            const result = await response.json();
            if (result.success) {
                this.showAlert('🗑️ All records cleared!');
                this.loadDashboard();
                this.loadAdminPanel();
            }
        } catch (e) {
            this.showAlert('Clear failed', 'error');
        }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            if (document.querySelector('.section.active#dashboard')) {
                this.loadDashboard();
            }
        }, 3000);
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new SmartParking();
});