document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html"; // Redirect if not logged in
        return;
    }

    // Logout functionality
    document.getElementById("logout").addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    const contestantList = document.getElementById("contestantList");
    const leaderboardBody = document.getElementById("leaderboardBody");
    const judgeScoresBody = document.getElementById("judgeScoresBody");

    // Fetch and display all contestants
    async function loadContestants() {
        try {
            const response = await fetch("http://localhost:5000/contestants", {
                headers: { "Authorization": token },
            });

            const contestants = await response.json();
            contestantList.innerHTML = "";

            contestants.forEach((contestant) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${contestant.name}</td>
                    <td><button class="btn btn-danger delete-btn" data-id="${contestant.id}">Delete</button></td>
                `;
                contestantList.appendChild(row);
            });

            document.querySelectorAll(".delete-btn").forEach((button) => {
                button.addEventListener("click", async function () {
                    const contestantId = this.getAttribute("data-id");
                    await deleteContestant(contestantId);
                    loadContestants();
                });
            });
        } catch (error) {
            console.error("Error loading contestants:", error);
        }
    }

    // Delete Contestant
    async function deleteContestant(contestantId) {
        try {
            await fetch(`http://localhost:5000/contestants/${contestantId}`, {
                method: "DELETE",
                headers: { "Authorization": token },
            });
            loadContestants();
        } catch (error) {
            console.error("Error deleting contestant:", error);
        }
    }

    // Fetch and display leaderboard
    async function loadLeaderboard() {
        try {
            const response = await fetch("http://localhost:5000/leaderboard", {
                headers: { "Authorization": token },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard");
            }

            const leaderboard = await response.json();

            if (!Array.isArray(leaderboard)) {
                throw new Error("Invalid leaderboard data format");
            }

            leaderboardBody.innerHTML = "";
            leaderboard.forEach((entry, index) => {
                const row = `<tr><td>${index + 1}</td><td>${entry.name}</td><td>${entry.avg_score}%</td></tr>`;
                leaderboardBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error loading leaderboard:", error);
        }
    }

    // Fetch and display judge-specific scores
    async function loadJudgeScores() {
        try {
            const response = await fetch("http://localhost:5000/judge-scores", {
                headers: { "Authorization": token },
            });

            const judgeScores = await response.json();
            judgeScoresBody.innerHTML = "";

            judgeScores.forEach((entry) => {
                const row = `
                    <tr>
                        <td>${entry.judge}</td>
                        <td>${entry.contestant}</td>
                        <td>${entry.taste}</td>
                        <td>${entry.creativity}</td>
                        <td>${entry.presentation}</td>
                        <td>${entry.score}%</td>
                    </tr>
                `;
                judgeScoresBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error loading judge scores:", error);
        }
    }

    // Add Contestant
    document.getElementById("addContestantForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("contestantName").value;
        try {
            await fetch("http://localhost:5000/contestants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
                body: JSON.stringify({ name }),
            });

            document.getElementById("contestantName").value = "";
            loadContestants();
        } catch (error) {
            console.error("Error adding contestant:", error);
        }
    });

    // Load all data on page load
    await loadContestants();
    await loadLeaderboard();
    await loadJudgeScores();
});
