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

    const contestantSelect = document.getElementById("contestant");
    const leaderboardBody = document.getElementById("leaderboardBody");

    // Fetch and populate contestant list
    async function loadContestants() {
        try {
            const response = await fetch("https://chopitup-production.up.railway.app/contestants", {
                headers: { "Authorization": token },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch contestants");
            }

            const contestants = await response.json();
            contestantSelect.innerHTML = "<option value=''>Select a contestant</option>";

            if (contestants.length === 0) {
                alert("No contestants found. Super Admin must add contestants first.");
            }

            contestants.forEach((contestant) => {
                const option = document.createElement("option");
                option.value = contestant.id;
                option.textContent = contestant.name;
                contestantSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading contestants:", error);
        }
    }

    // Fetch and display leaderboard
    async function loadLeaderboard() {
        try {
            const response = await fetch("https://chopitup-production.up.railway.app/leaderboard", {
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

    // Submit Score
    document.getElementById("scoreForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const contestant_id = document.getElementById("contestant").value;
        const taste = parseFloat(document.getElementById("taste").value);
        const creativity = parseFloat(document.getElementById("creativity").value);
        const presentation = parseFloat(document.getElementById("presentation").value);

        if (taste < 1 || taste > 5 || creativity < 1 || creativity > 5 || presentation < 1 || presentation > 5) {
            alert("Scores must be between 1 and 5.");
            return;
        }

        try {
            const response = await fetch("https://chopitup-production.up.railway.app/scores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
                body: JSON.stringify({ contestant_id, taste, creativity, presentation }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Score submitted successfully!");
                loadLeaderboard();
            } else {
                alert(result.message || "Error submitting score.");
            }
        } catch (error) {
            console.error("Error submitting score:", error);
        }
    });

    // Load contestants and leaderboard on page load
    await loadContestants();
    await loadLeaderboard();
});
