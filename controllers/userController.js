// Charge les variables d'environnement depuis un fichier .env (par exemple JWT_SECRET)
require('dotenv').config();
// Importation de bibliothèques pour la gestion des tokens JWT
const jwt = require('jsonwebtoken');
// Importation du modèle utilisateur et de la fonction pour créer la base de données
const userModel = require('../models/userModel');
const createDatabase = require('../database/database');

// Initialisation de la base de données
let db;

// Création de la base de données de manière asynchrone (en attente de la connexion à la base)
(async () => {
    try {
        db = await createDatabase();  // Tente de créer la base de données
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de données:", error);
        process.exit(1);  // Si une erreur survient, l'application s'arrête
    }
})();

// Récupère la clé secrète pour signer les tokens JWT depuis les variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET;

// Vérifie si la clé secrète est définie
if (!JWT_SECRET) {
    console.error("JWT_SECRET n'est pas défini dans les variables d'environnement.");
    process.exit(1);  // Si la clé n'est pas présente, l'application s'arrête
}

// Fonction pour connecter un utilisateur
const loginUser = (req, res) => {
    const { email, password } = req.body;  // Récupère l'email et le mot de passe de la requête

    if (!email || !password) {
        return res.status(400).json({ message: "L'email et le mot de passe sont requis." });
    }

    // Appel de la fonction `authenticateUser` du modèle pour vérifier l'utilisateur et son mot de passe
    userModel.authenticateUser(email, password, (err, user) => {
        if (err) {
            console.error('Erreur serveur:', err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
        }

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Si l'utilisateur est authentifié, créer un token JWT
        const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });  // Renvoie le token au client
    });
};

// Fonction pour récupérer les informations de l'utilisateur connecté
const getUserInfo = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Récupère le token depuis les en-têtes

    if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    // Vérifie la validité du token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }

        const userId = decoded.userId;  // Récupère l'ID de l'utilisateur à partir du token
        db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
            }
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            return res.json({
                user_id: user.user_id,
                email: user.email,
                isAdmin: user.isAdmin === 1  // Vérifie si l'utilisateur est administrateur
            });
        });
    });
};

// Middleware pour vérifier si l'utilisateur est un administrateur
const checkAdmin = (req, res, next) => {
    const user = req.user;  // Récupère l'utilisateur depuis la requête

    if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Accès refusé : utilisateur non autorisé' });
    }
    next();  // Passe à la fonction suivante si l'utilisateur est administrateur
};

// Middleware pour vérifier la validité du token JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Récupère le token depuis les en-têtes
    if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    // Vérifie la validité du token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }

        const userId = decoded.userId;  // Récupère l'ID de l'utilisateur à partir du token
        userModel.getUserById(userId, (err, user) => {
            if (err || !user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            req.user = user;  // Ajoute l'utilisateur à la requête
            next();  // Passe à la fonction suivante
        });
    });
};

// Fonction pour récupérer tous les utilisateurs avec une recherche optionnelle
const getUsers = (req, res) => {
    const searchQuery = req.query.search || '';  // Récupère le critère de recherche (s'il y en a)
    const query = `%${searchQuery}%`;  // Ajoute les signes '%' pour effectuer une recherche partielle

    userModel.getUsers(query, (err, users) => {
        if (err) return res.status(500).json({ message: 'Erreur du serveur' });
        res.json(users);  // Renvoie les utilisateurs trouvés
    });
};

// Fonction pour ajouter un nouvel utilisateur
const createUser = (req, res) => {
    const userData = req.body;  // Récupère les données de l'utilisateur depuis la requête

    userModel.addUser(userData, (err, userId) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur" });
        }
        res.status(201).json({ message: 'Utilisateur ajouté avec succès', userId });  // Confirme l'ajout
    });
};

// Fonction pour récupérer un utilisateur par ID
const getUser = (req, res) => {
    const id = req.params.id;  // Récupère l'ID de l'utilisateur depuis l'URL

    userModel.getUserById(id, (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur du serveur' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);  // Renvoie l'utilisateur trouvé
    });
};

// Fonction pour mettre à jour un utilisateur
const updateUser = (req, res) => {
    const id = req.params.id;  // Récupère l'ID de l'utilisateur depuis l'URL
    const userData = req.body;  // Récupère les nouvelles données de l'utilisateur

    userModel.updateUser(id, userData, (err, changes) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
        }
        if (changes === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur mis à jour avec succès' });  // Confirme la mise à jour
    });
};

// Fonction pour supprimer un utilisateur
const deleteUser = (req, res) => {
    const id = req.params.id;  // Récupère l'ID de l'utilisateur depuis l'URL

    userModel.deleteUser(id, (err, changes) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
        }
        if (changes === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur supprimé avec succès' });  // Confirme la suppression
    });
};

// Fonction pour définir un utilisateur comme administrateur
const setAdmin = (req, res) => {
    const id = req.params.id;  // Récupère l'ID de l'utilisateur depuis l'URL

    userModel.setAdmin(id, (err, changes) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur lors de la mise à jour de l'administrateur" });
        }

        if (changes === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: `L'utilisateur avec ID ${id} est maintenant administrateur.` });
    });
};

// Fonction pour rechercher des utilisateurs
function searchUsers(req, res) {
    const searchQuery = req.query.search || '';  // Récupère le critère de recherche (s'il y en a)

    if (!searchQuery) {
        return res.status(400).json({ message: 'Aucun critère de recherche fourni.' });
    }

    userModel.searchUsers(searchQuery, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
        }
        res.json(rows);  // Renvoie les utilisateurs trouvés
    });
}

// Exportation des fonctions pour pouvoir les utiliser ailleurs dans l'application
module.exports = {
    getUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    setAdmin,
    checkAdmin,
    loginUser,
    getUserInfo,
    verifyToken,
    searchUsers,
};
