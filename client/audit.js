// audit.js

/**
 * Log an activity to localStorage.
 * @param {Object} data - The activity data.
 * @param {string} data.type - 'Encryption', 'Decryption', 'Login', 'Recovery'
 * @param {string} data.status - 'Success', 'Failed', 'Consumed'
 * @param {string} [data.file] - File name
 * @param {string} [data.size] - File size string (e.g., '14 KB')
 * @param {string} [data.enc] - Encryption algorithm (e.g., 'AES-GCM')
 * @param {string} [data.statusDet] - Detail message (e.g., 'Payload Embedded')
 * @param {string} [data.title] - Specific title for the timeline (e.g., 'Encryption Completed')
 */
window.logActivity = function(data) {
    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem('dc_audit_log') || '[]');
    } catch (e) {
        logs = [];
    }

    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    
    let device = "Desktop";
    if (/Mobi|Android/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

    const ip = "192.168.1." + Math.floor(Math.random() * 255);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString();

    const newLog = {
        type: data.type || 'Unknown',
        status: data.status || 'Unknown',
        file: data.file || '-',
        size: data.size || '-',
        enc: data.enc || '-',
        dateISO: dateString,
        time: timeString,
        device: device,
        browser: browser,
        ip: ip,
        statusDet: data.statusDet || '-',
        retention: '24 Jam',
        title: data.title || (data.type + ' ' + data.status)
    };

    logs.unshift(newLog); // prepend to keep newest first
    localStorage.setItem('dc_audit_log', JSON.stringify(logs));

    // Send to server
    fetch('/api/activity/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLog)
    }).catch(err => console.error('Failed to log activity to server:', err));
};

// Automatically sync user profile in UI
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();
        
        if (data.success && data.user) {
            const userNameEls = document.querySelectorAll('.user-name');
            const userAvatarEls = document.querySelectorAll('.user-avatar');
            
            const username = data.user.username;
            const initial = username.charAt(0).toUpperCase();
            
            userNameEls.forEach(el => {
                el.textContent = username;
            });
            
            userAvatarEls.forEach(el => {
                el.textContent = initial;
            });
        }
    } catch (e) {
        console.error('Failed to sync user profile:', e);
    }
});
