
// Adjust this if your API route differs
const LEADERBOARD_API = "/api/leaderboard";

// Expected backend payload: an array of rows like
// [
//   {
//     username: "Alice",
//     points: 42,          // total points
//     correct: 12,         // number of correct picks (optional but recommended)
//     totalPicks: 20       // total picks (optional)
//   },
//   ...
// ]
//
// If your keys differ (e.g., userName, totalPoints, correctCount), just map them
// in the transformRows() function below.

async function fetchLeaderboard() {
    const res = await fetch(LEADERBOARD_API, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`Failed to load leaderboard: ${res.status}`);
    }
    return await res.json();
}

function transformRows(rows) {
    // Tweak this mapping to match your exact JSON keys
    return rows.map(r => ({
        player: r.username ?? r.user ?? r.name ?? "Unknown",
        points: Number(r.points ?? r.totalPoints ?? r.score ?? 0),
        correct: Number(r.correct ?? r.correctPicks ?? r.correctCount ?? 0),
        totalPicks: Number(r.totalPicks ?? r.picks ?? r.total ?? 0)
    }));
}

function upsertDataTable(data) {
    // Destroy any existing instance cleanly before re-init
    if ($.fn.dataTable.isDataTable('#leaderboardTable')) {
        $('#leaderboardTable').DataTable().clear().rows.add(data).draw();
        return;
    }

    const table = new DataTable('#leaderboardTable', {
        data,
        responsive: true,
        // Define columns and how to render
        columns: [
            {
                title: 'Rank',
                data: null,
                searchable: false,
                orderable: false,
                render: (data, type, row, meta) => meta.row + 1 // temporary; we fix after sort
            },
            { title: 'Player', data: 'player' },
            {
                title: 'Correct Picks',
                data: 'correct',
                className: 'dt-right',
                render: (v, t) => t === 'display' ? Number(v).toLocaleString() : Number(v)
            },
            {
                title: 'Points',
                data: 'points',
                className: 'dt-right',
                render: (v, t) => t === 'display' ? Number(v).toLocaleString() : Number(v)
            },
            {
                title: 'Total Picks',
                data: 'totalPicks',
                className: 'dt-right',
                render: (v, t) => t === 'display' ? Number(v).toLocaleString() : Number(v)
            }
        ],

        // Default sort by Points (desc). Points is column index 3 (0-based indexing)
        order: [[3, 'desc']],

        // Nice paging defaults; tweak if you prefer
        pageLength: 25,
        lengthMenu: [10, 25, 50, 100],

        // Preserve general search box and column sorting
        searching: true,
        ordering: true,
    });

    // Update Rank column after each order/search so ranks stay correct
    table.on('order.dt search.dt draw.dt', function () {
        let i = 1;
        table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function (cell) {
            cell.textContent = i++;
        });
    });
}

(async function init() {
    try {
        const raw = await fetchLeaderboard();
        const rows = transformRows(raw);
        upsertDataTable(rows);
    } catch (err) {
        console.error(err);
        // Optional: show a friendly toast/alert (SweetAlert2, etc.)
        if (window.Swal) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Could not load leaderboard.' });
        } else {
            alert('Could not load leaderboard.');
        }
    }
})();