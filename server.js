const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// PostgreSQL Connection (SSL Disabled Completely)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=disable" // Disables SSL
});

app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "your_secure_secret";

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: "Access Denied" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user;
        next();
    });
};

// Login Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0) return res.status(400).json({ message: "User not found" });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.post("/contestants", authenticateToken, async (req, res) => {
    if (req.user.role !== "super_admin") return res.status(403).json({ message: "Access denied" });

    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Contestant name cannot be empty!" });
    }

    try {
        const result = await pool.query("INSERT INTO contestants (name) VALUES ($1) RETURNING *", [name.trim()]);
        res.json({ message: "Contestant added successfully", contestant: result.rows[0] });
    } catch (error) {
        console.error("Error adding contestant:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get All Contestants
app.get("/contestants", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM contestants ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching contestants:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete Contestant (Super Admin Only)
app.delete("/contestants/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "super_admin") return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;
    try {
        await pool.query("DELETE FROM contestants WHERE id = $1", [id]);
        res.json({ message: "Contestant deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Submit Score (Judges Only)
app.post("/scores", authenticateToken, async (req, res) => {
    if (req.user.role !== "judge") return res.status(403).json({ message: "Access denied" });

    const { contestant_id, taste, creativity, presentation } = req.body;

    if (!contestant_id || isNaN(taste) || isNaN(creativity) || isNaN(presentation)) {
        return res.status(400).json({ message: "Invalid input. All fields are required." });
    }

    try {
        // Check if the judge has already voted for this contestant
        const existingVote = await pool.query(
            "SELECT * FROM scores WHERE judge_id = $1 AND contestant_id = $2",
            [req.user.id, contestant_id]
        );

        if (existingVote.rows.length > 0) {
            return res.status(400).json({ message: "You have already voted for this contestant." });
        }

        await pool.query(
            "INSERT INTO scores (judge_id, contestant_id, taste, creativity, presentation) VALUES ($1, $2, $3, $4, $5)",
            [req.user.id, contestant_id, taste, creativity, presentation]
        );

        res.json({ message: "Score submitted successfully" });
    } catch (error) {
        console.error("Error submitting score:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Submit Score (Judges Only)
// app.post("/scores", authenticateToken, async (req, res) => {
//     if (req.user.role !== "judge") return res.status(403).json({ message: "Access denied" });

//     const { contestant_id, taste, creativity, presentation } = req.body;

//     if (!contestant_id || isNaN(taste) || isNaN(creativity) || isNaN(presentation)) {
//         return res.status(400).json({ message: "Invalid input. All fields are required." });
//     }

//     try {
//         // Check if the judge has already voted for this contestant
//         const existingVote = await pool.query(
//             "SELECT * FROM scores WHERE judge_id = $1 AND contestant_id = $2",
//             [req.user.id, contestant_id]
//         );

//         if (existingVote.rows.length > 0) {
//             return res.status(400).json({ message: "You have already voted for this contestant." });
//         }

//         const weightedScore = (taste * 0.4) + (creativity * 0.4) + (presentation * 0.2);

//         await pool.query(
//             "INSERT INTO scores (judge_id, contestant_id, taste, creativity, presentation, weighted_score) VALUES ($1, $2, $3, $4, $5, $6)",
//             [req.user.id, contestant_id, taste, creativity, presentation, weightedScore]
//         );

//         res.json({ message: "Score submitted successfully" });
//     } catch (error) {
//         console.error("Error submitting score:", error.message);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });


// // Submit Score (Judges Only)
// app.post("/scores", authenticateToken, async (req, res) => {
//     if (req.user.role !== "judge") return res.status(403).json({ message: "Access denied" });

//     const { contestant_id, taste, creativity, presentation } = req.body;

//     try {
//         const existingVote = await pool.query(
//             "SELECT * FROM scores WHERE judge_id = $1 AND contestant_id = $2",
//             [req.user.id, contestant_id]
//         );

//         if (existingVote.rows.length > 0) {
//             return res.status(400).json({ message: "You have already voted for this contestant." });
//         }

//         const weightedScore = (taste * 0.4) + (creativity * 0.4) + (presentation * 0.2);

//         await pool.query(
//             "INSERT INTO scores (judge_id, contestant_id, taste, creativity, presentation, weighted_score) VALUES ($1, $2, $3, $4, $5, $6)",
//             [req.user.id, contestant_id, taste, creativity, presentation, weightedScore]
//         );

//         res.json({ message: "Score submitted successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// // Get Leaderboard (Overall Scores)
// app.get("/leaderboard", authenticateToken, async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT c.name, ROUND(AVG(s.weighted_score) * 20, 2) AS avg_score 
//              FROM contestants c 
//              LEFT JOIN scores s ON c.id = s.contestant_id 
//              GROUP BY c.id 
//              ORDER BY avg_score DESC`
//         );

//         res.json(result.rows);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// Get Leaderboard (Overall Scores)
app.get("/leaderboard", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.name, 
                    COALESCE(ROUND(AVG(s.weighted_score) * 20, 2), 0) AS avg_score 
             FROM contestants c 
             LEFT JOIN scores s ON c.id = s.contestant_id 
             GROUP BY c.id 
             ORDER BY avg_score DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching leaderboard:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Get Judge-Specific Scores (Super Admin Only)
app.get("/judge-scores", authenticateToken, async (req, res) => {
    if (req.user.role !== "super_admin") return res.status(403).json({ message: "Access denied" });

    try {
        const result = await pool.query(
            `SELECT u.username AS judge, c.name AS contestant, 
                    s.taste, s.creativity, s.presentation, 
                    ROUND(s.weighted_score * 20, 2) AS score
             FROM scores s
             JOIN users u ON s.judge_id = u.id
             JOIN contestants c ON s.contestant_id = c.id
             ORDER BY judge, contestant`
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete All Judges' Votes (Super Admin Only)
app.delete("/reset-scores", authenticateToken, async (req, res) => {
    if (req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        await pool.query("DELETE FROM scores"); // Removes all votes

        res.json({ message: "All judges' votes have been deleted. Contestants can be voted for again." });
    } catch (error) {
        console.error("Error resetting scores:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
