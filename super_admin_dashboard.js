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
            const response = await fetch("https://chopitup-production.up.railway.app/contestants", {
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
            await fetch(`https://chopitup-production.up.railway.app/contestants/${contestantId}`, {
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
            const response = await fetch("https://chopitup-production.up.railway.app/leaderboard", {
                headers: { "Authorization": token },
            });

            const leaderboard = await response.json();
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
            const response = await fetch("https://chopitup-production.up.railway.app/judge-scores", {
                headers: { "Authorization": token },
            });

            const judgeScores = await response.json();
            judgeScoresBody.innerHTML = "";

            judgeScores.forEach((entry) => {
                const totalScore = entry.score ?? 0; // Fix for undefined scores
                const row = `
                    <tr>
                        <td>${entry.judge}</td>
                        <td>${entry.contestant}</td>
                        <td>${entry.taste}</td>
                        <td>${entry.creativity}</td>
                        <td>${entry.presentation}</td>
                        <td>${totalScore}%</td>
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
            await fetch("https://chopitup-production.up.railway.app/contestants", {
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

    document.getElementById("resetScores").addEventListener("click", async function () {
        if (!confirm("Are you sure you want to reset all judges' votes? This will also reset the leaderboard.")) {
            return;
        }
    
        try {
            const response = await fetch("https://chopitup-production.up.railway.app/reset-scores", {
                method: "DELETE",
                headers: { "Authorization": token },
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert("All votes and leaderboard scores have been reset!");
                loadLeaderboard(); // Refresh leaderboard
                loadJudgeScores(); // Refresh judge-specific scores
            } else {
                alert(result.message || "Error resetting votes.");
            }
        } catch (error) {
            console.error("Error resetting scores:", error);
        }
    });
    

    // Load all data on page load
    loadContestants();
    loadLeaderboard();
    loadJudgeScores();
});
