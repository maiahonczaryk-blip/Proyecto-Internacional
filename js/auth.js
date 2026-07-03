// auth.js - Handles localStorage based pseudo-backend for Realtors and Admins

// 1. Partner Registration
function registerPartner() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const agencyName = document.getElementById('agencyName').value;
    const email = document.getElementById('email').value;
    const country = document.getElementById('country').value;
    const terms = document.getElementById('terms').checked;

    if (!firstName || !lastName || !agencyName || !email || !country || !terms) {
        alert('Please fill out all required fields and accept the terms.');
        return;
    }

    const newPartner = {
        id: 'PTNR-' + Date.now(),
        firstName,
        lastName,
        agencyName,
        email,
        country,
        status: 'pending', // all new registrations are pending
        registrationDate: new Date().toISOString()
    };

    let partners = JSON.parse(localStorage.getItem('remax_partners') || '[]');
    // Check if email already exists
    if (partners.find(p => p.email === email)) {
        alert('An application with this email already exists.');
        return;
    }
    
    partners.push(newPartner);
    localStorage.setItem('remax_partners', JSON.stringify(partners));
    
    // Redirect to pending page
    window.location.href = 'pending.html';
}

// 2. Partner Login
function loginPartner(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('email').value;
    if (!email) {
        alert('Please enter your email.');
        return;
    }

    let partners = JSON.parse(localStorage.getItem('remax_partners') || '[]');
    const partner = partners.find(p => p.email === email);

    if (!partner) {
        alert('Partner not found. Please register first.');
        return;
    }

    if (partner.status === 'pending') {
        window.location.href = 'pending.html';
    } else if (partner.status === 'approved') {
        localStorage.setItem('remax_current_user', JSON.stringify(partner));
        window.location.href = 'dashboard.html';
    } else if (partner.status === 'rejected') {
        alert('Your application has been rejected.');
    }
}

// 3. Admin Login
function loginAdmin(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('email').value;
    if (email === 'maia.honczaryk@remax.es' || email === 'jose.martinez@remax.es') {
        localStorage.setItem('remax_admin', email);
        window.location.href = 'admin.html';
    } else {
        alert('Unauthorized. Please use a valid admin email.');
    }
}

// 4. Admin Panel Logic (Load users)
function loadAdminDashboard() {
    const admin = localStorage.getItem('remax_admin');
    if (!admin) {
        window.location.href = 'admin-login.html';
        return;
    }

    document.getElementById('admin-email-display').textContent = admin;
    
    let partners = JSON.parse(localStorage.getItem('remax_partners') || '[]');
    const tableBody = document.getElementById('partners-table-body');
    tableBody.innerHTML = '';

    partners.forEach(partner => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        if (partner.status === 'pending') statusBadge = '<span style="background:#fef08a;color:#854d0e;padding:0.2rem 0.5rem;border-radius:1rem;font-size:0.85rem;">Pending</span>';
        else if (partner.status === 'approved') statusBadge = '<span style="background:#bbf7d0;color:#166534;padding:0.2rem 0.5rem;border-radius:1rem;font-size:0.85rem;">Approved</span>';
        else statusBadge = '<span style="background:#fecaca;color:#991b1b;padding:0.2rem 0.5rem;border-radius:1rem;font-size:0.85rem;">Rejected</span>';

        let actions = '';
        if (partner.status === 'pending') {
            actions = `
                <button onclick="updatePartnerStatus('${partner.id}', 'approved')" class="btn btn-blue" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.5rem;">Approve</button>
                <button onclick="updatePartnerStatus('${partner.id}', 'rejected')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; color: #ef4444; border-color: #ef4444;">Reject</button>
            `;
        }

        row.innerHTML = `
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${partner.firstName} ${partner.lastName}</td>
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${partner.agencyName}</td>
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${partner.email}</td>
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${partner.country}</td>
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${statusBadge}</td>
            <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${actions}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updatePartnerStatus(id, newStatus) {
    let partners = JSON.parse(localStorage.getItem('remax_partners') || '[]');
    const index = partners.findIndex(p => p.id === id);
    if (index !== -1) {
        partners[index].status = newStatus;
        localStorage.setItem('remax_partners', JSON.stringify(partners));
        loadAdminDashboard(); // refresh table
    }
}

// 5. Partner Dashboard Logic
function loadPartnerDashboard() {
    const user = JSON.parse(localStorage.getItem('remax_current_user'));
    if (!user || user.status !== 'approved') {
        window.location.href = 'partner-login.html';
        return;
    }
    
    // Set user info on dashboard
    document.getElementById('partner-name').textContent = user.firstName + ' ' + user.lastName;
    document.getElementById('partner-agency').textContent = user.agencyName;
    document.getElementById('partner-id-display').textContent = user.id;
    
    // Link unique referral
    const referralLink = 'https://inmomas.es/?ref=' + user.id;
    document.getElementById('referral-link-input').value = referralLink;
}

function logout() {
    localStorage.removeItem('remax_current_user');
    localStorage.removeItem('remax_admin');
    window.location.href = 'index.html';
}
