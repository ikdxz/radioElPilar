# 🏫 Radio Scolaire « El Pilar »

Ce projet est une **solution élégante et minimaliste** pour gérer une radio scolaire au collège El Pilar, combinant diffusion en direct via Icecast et publication de podcasts. Il a été développé avec un **backend Node.js** et un **frontend HTML/CSS/JS**, et inclut une interface d’administration pour piloter la diffusion.

---

## 🎧 Fonctionnalités principales

- **Diffusion en direct**  
  - Émission live via **Icecast** (serveur auto-hébergé) et **BUTT** (Broadcast Using This Tool).  
- **Podcast à la demande**  
  - Lecture d’un seul épisode à la fois pour simplifier la gestion.  
- **Mode fallback Lofi**  
  - Si ni direct ni podcast, lecture continue d’une playlist LoFi 24 h/24.  
- **Interface d’administration**  
  - Authentification simple (utilisateur/mot de passe)  
  - Démarrage/arrêt du direct  
  - Programmation et sélection du podcast à diffuser  
- **Accessibilité réseau**  
  - Accès depuis n’importe quel appareil sur le réseau interne  
  - Possibilité d’accès externe via configuration de pare-feu / NAT  

---

## ⚙ Architecture & Technologies

- **Backend** : Node.js + Express  
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)  
- **Diffusion** : Icecast 2, BUTT (client live)  
- **Stockage podcast** : Système de fichiers local (un seul fichier actif à la fois)  
- **Authentification** : Middleware Express avec un utilisateur/mot de passe simple  

---
📝 Utilisation
- Page publique (/)

  - Affiche le player : live, podcast ou LoFi selon disponibilité.

- Page admin (/login.html)

  - Connexion avec l’utilisateur/mot de passe configurés.

  - Boutons pour « Démarrer le direct », « Arrêter le direct ».

  - Sélecteur de fichier podcast (seul l’épisode actif sera diffusé).

🔒 Sécurité & Limites

- Authentification basique : utilisateur unique, mot de passe en clair (non recommandé en production).

- Accès interne : conçu pour un usage réseau scolaire.

- **Recommandation** :

  - Ajouter HTTPS (Let’s Encrypt)

  - Renforcer l’authentification (bcrypt, OAuth…)

  - Restreindre l’accès réseau (VPN, firewall)

🔧 Auteur

Iñaki Spinardi
Étudiant ASIR ● Développeur full-stack & DevOps ● Passionné par l’informatique, l’éducation et l’innovation.
