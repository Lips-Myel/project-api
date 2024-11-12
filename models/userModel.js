require('dotenv').config(); // Charge les variables d'environnement à partir du fichier .env
const bcrypt = require('bcryptjs'); // Importe bcrypt pour le hachage des mots de passe
const createDatabase = require('../database/database'); // Importe la fonction pour créer la base de données

let db; // Variable globale pour stocker l'instance de la base de données

// Initialise la base de données de manière asynchrone
async function initializeDatabase() {
    try {
        db = await createDatabase(); // Assigne l'instance de la base de données à db
    } catch (err) {
        console.error("Erreur lors de l'initialisation de la base de données", err); // Log de l'erreur en cas d'échec
    }
}

// Appelle la fonction d'initialisation pour s'assurer que la base de données est prête avant d'utiliser d'autres fonctions
initializeDatabase();

// Vérifie la validité d'un email en utilisant une expression régulière
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email); // Retourne true si l'email est valide, sinon false
}

// Authentifie un utilisateur en comparant l'email et le mot de passe fournis
function authenticateUser(email, password, callback) {
    try {
        const dbInstance = db; // Utilise l'instance de base de données
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'SELECT * FROM users WHERE email = ?';
        dbInstance.get(sql, [email], (err, user) => {
            if (err) return callback(err, null); // Gère l'erreur de requête
            if (user && bcrypt.compareSync(password, user.password)) {
                return callback(null, user); // Utilisateur authentifié
            }
            return callback(new Error('Authentication failed'), null); // Erreur d'authentification si mot de passe incorrect
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
}

// Récupère tous les utilisateurs avec une option de recherche
const getUsers = (searchQuery = '', callback) => {
    try {
        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const query = `%${searchQuery}%`; // Format de recherche partielle
        const sql = 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?';
        dbInstance.all(sql, [query, query], (err, rows) => {
            if (err) return callback(err, null); // Gestion des erreurs
            callback(null, rows); // Retourne les utilisateurs trouvés
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Ajoute un nouvel utilisateur après avoir haché son mot de passe
const addUser = (userData, callback) => {
    try {
        const { name, email, age, password, isAdmin = 0 } = userData;

        if (!isValidEmail(email)) {
            return callback(new Error("Email invalide"), null); // Validation de l'email
        }

        getUserByEmail(email, (err, existingUser) => {
            if (err) return callback(err, null);
            if (existingUser) return callback(new Error('Un utilisateur avec cet email existe déjà.'), null);

            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) return callback(err, null);

                const dbInstance = db;
                if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

                const sql = 'INSERT INTO users (name, email, age, password, isAdmin) VALUES (?, ?, ?, ?, ?)';
                dbInstance.run(sql, [name, email, age, hashedPassword, isAdmin], function (err) {
                    callback(err, this ? this.lastID : null); // Retourne l'ID du nouvel utilisateur si réussi
                });
            });
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Récupère un utilisateur par son ID
const getUserById = (id, callback) => {
    try {
        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'SELECT * FROM users WHERE user_id = ?';
        dbInstance.get(sql, [id], (err, row) => {
            if (err) return callback(err, null); // Gestion des erreurs
            callback(null, row); // Retourne l'utilisateur trouvé
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Met à jour les informations d'un utilisateur
const updateUser = (id, userData, callback) => {
    try {
        const { name, email, age, isAdmin } = userData;

        if (!isValidEmail(email)) {
            return callback(new Error("Email invalide"), null); // Validation de l'email
        }

        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'UPDATE users SET name = ?, email = ?, age = ?, isAdmin = ? WHERE user_id = ?';
        dbInstance.run(sql, [name, email, age, isAdmin, id], function (err) {
            callback(err, this ? this.changes : 0); // Retourne le nombre de lignes affectées
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Supprime un utilisateur par son ID
const deleteUser = (id, callback) => {
    try {
        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'DELETE FROM users WHERE user_id = ?';
        dbInstance.run(sql, [id], function (err) {
            callback(err, this ? this.changes : 0); // Retourne le nombre de lignes supprimées
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Définit un utilisateur comme administrateur
const setAdmin = (id, callback) => {
    try {
        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'UPDATE users SET isAdmin = 1 WHERE user_id = ?';
        dbInstance.run(sql, [id], function (err) {
            callback(err, this ? this.changes : 0); // Retourne le nombre de lignes mises à jour
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Récupère un utilisateur par son email
const getUserByEmail = (email, callback) => {
    try {
        const dbInstance = db;
        if (!dbInstance) return callback(new Error("La base de données n'est pas initialisée"), null);

        const sql = 'SELECT * FROM users WHERE email = ?';
        dbInstance.get(sql, [email], (err, row) => {
            if (err) return callback(err, null); // Gestion des erreurs
            callback(null, row); // Retourne l'utilisateur trouvé
        });
    } catch (err) {
        callback(err, null); // Gestion des erreurs inattendues
    }
};

// Exporte toutes les fonctions pour les utiliser dans d'autres modules
module.exports = {
    getUsers,
    addUser,
    getUserById,
    updateUser,
    deleteUser,
    setAdmin,
    isValidEmail,
    getUserByEmail,
    authenticateUser,
};
