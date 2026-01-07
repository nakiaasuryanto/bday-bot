// Initialize DataTable
$(document).ready(function() {
    $('#birthdaysTable').DataTable({
        pageLength: 10,
        order: [[1, 'asc']],
        language: {
            search: "Search:",
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries"
        }
    });

    // Load logs on page load
    refreshLogs();
});

// Birthday Management Functions
function editBirthday(index) {
    fetch('/api/birthdays')
        .then(res => res.json())
        .then(birthdays => {
            const person = birthdays[index];
            document.getElementById('birthdayIndex').value = index;
            document.getElementById('nama').value = person.nama;
            document.getElementById('role').value = person.role;
            document.getElementById('tanggal_lahir').value = person.tanggal_lahir;
            document.getElementById('nomor_wa').value = person.nomor_wa || '';
            document.getElementById('grup_id').value = person.grup_id || '';
            document.getElementById('grup_nama').value = person.grup_nama || '';

            document.getElementById('modalTitle').textContent = 'Edit Birthday';
            const modal = new bootstrap.Modal(document.getElementById('addBirthdayModal'));
            modal.show();
        });
}

function deleteBirthday(index, name) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        fetch(`/api/birthdays/${index}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Birthday deleted successfully!');
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            alert('Error deleting birthday');
            console.error(err);
        });
    }
}

function saveBirthday() {
    const index = document.getElementById('birthdayIndex').value;
    const data = {
        nama: document.getElementById('nama').value,
        role: document.getElementById('role').value,
        tanggal_lahir: document.getElementById('tanggal_lahir').value,
        nomor_wa: document.getElementById('nomor_wa').value,
        grup_id: document.getElementById('grup_id').value,
        grup_nama: document.getElementById('grup_nama').value
    };

    const method = index === '-1' ? 'POST' : 'PUT';
    const url = index === '-1' ? '/api/birthdays' : `/api/birthdays/${index}`;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            alert('Birthday saved successfully!');
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    })
    .catch(err => {
        alert('Error saving birthday');
        console.error(err);
    });
}

// Bot Control Functions
function reloadBot() {
    if (confirm('Are you sure you want to reload the bot?')) {
        fetch('/api/reload-bot', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                setTimeout(refreshLogs, 2000);
            })
            .catch(err => {
                alert('Error reloading bot');
                console.error(err);
            });
    }
}

function clearLogs() {
    if (confirm('Are you sure you want to clear the birthday log?')) {
        fetch('/api/clear-birthday-log', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
            })
            .catch(err => {
                alert('Error clearing logs');
                console.error(err);
            });
    }
}

function testMessage() {
    const name = prompt('Enter name to test (leave empty for first birthday in list):');
    fetch('/api/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        setTimeout(refreshLogs, 2000);
    })
    .catch(err => {
        alert('Error sending test message');
        console.error(err);
    });
}

function getGroups() {
    if (confirm('Fetch WhatsApp groups? This will take a few seconds.')) {
        fetch('/api/get-groups', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.output) {
                    console.log('Groups Output:', data.output);
                }
                setTimeout(refreshLogs, 2000);
            })
            .catch(err => {
                alert('Error getting groups');
                console.error(err);
            });
    }
}

function refreshLogs() {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-spinner fa-spin me-2"></i> Loading logs...</div>';

    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
            container.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${data.logs}</pre>`;
        })
        .catch(err => {
            container.innerHTML = '<div class="text-danger">Error loading logs</div>';
            console.error(err);
        });
}

// Auto-refresh logs every 10 seconds
setInterval(refreshLogs, 10000);

// Reset form when modal closes
const modal = document.getElementById('addBirthdayModal');
if (modal) {
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('birthdayForm').reset();
        document.getElementById('birthdayIndex').value = '-1';
        document.getElementById('modalTitle').textContent = 'Add Birthday';
    });
}
