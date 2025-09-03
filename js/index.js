// --- All Predictions DataTable logic ---
let predictionsDataTable = null;

async function loadAllPredictions() {
    document.getElementById('allPredictionsSection').style.display = 'block';
    if (predictionsDataTable) {
        predictionsDataTable.ajax.reload(null, false);
        return;
    }
    predictionsDataTable = new DataTable('#predictionsTable', {
        ajax: {
            url: '/api/predictions/full',
            dataSrc: ''
        },
        columns: [
            { data: 'username' },
            { data: 'gameName' },
            { data: 'team1' },
            { data: 'team2' },
            { data: 'predictedWinner' }
        ],
        pageLength: 25,
        order: [[0, 'asc'], [1, 'asc']],
        responsive: true
    });
}

document.getElementById('btnAllPredictions')?.addEventListener('click', () => {
    loadAllPredictions();
    const navbarCollapse = document.querySelector('.navbar-collapse.show');
    if (navbarCollapse) {
        new bootstrap.Collapse(navbarCollapse).hide();
    }
});
const BASE_URL = ''

// Handle login form submission
document.getElementById('frmLogin')?.addEventListener('submit', (event) => {
    event.preventDefault()

    const firstName = document.getElementById('txtFirstName').value.trim()
    const lastName = document.getElementById('txtLastName').value.trim()

    if (!firstName || !lastName) {
        Swal.fire('Error', 'First name and last name are required.', 'error')
        return
    }

    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`

    fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            Swal.fire('Error', data.error, 'error')
        } else {
            localStorage.setItem('username', username)
            localStorage.setItem('userID', data.userID) // Store userID for predictions
            window.location.href = 'predictions.html'
        }
    })
    .catch((err) => {
        console.error('Error during login:', err)
        Swal.fire('Error', 'An unexpected error occurred.', 'error')
    })
})