const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/profile', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  const { name, password } = req.body;

  try {
    let query = 'UPDATE users SET ';
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      query += `name = $${paramCount}, `;
      params.push(name);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `password_hash = $${paramCount}, `;
      params.push(hashedPassword);
      paramCount++;
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query = query.slice(0, -2);
    query += ` WHERE id = $${paramCount} RETURNING id, email, name`;
    params.push(req.userId);

    const result = await db.query(query, params);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.delete('/account', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;