const sqlite3 = require('sqlite3');  // Module pour gérer la base de données SQLite
const bcrypt = require('bcryptjs');  // Module pour crypter les mots de passe

// Variables globales pour stocker l'instance unique de la base de données (singleton)
// et pour vérifier si elle a déjà été initialisée
let dbInstance = null;  // Stocke l'instance de la base de données une fois créée
let isInitialized = false;  // Sert de verrou pour empêcher une initialisation multiple

// Fonction utilitaire pour exécuter des requêtes qui modifient la base de données (INSERT, UPDATE, DELETE)
async function executeQuery(db, sql, params = []) {
    // Cette fonction prend en paramètre l'instance de la base de données (db), 
    // une requête SQL, et une liste de paramètres pour cette requête.
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {  // Exécute la requête SQL
            if (err) {
                // Si une erreur survient, on rejette la promesse avec un message d'erreur
                reject(new Error(`Erreur d'exécution de la requête : ${err.message}`));
            } else {
                // Sinon, on résout la promesse en retournant l'objet de requête exécutée
                resolve(this);
            }
        });
    });
}

// Fonction utilitaire pour récupérer plusieurs lignes de données (ex. liste d'utilisateurs)
function fetchAllRows(db, sql) {
    // Cette fonction prend en paramètre l'instance de la base de données (db) et une requête SQL.
    return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {  // Exécute la requête et récupère toutes les lignes
            if (err) {
                // Si une erreur survient, on rejette la promesse avec un message d'erreur
                reject(new Error(`Erreur lors de la récupération des données : ${err.message}`));
            } else {
                // Sinon, on résout la promesse en retournant les lignes récupérées
                resolve(rows);
            }
        });
    });
}

// Fonction principale pour initialiser la base de données et la configurer
async function initializeDatabase() {
    // Si la base de données est déjà initialisée, retourne directement l'instance existante
    if (isInitialized) return dbInstance;

    // Création d'une nouvelle instance de la base de données et ouverture de la connexion
    const db = new sqlite3.Database('./database/data/api.db', (err) => {
        if (err) {
            // En cas d'erreur, on affiche un message d'erreur
            console.error(`Erreur lors de l'ouverture de la base de données : ${err.message}`);
            return;
        }
        console.log('Base de données ouverte avec succès.');
    });

    try {
        // Création de la table "users" si elle n'existe pas déjà
        await executeQuery(db, `
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                age INTEGER NOT NULL CHECK (age > 18),
                isAdmin INTEGER DEFAULT 0 CHECK (isAdmin IN (0, 1)),
                password TEXT
            );
        `);

        console.log('Table "users" créée ou déjà existante.');

        // Vérifie si des utilisateurs existent déjà dans la table
        const users = await fetchAllRows(db, `SELECT * FROM users`);
        if (users.length === 0) {
            // Si aucun utilisateur n'est trouvé, insère des utilisateurs par défaut
            console.log('Aucun utilisateur trouvé. Insertion des utilisateurs par défaut...');
            await insertDefaultUsers(db);
        } else {
            // Sinon, informe que des utilisateurs existent déjà
            console.log('Des utilisateurs existent déjà.');
        }

    } catch (err) {
        // Affiche un message d'erreur en cas de problème lors de l'initialisation
        console.error(`Erreur lors de l'initialisation de la base de données : ${err.message}`);
    }

    dbInstance = db;  // Stocke l'instance de la base de données pour des futurs appels
    isInitialized = true;  // Marque la base de données comme initialisée pour éviter des doublons
    return dbInstance;
}

// Fonction pour insérer des utilisateurs par défaut avec des mots de passe cryptés
async function insertDefaultUsers(db) {
    // Liste d'utilisateurs par défaut à insérer
    const defaultUsers = [
        { name: 'Jean', email: 'jean.dupont@yahoo.com', age: 50, isAdmin: 0, password: '1234' },
        { name: 'Alice', email: 'alice.marin@yahoo.com', age: 25, isAdmin: 1, password: '9876' },
        { name: 'Gregoire', email: 'gregoire.lefeve@yahoo.com', age: 40, isAdmin: 0, password: '4321' }
    ];

    // Boucle pour insérer chaque utilisateur dans la base de données
    for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);  // Crypte le mot de passe

        try {
            // Exécute une requête pour insérer l'utilisateur dans la base de données
            await executeQuery(db, `
                INSERT INTO users (name, email, age, isAdmin, password)
                VALUES (?, ?, ?, ?, ?)
            `, [user.name, user.email, user.age, user.isAdmin, hashedPassword]);

            console.log(`Utilisateur "${user.name}" inséré avec succès.`);
        } catch (err) {
            // En cas d'erreur, affiche un message d'erreur spécifique pour l'utilisateur
            console.error(`Erreur lors de l'insertion de l'utilisateur ${user.name}: ${err.message}`);
        }
    }
}

// Exporte la fonction initializeDatabase pour être utilisée dans d'autres fichiers de l'application
module.exports = initializeDatabase;
