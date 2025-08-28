const BASE_URL = ''
let currentChart = null

document.addEventListener('DOMContentLoaded', async () => {
    const teamLogos = await fetchTeamLogos()

    // Fetch bowl games from backend
    const response = await fetch(`${BASE_URL}/api/bowlGames`)
    const bowlGames = await response.json()

    generateBowlGameCards(bowlGames, teamLogos)

    document.getElementById('btnLeaderboard')?.addEventListener('click', () => {
        window.location.href = 'leaderboard.html'
    })

    document.getElementById('btnGameResults')?.addEventListener('click', (event) => {
        event.preventDefault()
        window.location.href = 'gameResults.html'
    })

    document.getElementById('btnViewLeaderboard')?.addEventListener('click', async (event) => {
        event.preventDefault() 

        const response = await fetch(`${BASE_URL}/api/leaderboard`) 
        const data = await response.json() 

        const categories = data.map(user => user.username.replace('_', ' ')) 
        const scores = data.map(user => user.score) 

        const options = {
            chart: {
                type: 'bar',
                height: 350
            },
            series: [
                {
                    name: 'Correct Predictions',
                    data: scores
                }
            ],
            xaxis: {
                categories
            },
            title: {
                text: 'Leaderboard',
                align: 'center'
            }
        } 

        const chartContainer = document.getElementById('chartContainer') 
        chartContainer.innerHTML = '' 
        if (currentChart) {
            currentChart.destroy() 
            currentChart = null 
        }
        currentChart = new ApexCharts(chartContainer, options) 
        currentChart.render() 

        document.getElementById('chartModalLabel').textContent = 'Leaderboard' 
        const modal = new bootstrap.Modal(document.getElementById('chartModal')) 
        modal.show() 
    })

    document.getElementById('btnCheckGameResults')?.addEventListener('click', async (event) => {
        event.preventDefault() 
        event.stopPropagation() 

        const response = await fetch(`${BASE_URL}/api/gameResults`)
        const data = await response.json()

        const tableContainer = document.getElementById('chartContainer')
        tableContainer.innerHTML = ''
        if (currentChart) {
            currentChart.destroy() 
            currentChart = null 
        }
        tableContainer.innerHTML = `
            <table id="gameResultsTable" class="display" style="width:100%">
                <thead>
                    <tr>
                        <th>Team 1</th>
                        <th>Team 2</th>
                        <th>Winner</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(game => `
                        <tr>
                            <td>${game.team1}</td>
                            <td>${game.team2}</td>
                            <td>${game.winner || 'N/A'}</td>
                            <td>${game.score || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `

        $('#gameResultsTable').DataTable()

        document.getElementById('chartModalLabel').textContent = 'Game Results'
        const modal = new bootstrap.Modal(document.getElementById('chartModal'))
        modal.show()
    })
    
    // Destroy chart when modal is hidden
    $('#chartModal').on('hidden.bs.modal', function () {
        if (currentChart) {
            currentChart.destroy() 
            currentChart = null 
        }
    }) 

    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
        const formattedUsername = storedUsername.replace('_', ' ')
        const usernameElement = document.getElementById('txtUsername')
        if (usernameElement) {
            usernameElement.textContent = formattedUsername
        }
    } else {
        window.location.href = 'index.html'
    }
})

async function fetchTeamLogos() {
    try {
        const keyResponse = await fetch(`${BASE_URL}/api/key`)
        const { apiKey } = await keyResponse.json()

        const response = await fetch("https://apinext.collegefootballdata.com/teams/fbs", {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const teams = await response.json()

        const logos = {}
        teams.forEach(team => {
            logos[team.school] = team.logos?.[0] || ""
        })
        return logos
    } catch (err) {
        console.error("Failed to fetch team logos:", err)
        return {}
    }
}

// Update generateBowlGameCards to accept bowlGames as first argument
function generateBowlGameCards(bowlGames, teamLogos) {
    const container = document.getElementById('divBowlGameContainer')
    if (!container) return

    container.innerHTML = ''

    // Only show games that are NOT playoff games
    const traditionalGames = bowlGames.filter(
        game => !game.gameName.includes("College Football Playoff")
    )

    traditionalGames.forEach(game => {
        // Create the column wrapper for spacing
        const col = document.createElement('div')
        col.className = 'col-12 col-md-6 col-lg-4 mb-4'

        // Create the card
        const card = document.createElement('div')
        card.className = 'card game-card h-100 p-3'

        // Game name/title
        const gameTitle = document.createElement('h5')
        gameTitle.className = 'text-left-3'
        gameTitle.textContent = game.gameName
        card.appendChild(gameTitle)

        // Team logos and radio buttons
        const team1Logo = teamLogos[game.team1] || ''
        const team2Logo = teamLogos[game.team2] || ''

        card.innerHTML += `
            <div class="card-body">
                <div class="mb-3">
                    <div class="form-check d-flex align-items-center">
                        <input class="form-check-input me-2" type="radio" name="game${game.gameID}" id="game${game.gameID}-team1" value="${game.team1}" required>
                        <label class="form-check-label d-flex align-items-center" for="game${game.gameID}-team1">
                            ${team1Logo ? `<img src="${team1Logo}" alt="${game.team1} logo" class="me-2" style="width: 50px; height: 50px;">` : ''}
                            ${game.team1}
                        </label>
                    </div>
                    <div class="form-check d-flex align-items-center">
                        <input class="form-check-input me-2" type="radio" name="game${game.gameID}" id="game${game.gameID}-team2" value="${game.team2}">
                        <label class="form-check-label d-flex align-items-center" for="game${game.gameID}-team2">
                            ${team2Logo ? `<img src="${team2Logo}" alt="${game.team2} logo" class="me-2" style="width: 50px; height: 50px;">` : ''}
                            ${game.team2}
                        </label>
                    </div>
                </div>
            </div>
        `

        col.appendChild(card)
        container.appendChild(col)
    })
}

document.getElementById('frmPredictions')?.addEventListener('submit', (event) => {
    event.preventDefault()

    const userID = localStorage.getItem('userID')
    if (!userID) {
        Swal.fire('Error', 'You must log in first.', 'error')
        return
    }

    const predictions = []
    document.querySelectorAll('#divBowlGameContainer input[type="radio"]:checked').forEach((input) => {
        predictions.push({ gameID: input.name.replace('game', ''), predictedWinner: input.value })
    })

    fetch(`${BASE_URL}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, predictions })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            Swal.fire('Error', data.error, 'error')
        } else {
            Swal.fire('Success', 'Predictions submitted successfully!', 'success')
        }
    })
    .catch(err => {
        console.error('Error during prediction submission:', err)
        Swal.fire('Error', 'An unexpected error occurred.', 'error')
    })
})
