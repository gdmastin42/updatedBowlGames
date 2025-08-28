const BASE_URL = ''

fetch(`${BASE_URL}/api/game-results`)
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('gameResultsContainer')
        data.forEach(game => {
        const gameDiv = document.createElement('div')
        gameDiv.className = 'card p-3 mb-3'
        gameDiv.innerHTML = `
            <h5>${game.game}</h5>
            <p><strong>Winner:</strong> <span class="text-success">${game.winner || 'N/A'}</span></p>
            <p><strong>Score:</strong> ${game.score || 'N/A'}</p>
        `
        container.appendChild(gameDiv)
        })
    })
    .catch(err => console.error('Error fetching game results:', err))