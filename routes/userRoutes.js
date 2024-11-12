// Charge les variables d'environnement depuis un fichier .env (par exemple JWT_SECRET)
require('dotenv').config();

// Importation d'Express pour créer les routes de l'application
const express = require('express');
const router = express.Router();  // Crée un nouveau routeur Express pour gérer les requêtes

// Importation du contrôleur des utilisateurs et du middleware pour authentifier le JWT
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/auth');  // Middleware pour vérifier le token JWT
const { checkAdmin } = userController;  // Récupère la fonction de vérification des administrateurs depuis le contrôleur

// Route de connexion : permet à un utilisateur de se connecter
router.post('/login', userController.loginUser);  // Route POST pour la connexion. Cette route n'est pas protégée.

router.get('/me', userController.getUserInfo);  // Route GET pour récupérer les informations de l'utilisateur connecté

// Routes pour gérer les utilisateurs, mais elles sont protégées et nécessitent une authentification JWT et des droits d'administrateur
router.get('/users', authenticateJWT, userController.verifyToken, checkAdmin, userController.getUsers);
// Route GET pour récupérer tous les utilisateurs. Cette route est protégée par le middleware `authenticateJWT`,
// puis vérifie le token JWT avec `verifyToken` et s'assure que l'utilisateur est un administrateur avec `checkAdmin`.

router.get('/users/:id', authenticateJWT, userController.verifyToken, checkAdmin, userController.getUser);
// Route GET pour récupérer un utilisateur spécifique par son ID. Cette route est protégée et nécessite une vérification de token et de rôle administrateur.

router.post('/users', authenticateJWT, userController.verifyToken, checkAdmin, userController.createUser);
// Route POST pour créer un nouvel utilisateur. Protégée et nécessite un administrateur pour y accéder.

router.put('/users/:id', authenticateJWT, userController.verifyToken, checkAdmin, userController.updateUser);
// Route PUT pour mettre à jour les informations d'un utilisateur par son ID. Nécessite l'authentification et les privilèges administratifs.

router.delete('/users/:id', authenticateJWT, userController.verifyToken, checkAdmin, userController.deleteUser);
// Route DELETE pour supprimer un utilisateur par son ID. Protégée et nécessite un administrateur.

router.put('/users/:id/admin', authenticateJWT, userController.verifyToken, checkAdmin, userController.setAdmin);
// Route PUT pour définir un utilisateur comme administrateur. Protégée et nécessite des privilèges d'administrateur.

// Exportation du routeur pour l'utiliser dans d'autres parties de l'application
module.exports = router;
