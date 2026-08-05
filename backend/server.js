const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection (replace with your database credentials)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'your_database_name',
  password: 'your_database_password',
  port: 5432,
});

// Signup Route
app.post('/api/register', async (req, res) => {
  const { username, email, phone, dob, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // 1. Check if the user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // 2. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save the new user to the database
    const newUser = await pool.query(
      `INSERT INTO users (username, email, phone, dob, password) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email`,
      [username || 'NewAgent', email, phone, dob, hashedPassword]
    );

    // 4. Send success response back to React
    res.status(201).json({
      message: "User registered successfully!",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Server error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(5000, () => {
  console.log("Backend server running on http://localhost:5000");
});