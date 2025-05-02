fetch('/api/leaderboard')
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('leaderboardTable')
        data.forEach((user, index) => {
        const row = document.createElement('tr')
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.score}</td>
        `
        table.appendChild(row)
        })
    })
    .catch(err => console.error('Error fetching leaderboard:', err))