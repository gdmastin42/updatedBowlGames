const BASE_URL = 'http://localhost:8000'

const bowlGames = [
    { id: 1, name: "Bahamas Bowl", team1: "Toledo", team2: "UAB", type: "traditional" },
    { id: 2, name: "Cure Bowl", team1: "App State", team2: "Miami (OH)", type: "traditional" },
    { id: 3, name: "New Orleans Bowl", team1: "Louisiana", team2: "Jacksonville State", type: "traditional" },
    { id: 4, name: "Myrtle Beach Bowl", team1: "Old Dominion", team2: "Western Kentucky", type: "traditional" },
    { id: 5, name: "Famous Idaho Potato Bowl", team1: "Utah State", team2: "Georgia State", type: "traditional" },
    { id: 6, name: "Boca Raton Bowl", team1: "South Florida", team2: "Syracuse", type: "traditional" },
    { id: 7, name: "New Mexico Bowl", team1: "UTEP", team2: "Fresno State", type: "traditional" },
    { id: 8, name: "LA Bowl", team1: "Boise State", team2: "UCLA", type: "traditional" },
    { id: 9, name: "Independence Bowl", team1: "California", team2: "UCF", type: "traditional" },
    { id: 10, name: "Gasparilla Bowl", team1: "Florida", team2: "Memphis", type: "traditional" },
    { id: 11, name: "Hawaii Bowl", team1: "San José State", team2: "Army", type: "traditional" },
    { id: 12, name: "Quick Lane Bowl", team1: "Minnesota", team2: "Northern Illinois", type: "traditional" },
    { id: 13, name: "Camellia Bowl", team1: "Troy", team2: "Ohio", type: "traditional" },
    { id: 14, name: "First Responder Bowl", team1: "Texas Tech", team2: "Tulane", type: "traditional" },
    { id: 15, name: "Birmingham Bowl", team1: "Auburn", team2: "Marshall", type: "traditional" },
    { id: 16, name: "Guaranteed Rate Bowl", team1: "Kansas", team2: "Boston College", type: "traditional" },
    { id: 17, name: "Military Bowl", team1: "Navy", team2: "Pittsburgh", type: "traditional" },
    { id: 18, name: "Duke's Mayo Bowl", team1: "NC State", team2: "Kentucky", type: "traditional" },
    { id: 19, name: "Holiday Bowl", team1: "Louisville", team2: "Arizona", type: "traditional" },
    { id: 20, name: "Texas Bowl", team1: "Oklahoma State", team2: "Texas A&M", type: "traditional" },
    { id: 21, name: "Fenway Bowl", team1: "Virginia Tech", team2: "Cincinnati", type: "traditional" },
    { id: 22, name: "Pinstripe Bowl", team1: "Rutgers", team2: "West Virginia", type: "traditional" },
    { id: 23, name: "Pop-Tarts Bowl", team1: "Clemson", team2: "Iowa State", type: "traditional" },
    { id: 24, name: "Alamo Bowl", team1: "Oklahoma", team2: "Utah", type: "traditional" },
    { id: 25, name: "Gator Bowl", team1: "South Carolina", team2: "Notre Dame", type: "traditional" },
    { id: 26, name: "Sun Bowl", team1: "Virginia", team2: "USC", type: "traditional" },
    { id: 27, name: "Liberty Bowl", team1: "Mississippi State", team2: "Baylor", type: "traditional" },
    { id: 28, name: "Music City Bowl", team1: "Illinois", team2: "LSU", type: "traditional" },
    { id: 29, name: "Arizona Bowl", team1: "Wyoming", team2: "Ball State", type: "traditional" },
    { id: 30, name: "ReliaQuest Bowl", team1: "Wisconsin", team2: "Missouri", type: "traditional" },
    { id: 31, name: "Citrus Bowl", team1: "Iowa", team2: "Tennessee", type: "traditional" },
    { id: 32, name: "Cotton Bowl", team1: "Washington", team2: "SMU", type: "traditional" },
    { id: 33, name: "Las Vegas Bowl", team1: "Colorado", team2: "Washington State", type: "traditional" },
    { id: 34, name: "Armed Forces Bowl", team1: "Air Force", team2: "Houston", type: "traditional" },
    { id: 35, name: "TaxSlayer Gator Bowl", team1: "Duke", team2: "Arkansas", type: "traditional" },
    { id: 36, name: "CFP First Round Game 1", team1: "Ohio State (#9)", team2: "Miami (#8)", type: "playoff" },
    { id: 37, name: "CFP First Round Game 2", team1: "Indiana (#12)", team2: "Georgia (#5)", type: "playoff" },
    { id: 38, name: "CFP First Round Game 3", team1: "Ole Miss (#11)", team2: "Penn State (#6)", type: "playoff" },
    { id: 39, name: "CFP First Round Game 4", team1: "Missouri (#10)", team2: "Texas (#7)", type: "playoff" },
    { id: 40, name: "Sugar Bowl - Quarterfinal", team1: "Alabama (#4)", team2: "Winner of Game 37", type: "playoff" },
    { id: 41, name: "Fiesta Bowl - Quarterfinal", team1: "Oregon (#3)", team2: "Winner of Game 38", type: "playoff" },
    { id: 42, name: "Peach Bowl - Quarterfinal", team1: "Michigan (#2)", team2: "Winner of Game 39", type: "playoff" },
    { id: 43, name: "Orange Bowl - Quarterfinal", team1: "Ohio State (#1)", team2: "Winner of Game 36", type: "playoff" },
    { id: 44, name: "Rose Bowl - Semifinal", team1: "Fiesta Bowl Winner", team2: "Peach Bowl Winner", type: "semifinal" },
    { id: 45, name: "Cotton Bowl - Semifinal", team1: "Sugar Bowl Winner", team2: "Orange Bowl Winner", type: "semifinal" },
    { id: 46, name: "National Championship", team1: "Rose Bowl Winner", team2: "Cotton Bowl Winner", type: "championship" }
]

document.addEventListener('DOMContentLoaded', async () => {
    const teamLogos = await fetchTeamLogos()
    generateBowlGameCards(teamLogos)

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
        const chart = new ApexCharts(chartContainer, options)
        chart.render()

        document.getElementById('chartModalLabel').textContent = 'Leaderboard'
        const modal = new bootstrap.Modal(document.getElementById('chartModal'))
        modal.show()
    })

    document.getElementById('btnCheckGameResults')?.addEventListener('click', async (event) => {
        event.preventDefault()   // Prevents default button behavior
        event.stopPropagation()  // Stops the event from bubbling to other listeners
    
        const response = await fetch(`${BASE_URL}/api/gameResults`)
        const data = await response.json()
    
        const tableContainer = document.getElementById('chartContainer')
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
    
    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
        const formattedUsername = storedUsername.replace('_', ' ')
        const usernameElement = document.getElementById('txtUsername')
        if (usernameElement) {
            usernameElement.textContent = formattedUsername
        }
    } else {
        console.warn('No username found in localStorage')
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

function generateBowlGameCards(teamLogos) {
    const container = document.getElementById('divBowlGameContainer')
    if (!container) return

    bowlGames.forEach(game => {
        const gameCard = document.createElement('div')
        gameCard.className = 'col-md-6 col-lg-4 mb-3'

        let cardClass = 'card game-card h-100'
        if (game.type === 'playoff') cardClass += ' playoff-game'
        if (game.type === 'semifinal') cardClass += ' semifinal-game'
        if (game.type === 'championship') cardClass += ' championship-game'

        const team1Logo = teamLogos[game.team1] || ''
        const team2Logo = teamLogos[game.team2] || ''

        gameCard.innerHTML = `
        <div class="${cardClass}">
            <div class="card-header">${game.name}</div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="form-check d-flex align-items-center">
                        <input class="form-check-input me-2" type="radio" name="game${game.id}" id="game${game.id}-team1" value="${game.team1}" required>
                        <label class="form-check-label d-flex align-items-center" for="game${game.id}-team1">
                            ${team1Logo ? `<img src="${team1Logo}" alt="${game.team1} logo" class="me-2" style="width: 50px; height: 50px;">` : ''}
                            ${game.team1}
                        </label>
                    </div>
                    <div class="form-check d-flex align-items-center">
                        <input class="form-check-input me-2" type="radio" name="game${game.id}" id="game${game.id}-team2" value="${game.team2}">
                        <label class="form-check-label d-flex align-items-center" for="game${game.id}-team2">
                            ${team2Logo ? `<img src="${team2Logo}" alt="${game.team2} logo" class="me-2" style="width: 50px; height: 50px;">` : ''}
                            ${game.team2}
                        </label>
                    </div>
                </div>
            </div>
        </div>`

        container.appendChild(gameCard)
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
