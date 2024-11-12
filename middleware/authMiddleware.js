const userModel = require('../models/userModel'); // Importe le modèle userModel pour interagir avec la base de données utilisateur

// Middleware pour vérifier si l'utilisateur est un administrateur
const isAdmin = (req, res, next) => {
    const userId = req.userId; // Récupère l'ID de l'utilisateur depuis req.userId, supposant que cet ID a été ajouté après authentification

    // Appelle la fonction getUserById pour obtenir les informations de l'utilisateur depuis la base de données
    userModel.getUserById(userId, (err, user) => {
        // Si une erreur se produit, que l'utilisateur n'existe pas ou n'est pas administrateur,
        // renvoie une réponse 403 (Accès interdit)
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ message: "Accès interdit : l'utilisateur n'est pas administrateur." });
        }

        // Si l'utilisateur est administrateur, appelle le middleware suivant ou la route demandée
        next();
    });
};

// Exporte le middleware isAdmin pour qu'il puisse être utilisé dans d'autres fichiers
module.exports = { isAdmin };
