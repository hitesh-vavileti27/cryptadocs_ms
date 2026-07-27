const db = require('../config/db');

// SAVE DOCUMENT TO VAULT
exports.saveDocument = async (req, res) => {
  const { title, size, hash, content, vaultId } = req.body;

  try {
    const newDoc = await db.query(
      `INSERT INTO "Document" (title, size, hash, content, "vaultId") 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, size, hash, content, vaultId]
    );
    return res.status(201).json(newDoc.rows[0]);
  } catch (err) {
    console.error('Save Document Error:', err);
    return res.status(500).json({ error: 'Failed to save document' });
  }
};

// GET DOCUMENTS FOR A VAULT
exports.getVaultDocuments = async (req, res) => {
  const { vaultId } = req.params;

  try {
    const docs = await db.query(
      'SELECT * FROM "Document" WHERE "vaultId" = $1 ORDER BY "createdAt" DESC',
      [vaultId]
    );
    return res.json(docs.rows);
  } catch (err) {
    console.error('Fetch Documents Error:', err);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};