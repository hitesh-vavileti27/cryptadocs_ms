const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const vaultController = require('../controllers/vaultController');
const docController = require('../controllers/docController');

// Auth Routes
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);

// Vault Routes
router.get('/vaults', vaultController.getVaults);
router.post('/vaults', vaultController.createVault);
router.delete('/vaults/:id', vaultController.deleteVault);

// Document Routes
router.post('/documents', docController.saveDocument);
router.get('/documents/:vaultId', docController.getVaultDocuments);

module.exports = router;