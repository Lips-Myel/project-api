require('dotenv').config(); // Charge les variables d'environnement depuis un fichier .env
const jwt = require('jsonwebtoken'); // Module pour manipuler les tokens JWT (JSON Web Tokens)

// Récupération de la clé secrète pour JWT depuis les variables d'environnement
// Utilisée pour signer et vérifier les tokens d'authentification
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

// Middleware d'authentification JWT pour protéger les routes
const authenticateJWT = (req, res, next) => {
    // Récupère le token dans l'en-tête Authorization de la requête HTTP
    const token = req.headers['authorization']?.split(' ')[1]; // Prend le second élément après "Bearer"

    // Si aucun token n'est fourni, renvoie une erreur 403 (Accès interdit)
    if (!token) {
        return res.status(403).json({ message: 'Token manquant' });
    }

    // Vérifie et décode le token en utilisant la clé secrète
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // En cas d'erreur de vérification (ex: token invalide), renvoie une erreur 403
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }

        // Si le token est valide, stocke les informations de l'utilisateur dans req.user
        req.user = user;
        next(); // Passe au middleware suivant ou à la route demandée
    });
};

// Exporte le middleware pour qu'il puisse être utilisé dans d'autres fichiers
module.exports = authenticateJWT;
