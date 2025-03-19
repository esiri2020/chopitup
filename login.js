const API_BASE_URL = "http://chopitup-production.up.railway.app"; // Backend hosted on Railway

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);

                if (data.role === "super_admin") {
                    window.location.href = "super_admin_dashboard.html";
                } else if (data.role === "judge") {
                    window.location.href = "judge_dashboard.html";
                }
            } else {
                document.getElementById("errorMessage").textContent = data.message || "Login failed.";
                document.getElementById("errorMessage").style.display = "block";
            }
        } catch (error) {
            console.error("Error logging in:", error);
            document.getElementById("errorMessage").textContent = "Cannot connect to the server. Make sure it is running.";
            document.getElementById("errorMessage").style.display = "block";
        }
    });
});
