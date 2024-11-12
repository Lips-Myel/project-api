const API_URL = "http://localhost:3000/api";

// Fonction pour récupérer le token depuis le localStorage
function getToken() {
    const token = localStorage.getItem('authToken');
    if (!token && window.location.pathname !== '/index.html') {
        alert('Vous devez être connecté pour accéder à cette section.');
        window.location.href = '/index.html';
        return null;
    }
    return token;
}

// En-têtes communs pour les requêtes API
function getHeaders() {
    const token = getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Fonction de connexion
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            console.log('Connexion réussie');
            checkAdminStatus();
        } else {
            console.log(data.message || 'Erreur inconnue');
        }
    })
    .catch(error => console.error('Erreur de connexion:', error));
}

// Vérification du rôle admin après connexion
async function checkAdminStatus() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/me`, { headers: getHeaders() });
        const data = await response.json();

        if (response.ok && data.isAdmin) {
            document.getElementById('adminPanel').style.display = 'block';
            fetchUsers();  // Charge les utilisateurs au chargement de la page
        } else {
            alert("Accès réservé aux administrateurs");
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du statut admin:', error);
    }
}

document.querySelector('#loginButton').addEventListener('click', login);

// Fonction de recherche avec appel à fetchUsers pour filtrer les utilisateurs
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Empêcher le rechargement de la page
    const query = document.getElementById('searchInput').value.trim();  // Récupération de la valeur de la recherche
    fetchUsers(query);  // Rechercher les utilisateurs correspondant au terme de recherche
});

// Fonction pour récupérer les utilisateurs
function fetchUsers(query = '') {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/users?search=${query}`, {
        method: 'GET',
        headers: getHeaders()
    })
    .then(response => {
        console.log(response);  // Affiche les détails de la réponse
        return response.json();
    })
    .then(data => {
        if (Array.isArray(data)) {
            displayUsers(data);
        } else {
            console.error('Aucun utilisateur trouvé ou erreur dans la réponse de l\'API.', data);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
    });
    
}

// Fonction pour afficher les utilisateurs
function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';  // Vider la liste avant de l'afficher

    if (users.length > 0) {  // Si des utilisateurs correspondent à la recherche
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.classList.add('user-card');
            userCard.innerHTML = `
                <h3>${user.name}</h3>
                <p>Email: ${user.email}</p>
                <p>Âge: ${user.age}</p> <!-- Affichage de l'âge -->
                <p>${user.isAdmin ? 'Admin' : 'Utilisateur'}</p>
                <button onclick="editUser(${user.user_id})">Modifier</button>
                <button onclick="deleteUser(${user.user_id})">Supprimer</button>
            `;
            userList.appendChild(userCard);
        });
    } else {  // Aucun utilisateur trouvé avec les critères
        userList.innerHTML = '<p>Aucun utilisateur trouvé pour cette recherche.</p>';
    }
}

// Fonction pour modifier un utilisateur
function editUser(userId) {
    const name = prompt("Entrez le nouveau nom de l'utilisateur :");
    const email = prompt("Entrez le nouvel email de l'utilisateur :");
    const age = prompt("Entrez l'âge de l'utilisateur :");  // Demande de l'âge
    const isAdmin = confirm("L'utilisateur est-il un administrateur ?");

    fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, age, isAdmin })
    })
    .then(response => {
        if (response.ok) {
            alert('Utilisateur modifié avec succès');
            fetchUsers();  // Rafraîchit la liste des utilisateurs
        } else {
            alert("Erreur lors de la modification de l'utilisateur");
        }
    })
    .catch(error => console.error('Erreur lors de la modification de l\'utilisateur:', error));
}

// Fonction pour supprimer un utilisateur
function deleteUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        .then(response => {
            if (response.ok) {
                alert('Utilisateur supprimé avec succès');
                fetchUsers();  // Rafraîchit la liste des utilisateurs
            } else {
                alert("Erreur lors de la suppression de l'utilisateur");
            }
        })
        .catch(error => console.error('Erreur lors de la suppression de l\'utilisateur:', error));
    }
}

// Fonction pour ajouter un utilisateur
document.getElementById('addUserForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const isAdmin = document.getElementById('newUserIsAdmin').checked;
    const password = document.getElementById('newUserPassword').value;
    const age = document.getElementById('newUserAge').value;  // Récupération de l'âge

    // Vérification de l'âge avant envoi
    if (!age || isNaN(age) || age <= 0) {
        alert('L\'âge doit être un nombre positif.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, email, age, isAdmin, password })  // Ajout de l'âge au body
        });

        const data = await response.json();

        if (response.ok) {
            alert("Utilisateur ajouté !");
            fetchUsers();
        } else {
            alert("Erreur lors de l'ajout de l'utilisateur: " + (data.message || "Erreur inconnue."));
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    }
});

// Fonction de déconnexion
document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname !== '/index.html') {
        checkAdminStatus();  // Seulement sur les pages protégées
    }
});
