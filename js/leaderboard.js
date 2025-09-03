const LEADERBOARD_API = "/api/leaderboard";

async function fetchLeaderboard() {
    const res = await fetch(LEADERBOARD_API, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`Failed to load leaderboard: ${res.status}`);
    }
    return res.json();
}

function transformRows(rows) {
  // Tweak this mapping to match your exact JSON keys
    return rows.map((r) => ({
        player: r.username ?? r.user ?? r.name ?? "Unknown",
        points: Number(r.points ?? r.totalPoints ?? r.score ?? 0),
        correct: Number(r.correct ?? r.correctPicks ?? r.correctCount ?? 0),
        totalPicks: Number(r.totalPicks ?? r.picks ?? r.total ?? 0),
    }));
}

function upsertDataTable(data) {
    const tableEl = "#leaderboardTable";

    // If an instance already exists, refresh it
    if ($.fn.dataTable.isDataTable(tableEl)) {
        const dt = $(tableEl).DataTable();
        dt.clear();
        dt.rows.add(data);
        dt.order([[3, "desc"]]); // ensure default order stays points desc on refresh
        dt.draw();
        return dt;
    }

  // Initialize new DataTable
    const dt = new DataTable(tableEl, {
        data,
        responsive: true,
        columns: [
        {
            title: "Rank",
            data: null,
            searchable: false,
            orderable: false,
            render: (data, type, row, meta) => meta.row + 1, // temporary; fixed after sort/search
        },
        { title: "Player", data: "player" },
        {
            title: "Correct Picks",
            data: "correct",
            className: "dt-right",
            render: (v, t) => (t === "display" ? Number(v).toLocaleString() : Number(v)),
        },
        {
            title: "Points",
            data: "points",
            className: "dt-right",
            render: (v, t) => (t === "display" ? Number(v).toLocaleString() : Number(v)),
        },
        {
            title: "Total Picks",
            data: "totalPicks",
            className: "dt-right",
            render: (v, t) => (t === "display" ? Number(v).toLocaleString() : Number(v)),
        },
    ],

    // Default sort by Points (desc). Points is column index 3 in the above array
    order: [[3, "desc"]],

    // Paging & length controls
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100],

    // Keep global search input and column sorting enabled
    searching: true,
    ordering: true,
});

  // Update Rank column after each order/search/draw so ranks stay correct
    dt.on("order.dt search.dt draw.dt", function () {
        let i = 1;
        dt.column(0, { search: "applied", order: "applied" })
        .nodes()
        .each(function (cell) {
            cell.textContent = i++;
        });
    });
    return dt;
    }

async function initLeaderboard() {
    try {
        const raw = await fetchLeaderboard();
        const rows = transformRows(raw);
        upsertDataTable(rows);
    } catch (err) {
            console.error(err);
        if (window.Swal) {
            Swal.fire({ icon: "error", title: "Oops...", text: "Could not load leaderboard." });
        } else {
            alert("Could not load leaderboard.");
        }
    }
}

// Run when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLeaderboard);
} else {
    initLeaderboard();
}
