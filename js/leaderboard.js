
fetch('/api/leaderboard')
    .then(r => r.json())
    .then(data => {
        const table = document.getElementById('leaderboardTable')
        data.forEach((user, index) => {
            const [first, last] = (user.username || '').split('_')
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${first ?? ''}</td>
                <td>${last ?? ''}</td>
                <td>${user.score ?? 0}</td>
            `
            table.appendChild(row)
        })
    })
    .catch(err => console.error('Error fetching leaderboard:', err))