const BASE_URL = 'http://localhost:8000'
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

document.getElementById('btnBuildBracket')?.addEventListener('click', async () => {
    // Fetch all games and logos
    const response = await fetch(`${BASE_URL}/api/bowlGames`)
    const bowlGames = await response.json()
    const teamLogos = await fetchTeamLogos()

    // Get first round games in correct order
    const firstRoundGames = bowlGames
        .filter(game => game.gameName.includes("College Football Playoff First Round Game"))
        .sort((a, b) => {
            // Order: #12 vs #5, #9 vs #8, #11 vs #6, #10 vs #7
            const order = ["#12", "#9", "#11", "#10"];
            const getSeed = (game) => {
                const match = game.notes?.match(/#\d+/g);
                if (!match) return 99;
                return order.indexOf(match[0]);
            }
            return getSeed(a) - getSeed(b);
        });

    // Helper for ranked name
    const extractRankedName = (team, notes) => {
        if (!notes) return team;
        const regex = new RegExp(`#\\d+\\s+${team}`);
        const match = notes.match(regex);
        return match ? match[0] : team;
    };

    // Helper for logo (50x50, matches bowl game selections)
    const getLogo = (team) =>
        teamLogos[team] ? `<img src="${teamLogos[team]}" alt="${team} logo" class="me-2" style="width: 50px; height: 50px;">` : '';

    // hard codded first round matchups for simplicity
    const firstRoundMatchups = [
        { team1: { name: "Clemson", rank: 12 }, team2: { name: "Texas", rank: 5 } },
        { team1: { name: "Tennessee", rank: 9 }, team2: { name: "Ohio State", rank: 8 } },
        { team1: { name: "SMU", rank: 11 }, team2: { name: "Penn State", rank: 6 } },
        { team1: { name: "Indiana", rank: 10 }, team2: { name: "Notre Dame", rank: 7 } }
    ];

    // Manually set the top 4 seeds here:
    // since the api does not provide this information
    const topSeeds = [
        { name: "Arizona State", rank: 4 },
        { name: "Oregon", rank: 1 },
        { name: "Boise State", rank: 3 },
        { name: "Georgia", rank: 2 }
    ];

    // Build static bracket HTML
    let bracketHtml = `
    <div class="bracket-container">
      <div class="bracket-round">
        <h6 class="text-center text-dark mb-3">First Round</h6>
        ${firstRoundMatchups.map((game, i) => `
          <div class="bracket-matchup">
            <div class="team">${getLogo(game.team1.name)}#${game.team1.rank} ${game.team1.name}</div>
            <div class="team">${getLogo(game.team2.name)}#${game.team2.rank} ${game.team2.name}</div>
          </div>
        `).join('')}
      </div>
      <div class="bracket-round">
        <h6 class="text-center text-dark mb-3">Quarterfinals</h6>
        ${topSeeds.map((seed, i) => {
            const game = firstRoundMatchups[i];
            return `
              <div class="bracket-matchup">
                  <div class="team">${getLogo(seed.name)}#${seed.rank} ${seed.name}</div>
                  <div class="custom-dropdown" data-qf="${i}">
                    <div class="dropdown-selected">Pick Winner</div>
                    <div class="dropdown-list">
                      <div class="dropdown-item d-flex align-items-center" data-value="${game.team1.name}">
                        <span class="me-2" style="width:50px; height:50px; display:inline-block;">
                          ${getLogo(game.team1.name)}
                        </span>
                        <span style="font-weight:bold;">#${game.team1.rank} ${game.team1.name}</span>
                      </div>
                      <div class="dropdown-item d-flex align-items-center" data-value="${game.team2.name}">
                        <span class="me-2" style="width:50px; height:50px; display:inline-block;">
                          ${getLogo(game.team2.name)}
                        </span>
                        <span style="font-weight:bold;">#${game.team2.rank} ${game.team2.name}</span>
                      </div>
                    </div>
                  </div>
              </div>
            `;
        }).join('')}
      </div>
      <div class="bracket-round">
        <h6 class="text-center text-dark mb-3">Semifinals</h6>
        <div class="bracket-matchup">
            <select class="form-select mt-2 bracket-semi-select" data-sf="0">
                <option value="">Pick Winner</option>
            </select>
        </div>
        <div class="bracket-matchup">
            <select class="form-select mt-2 bracket-semi-select" data-sf="1">
                <option value="">Pick Winner</option>
            </select>
        </div>
      </div>
      <div class="bracket-round">
        <h6 class="text-center text-dark mb-3">National Title</h6>
        <div class="bracket-matchup">
            <select class="form-select mt-2 bracket-final-select">
                <option value="">Pick Winner</option>
            </select>
        </div>
      </div>
    </div>
    `;

    document.getElementById('bracketContainer').innerHTML = bracketHtml;

    // --- Bracket logic: advance winners to next round ---

    // Helper: get the selected value/text from a custom dropdown
    function getDropdownValue(dropdown) {
        return dropdown.querySelector('.dropdown-selected').dataset.value || '';
    }
    function getDropdownText(dropdown) {
        return dropdown.querySelector('.dropdown-selected').textContent || '';
    }

    const semiSelects = document.querySelectorAll('.bracket-semi-select');
    const finalSelect = document.querySelector('.bracket-final-select');

    function updateSemifinals() {
        // SF1: QF0 vs QF1, SF2: QF2 vs QF3
        const qfDropdowns = document.querySelectorAll('.custom-dropdown[data-qf]');
        for (let i = 0; i < 2; i++) {
            const sfSel = semiSelects[i];
            sfSel.innerHTML = '<option value="">Pick Winner</option>';
            for (let j = 0; j < 2; j++) {
                const qfIdx = i * 2 + j;
                const qfDropdown = qfDropdowns[qfIdx];
                const val = getDropdownValue(qfDropdown);
                const txt = getDropdownText(qfDropdown);
                if (val) {
                    // Find logo for this team
                    const logoHtml = getLogo(val);
                    // Create a new option with logo as HTML
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.innerHTML = `${logoHtml}${txt}`;
                    sfSel.appendChild(opt);
                }
            }
        }
        updateFinal();
    }

    function updateFinal() {
        finalSelect.innerHTML = '<option value="">Pick Winner</option>';
        semiSelects.forEach(sel => {
            if (sel.value) {
                // Find logo for this team
                const logoHtml = getLogo(sel.value);
                // Use the selected option's text (which already includes logo and name)
                const opt = document.createElement('option');
                opt.value = sel.value;
                // Use the selected option's innerHTML for logo+name
                opt.innerHTML = sel.options[sel.selectedIndex].innerHTML;
                finalSelect.appendChild(opt);
            }
        });
    }

    // Attach listeners to custom dropdowns and semifinals
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.dropdown-selected');
        const list = dropdown.querySelector('.dropdown-list');
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('open');
        });
        list.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                selected.innerHTML = item.innerHTML;
                selected.dataset.value = item.dataset.value;
                dropdown.classList.remove('open');
                updateSemifinals(); // <-- update semifinals when a QF pick is made
            });
        });
        // Optional: close dropdown if clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    });

    semiSelects.forEach(sel => sel.addEventListener('change', updateFinal));

    // Initialize semifinals/final on modal open
    updateSemifinals();

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('bracketModal'));
    modal.show();
});
