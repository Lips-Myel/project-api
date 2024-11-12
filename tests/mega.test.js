// Charge les variables d'environnement (comme les clés API) depuis le fichier .env
require('dotenv').config();

// Importation de la bibliothèque Supertest pour tester les routes de l'API
const request = require('supertest');
// Importation du serveur que nous allons tester
const server = require('../server'); // Assurez-vous que c'est bien l'importation de votre serveur
// Importation de la fonction pour initialiser la base de données
const initializeDatabase = require('../database/database'); // Fonction d'initialisation de la base de données

let newUserId; // Variable pour stocker l'ID du nouvel utilisateur créé
let tokenAlice; // Variable pour stocker le token d'Alice (utilisateur administrateur)

// Décrit un ensemble de tests pour les routes utilisateur
describe('Routes Utilisateur', () => {
  
  // Avant tous les tests, cette fonction sera exécutée une seule fois
  beforeAll(async () => {
    // Initialiser la base de données avec des utilisateurs par défaut
    await initializeDatabase();

    // Connexion d'Alice (administrateur) pour obtenir son token JWT
    const adminRes = await request(server)
      .post('/api/login')  // Envoie une requête POST à /api/login pour se connecter
      .set('Content-Type', 'application/json')  // Définit le type de contenu pour la requête (JSON)
      .send({ email: 'alice.marin@yahoo.com', password: '9876' });  // Envoie les informations de connexion

    // Vérifie si la connexion a réussi et récupère le token d'Alice
    if (adminRes.status === 200 && adminRes.body.token) {
      tokenAlice = adminRes.body.token;  // Sauvegarde le token si trouvé
    } else {
      throw new Error('Échec de la connexion administrateur Alice');
    }
  });

  // Test : Vérifie que la connexion avec le bon mot de passe pour Alice fonctionne
  it('devrait se connecter avec le mot de passe correct pour Alice (admin)', async () => {
    const res = await request(server)
      .post('/api/login')  // Requête pour se connecter
      .set('Content-Type', 'application/json')  // Spécifie que les données sont en JSON
      .send({ email: 'alice.marin@yahoo.com', password: '9876' });  // Envoie les données de connexion

    // Vérifie la réponse : le statut doit être 200 (OK) et doit contenir un token
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // Test : Vérifie que l'utilisateur connecté (Alice) peut obtenir ses informations
  it('devrait obtenir les informations de l\'utilisateur connecté pour Alice', async () => {
    const res = await request(server)
      .get('/api/me')  // Route pour obtenir les informations de l'utilisateur connecté
      .set('Authorization', `Bearer ${tokenAlice}`);  // Ajoute le token d'Alice à l'en-tête pour l'authentification
    
    // Vérifie que la réponse contient les bonnes informations
    expect(res.status).toBe(200);  // Statut OK
    expect(res.body).toHaveProperty('user_id');
    expect(res.body.email).toBe('alice.marin@yahoo.com');
    expect(res.body.isAdmin).toBe(true);
  });

  // Test : Vérifie qu'Alice (admin) peut obtenir la liste de tous les utilisateurs
  it('devrait obtenir tous les utilisateurs pour un administrateur (Alice)', async () => {
    const res = await request(server)
      .get('/api/users')  // Route pour récupérer tous les utilisateurs
      .set('Authorization', `Bearer ${tokenAlice}`);  // Ajoute le token d'Alice pour authentification
    
    expect(res.status).toBe(200);  // Statut OK
    expect(Array.isArray(res.body)).toBe(true);  // Vérifie que la réponse est un tableau d'utilisateurs
  });

  // Test : Vérifie qu'Alice (admin) peut ajouter un nouvel utilisateur
  it('devrait ajouter un utilisateur avec Alice (admin)', async () => {
    const newUser = {
      name: 'John',
      email: `john${Math.random()}@example.com`,  // Crée un email unique pour le nouvel utilisateur
      password: 'password',
      age: 30,
      isAdmin: 0  // Le nouvel utilisateur n'est pas administrateur
    };
  
    const res = await request(server)
      .post('/api/users')  // Route pour ajouter un nouvel utilisateur
      .set('Authorization', `Bearer ${tokenAlice}`)  // Ajoute le token d'Alice pour l'authentification
      .send(newUser);  // Envoie les données de l'utilisateur à ajouter
    
    // Vérifie que l'utilisateur a été ajouté avec succès
    expect(res.status).toBe(201);  // Le statut doit être 201 (créé)
    expect(res.body.message).toBe('Utilisateur ajouté avec succès');
    
    newUserId = res.body.userId;  // Sauvegarde l'ID du nouvel utilisateur pour les tests suivants
    console.log("Nouvel ID d'utilisateur:", newUserId);  // Affiche l'ID du nouvel utilisateur
  });
  
  // Test : Vérifie qu'Alice (admin) peut mettre à jour les informations du nouvel utilisateur
  it('devrait mettre à jour le nouvel utilisateur avec Alice (admin)', async () => {
    const updatedUser = {
      name: 'Jane',  // Nouveau nom pour l'utilisateur
      email: `jane${Math.random()}@example.com`,  // Nouveau mail pour l'utilisateur
      password: 'newpassword',
      age: 30,
      isAdmin: 1  // Mise à jour pour que l'utilisateur devienne administrateur
    };

    const res = await request(server)
      .put(`/api/users/${newUserId}`)  // Route pour mettre à jour un utilisateur en utilisant son ID
      .set('Authorization', `Bearer ${tokenAlice}`)  // Ajoute le token d'Alice pour l'authentification
      .send(updatedUser);  // Envoie les nouvelles données à mettre à jour
    
    // Vérifie que la mise à jour a réussi
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Utilisateur mis à jour avec succès');
  });

  // Test : Vérifie qu'Alice (admin) peut définir le nouvel utilisateur comme administrateur
  it('devrait définir le nouvel utilisateur comme administrateur avec Alice (admin)', async () => {
    const res = await request(server)
      .put(`/api/users/${newUserId}/admin`)  // Route pour définir l'utilisateur comme administrateur
      .set('Authorization', `Bearer ${tokenAlice}`)  // Ajoute le token d'Alice pour l'authentification
      .send({ isAdmin: 1 });  // Envoie la mise à jour du rôle (administrateur)
    
    // Vérifie que l'utilisateur a été défini comme administrateur
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`L'utilisateur avec ID ${newUserId} est maintenant administrateur.`);
  });

  // Test : Vérifie qu'Alice (admin) peut supprimer le nouvel utilisateur
  it('devrait supprimer le nouvel utilisateur avec Alice (admin)', async () => {
    const res = await request(server)
      .delete(`/api/users/${newUserId}`)  // Route pour supprimer un utilisateur par son ID
      .set('Authorization', `Bearer ${tokenAlice}`);  // Ajoute le token d'Alice pour l'authentification
    
    // Vérifie que la suppression a réussi
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Utilisateur supprimé avec succès');
  });
});
