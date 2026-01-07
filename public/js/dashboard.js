// Clock
function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    const dateElement = document.getElementById('portal-current-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

setInterval(updateTime, 1000);
updateTime();

// Sidebar Toggle (Mobile)
const menuToggle = document.getElementById('portal-menu-toggle');
const sidebar = document.getElementById('portal-sidebar');
const overlay = document.getElementById('portal-sidebar-overlay');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    });
}

if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });
}

// Dark Mode Toggle
const modeBtn = document.getElementById('mode-setting-btn');
if (modeBtn) {
    modeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const moonIcon = modeBtn.querySelector('.layout-mode-dark');
        const sunIcon = modeBtn.querySelector('.layout-mode-light');

        if (moonIcon && sunIcon) {
            if (moonIcon.style.display === 'none') {
                moonIcon.style.display = 'inline';
                sunIcon.style.display = 'none';
            } else {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline';
            }
        }
    });
}
