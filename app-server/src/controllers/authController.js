const db = require('../config/db');
const bcrypt = require('bcryptjs');

// REGISTER USER
exports.signup = async (req, res) => {
  const { username, email, phone, dob, password } = req.body;

  try {
    // Check if user already exists
    const userCheck = await db.query(
      'SELECT * FROM "User" WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username or Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await db.query(
      `INSERT INTO "User" (username, email, phone, dob, password) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, phone, dob, "avatarUrl", "createdAt"`,
      [username, email, phone, dob, hashedPassword]
    );

    const user = newUser.rows[0];

    // Create default "Standard Vault" for new user
    await db.query(
      'INSERT INTO "Vault" (name, pin, "userId") VALUES ($1, $2, $3)',
      ['Standard Vault', '1234', user.id]
    );

    return res.status(201).json(user);
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const userRes = await db.query(
      'SELECT * FROM "User" WHERE email = $1 OR username = $2',
      [identifier, identifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password credentials' });
    }

    delete user.password;
    return res.json(user);
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};