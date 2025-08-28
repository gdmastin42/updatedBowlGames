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
            window.location.href = 'predictions.html'
        }
    })
    .catch((err) => {
        console.error('Error during login:', err)
        Swal.fire('Error', 'An unexpected error occurred.', 'error')
    })
})