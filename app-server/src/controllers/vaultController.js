const db = require('../config/db');

// GET ALL VAULTS FOR A USER
exports.getVaults = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const vaults = await db.query(
      'SELECT * FROM "Vault" WHERE "userId" = $1 ORDER BY "createdAt" ASC',
      [userId]
    );
    return res.json(vaults.rows);
  } catch (err) {
    console.error('Get Vaults Error:', err);
    return res.status(500).json({ error: 'Failed to fetch vaults' });
  }
};

// CREATE A NEW VAULT
exports.createVault = async (req, res) => {
  const { name, pin, userId } = req.body;

  try {
    const newVault = await db.query(
      'INSERT INTO "Vault" (name, pin, "userId") VALUES ($1, $2, $3) RETURNING *',
      [name, pin, userId]
    );
    return res.status(201).json(newVault.rows[0]);
  } catch (err) {
    console.error('Create Vault Error:', err);
    return res.status(500).json({ error: 'Failed to create vault' });
  }
};

// DELETE A VAULT
exports.deleteVault = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM "Vault" WHERE id = $1', [id]);
    return res.json({ message: 'Vault deleted successfully' });
  } catch (err) {
    console.error('Delete Vault Error:', err);
    return res.status(500).json({ error: 'Failed to delete vault' });
  }
};