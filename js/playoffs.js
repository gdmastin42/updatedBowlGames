const BASE_URL = '';
const PLACEHOLDER_LOGO = "/img/placeholder.jpg";
let teamLogos = {};

document.addEventListener("DOMContentLoaded", async () => {
    // Fill username
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
        const formatted = storedUsername.replace("_", " ");
        const usernameElement = document.getElementById("txtUsername");
        if (usernameElement) usernameElement.textContent = formatted;
    } else {
        // If no username found, return to login
        window.location.href = "index.html";
        return;
    }

    teamLogos = await fetchTeamLogos();
    generateBracket();
    enableAutoAdvance();
});

async function fetchTeamLogos() {
    try {
        const keyResponse = await fetch(`${BASE_URL}/api/key`);
        const { apiKey } = await keyResponse.json();

        const response = await fetch("https://apinext.collegefootballdata.com/teams/fbs", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const teams = await response.json();
        const logos = {};

        teams.forEach(team => {
            logos[team.school] = team.logos?.[0] || "";
        });

        return logos;
    } catch (err) {
        console.error("Failed to fetch team logos:", err);
        return {};
    }
}

function generateBracket() {
    const container = document.getElementById("bracketContainer");

    const teams = [
        "1. Michigan",
        "2. Washington",
        "3. Texas",
        "4. Alabama",
        "5. Florida State",
        "6. Georgia",
        "7. Ohio State",
        "8. Oregon",
        "9. Penn State",
        "10. Ole Miss",
        "11. Missouri",
        "12. Oklahoma"
    ];

    container.innerHTML = `
        <div class="row">

            <!-- ROUND 1 -->
            <div class="col-md-4 bracket-round">
                <h4>Round 1</h4>
                ${makeMatch("r1-g1", teams[4], teams[11])}  <!-- 5 vs 12 -->
                ${makeMatch("r1-g2", teams[5], teams[10])}  <!-- 6 vs 11 -->
                ${makeMatch("r1-g3", teams[6], teams[9])}   <!-- 7 vs 10 -->
                ${makeMatch("r1-g4", teams[7], teams[8])}   <!-- 8 vs 9 -->
            </div>

            <!-- QUARTERFINALS -->
            <div class="col-md-4 bracket-round">
                <h4>Quarterfinals</h4>
                ${makeMatch("r2-g1", teams[3], "Winner: r1-g1")}
                ${makeMatch("r2-g2", teams[2], "Winner: r1-g2")}
                ${makeMatch("r2-g3", teams[1], "Winner: r1-g3")}
                ${makeMatch("r2-g4", teams[0], "Winner: r1-g4")}
            </div>

            <!-- SEMIS + CHAMPIONSHIP -->
            <div class="col-md-4 bracket-round">
                <h4>Semifinals</h4>
                ${makeMatch("r3-g1", "Winner: r2-g1", "Winner: r2-g2")}
                ${makeMatch("r3-g2", "Winner: r2-g3", "Winner: r2-g4")}

                <h4 class="mt-5">Championship</h4>
                ${makeMatch("r4-g1", "Winner: r3-g1", "Winner: r3-g2")}
            </div>
        </div>
    `;
}

function makeMatch(id, team1, team2) {
    const cleanTeam1 = isPlaceholder(team1) ? "TBD" : team1;
    const cleanTeam2 = isPlaceholder(team2) ? "TBD" : team2;

    const logo1 = `<img 
        src="${isPlaceholder(team1) ? "" : resolveLogo(team1)}"
        class="me-2 team1-img"
        style="width: 50px; height: 50px; display:${isPlaceholder(team1) ? "none" : "inline-block"};"
    >`;

    const logo2 = `<img 
        src="${isPlaceholder(team2) ? "" : resolveLogo(team2)}"
        class="me-2 team2-img"
        style="width: 50px; height: 50px; display:${isPlaceholder(team2) ? "none" : "inline-block"};"
    >`;

    return `
        <div class="team-card" data-match="${id}">
            
            <label class="team-row d-flex align-items-center">
                <input type="radio" name="${id}" value="${cleanTeam1}">
                ${logo1}
                <span class="team1-label">${cleanTeam1}</span>
            </label>

            <label class="team-row d-flex align-items-center">
                <input type="radio" name="${id}" value="${cleanTeam2}">
                ${logo2}
                <span class="team2-label">${cleanTeam2}</span>
            </label>

        </div>
    `;
}

function isPlaceholder(team) {
    return team.startsWith("Winner:");
}

function resolveLogo(teamStr) {
    // If teamStr starts with number "6. Georgia"
    if (teamStr.includes(".")) {
        teamStr = teamStr.substring(teamStr.indexOf(".") + 2);
    }
    // Trim to clean name
    const name = teamStr.trim();
    return teamLogos[name] || "";
}

function enableAutoAdvance() {
    document.querySelectorAll("input[type='radio']").forEach(radio => {
        radio.addEventListener("change", (e) => {
            updateNextRounds(e.target.name, e.target.value);
        });
    });
}

const nextMap = {
    "r1-g1": { next: "r2-g1", slot: "team2" },
    "r1-g2": { next: "r2-g2", slot: "team2" },
    "r1-g3": { next: "r2-g3", slot: "team2" },
    "r1-g4": { next: "r2-g4", slot: "team2" },

    "r2-g1": { next: "r3-g1", slot: "team1" },
    "r2-g2": { next: "r3-g1", slot: "team2" },
    "r2-g3": { next: "r3-g2", slot: "team1" },
    "r2-g4": { next: "r3-g2", slot: "team2" },

    "r3-g1": { next: "r4-g1", slot: "team1" },
    "r3-g2": { next: "r4-g1", slot: "team2" }
};

function updateNextRounds(matchID, winner) {
    if (!nextMap[matchID]) return;

    const { next, slot } = nextMap[matchID];

    const card = document.querySelector(`[data-match='${next}']`);
    const label = card.querySelector(`.${slot}-label`);
    const img = card.querySelector(`.${slot}-img`);

    const logo = resolveLogo(winner);

    // Update logo correctly
    if (logo) {
        img.src = logo;
        img.style.display = "inline-block";
    } else {
        img.style.display = "none";
    }

    // Update label text
    label.textContent = winner;

    // Update radio value by slot position
    const radios = card.querySelectorAll(`input[name='${next}']`);
    const index = slot === "team1" ? 0 : 1;
    radios[index].value = winner;
}

function getMatchTeams(matchID) {
    const card = document.querySelector(`[data-match='${matchID}']`);
    const team1 = card.querySelector(".team1-label").textContent;
    const team2 = card.querySelector(".team2-label").textContent;
    return { team1, team2 };
}

document.getElementById("btnSubmitBracket").addEventListener("click", async () => {
    const userID = localStorage.getItem("userID");

    if (!userID) {
        Swal.fire("Error", "You must log in first.", "error");
        return;
    }

    const picks = [];
    document.querySelectorAll("input[type='radio']:checked").forEach(input => {
        const matchID = input.name;
        const { team1, team2 } = getMatchTeams(matchID);

        let prefix = "";
        if (matchID.startsWith("r1")) prefix = "r1";
        else if (matchID.startsWith("r2")) prefix = "qf";
        else if (matchID.startsWith("r3")) prefix = "sf";
        else if (matchID.startsWith("r4")) prefix = "champ";

        const readableName = `${prefix}-${team1} vs ${team2}`;

        picks.push({
            gameName: readableName,
            winner: input.value
        });
    });

    if (picks.length < 7) {
        Swal.fire("Error", "You must complete the bracket!", "warning");
        return;
    }

    const response = await fetch(`${BASE_URL}/api/playoffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, predictions: picks })
    });

    const data = await response.json();

    if (!response.ok) {
        Swal.fire("Error", data.error || "Submission failed.", "error");
        return;
    }

    Swal.fire("Success", "Playoff bracket submitted!", "success");
});