require('dotenv').config(); // Charge les variables d'environnement depuis un fichier .env
const express = require('express'); // Framework pour créer des serveurs et des routes HTTP
const bodyParser = require('body-parser'); // Middleware pour analyser les données des requêtes HTTP
const cors = require('cors'); // Middleware pour autoriser les requêtes de différentes origines
const userRoutes = require('./routes/userRoutes'); // Routes pour gérer les utilisateurs (importées depuis un autre fichier)
const path = require('path'); // Module pour gérer et manipuler les chemins de fichiers
const app = express(); // Crée une application Express
const port = process.env.PORT || 3000; // Définit le port pour le serveur (valeur par défaut: 3000)

// Configure les règles CORS pour autoriser les requêtes du frontend (localhost ou project-api)
app.use(cors({
    origin: ['http://localhost:3000', 'http://project-api:3000'], // Spécifie les URLs autorisées à accéder aux ressources
    optionsSuccessStatus: 200, // Indique un succès pour les requêtes CORS pré-vol (OPTIONS)
    credentials: true, // Autorise l'envoi de cookies et de jetons d'authentification
    allowedHeaders: ['Content-Type', 'Authorization'] // Autorise certains en-têtes spécifiques
}));

// Utilise body-parser pour analyser les corps de requêtes en JSON (par exemple pour les formulaires soumis en JSON)
app.use(bodyParser.json());  

// Utilise express.static pour servir les fichiers statiques (HTML, CSS, JS) du dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route principale du serveur, renvoie le fichier index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Définit une politique de sécurité de contenu (Content-Security-Policy) pour restreindre les sources de contenu
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self'; style-src 'self';");
    next(); // Passe au middleware suivant
});

// Utilise les routes d'API définies dans userRoutes pour les requêtes sous le chemin "/api"
// Toutes les routes définies dans userRoutes commencent par "/api"
app.use('/api', userRoutes);

// Lancer le serveur et écouter sur le port défini, puis afficher un message dans la console
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app; // Exporte l'application pour qu'elle puisse être utilisée ailleurs
