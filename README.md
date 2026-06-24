# 🐱 Cat Battles ⚔️

Un jeu de combat rétro de chats au tour par tour, développé sous forme de **PWA (Progressive Web App)** performante et immersive. Adoptez vos chats, équipez-les d'objets stratégiques, entraînez-les et affrontez des bots de difficulté croissante !

---

## 🎮 Fonctionnalités principales

*   **Gestion des Chats** : Adoptez des chats (jusqu'à 5 maximum) avec un nom personnalisé, un type spécifique et un sprite dédié. Vous pouvez également relâcher vos chats à tout moment.
*   **Système de Types de Chats** :
    *   **Base** : Équilibré (statistiques moyennes).
    *   **Domestique** (Style "Tank") : Bonus de PV et DEF, mais malus d'ATK et VIT.
    *   **Sauvage** (Style "Offensif") : Bonus d'ATK et VIT, mais malus de PV et DEF.
*   **Équipements par Glisser-Déposer (Drag & Drop)** : Équipez vos chats de nourriture ou de jouets (jusqu'à 2 objets par chat) pour altérer leurs statistiques en combat.
*   **Moteur de Combat au Tour par Tour** : Affrontez des bots sur 9 niveaux de difficulté classés en 3 catégories (*Facile*, *Moyen*, *Difficile*).
*   **Progression & Niveaux** : Gagnez des combats pour augmenter de façon permanente les statistiques de votre chat et monter de niveau tous les 3 combats remportés.
*   **Sauvegarde Locale Persistante** : Toute votre progression (chats adoptés, statistiques, historique des combats et nom de dresseur) est sauvegardée dans le navigateur via `localStorage`.
*   **Historique des Combats (Statistiques)** : Un récapitulatif détaillé de vos victoires, défaites et combats passés.
*   **Immersion & Audio** : Bande-sonore rétro de combat et effets sonores activables avec gestion fine du volume.
*   **Background WebGL** : Effet de fond dynamique WebGL en combat (avec repli CSS fluide si WebGL n'est pas disponible).
*   **PWA Ready** : Installable sur mobile et ordinateur avec support du mode hors-ligne grâce à un Service Worker.

---

## ⚙️ Mécaniques de Combat

Les combats sont régis par les statistiques courantes des chats (calculées à partir de leurs statistiques de base combinées aux bonus de leurs objets équipés).

### 1. Statistiques fondamentales
*   **PV (maxpv)** : Les points de vie maximaux du chat.
*   **ATK** : La puissance d'attaque influençant les dégâts infligés.
*   **DEF** : La défense réduisant les dégâts subis.
*   **VIT** : Détermine l'ordre d'action (le plus rapide attaque en premier) et le taux de coups critiques.

### 2. Actions disponibles
*   **GRIFFER** : Attaque standard infligeant des dégâts normaux. Peut infliger un coup critique (dégâts ×1.6) basé sur une chance dérivée de la vitesse ($\text{chance} = \frac{\text{VIT}}{350}$).
*   **COUP SPÉCIAL** : Inflige des dégâts accrus (multiplicateur ×1.55) mais présente une probabilité d'échec de 22%. Indisponible deux tours d'affilée.
*   **ABRI** : Rend le chat insensible à toutes les attaques pour le tour actuel. Cette action est toujours prioritaire sur l'ordre de vitesse. Indisponible deux tours d'affilée.
*   **FUIR** : Permet de quitter le combat immédiatement sans victoire ni défaite enregistrée.

### 3. Formule de calcul des dégâts
$$\text{Dégâts} = (\text{ATK} \times \text{FacteurAléatoire}[0.45..0.95] - \text{DEF} \times 0.30) \times \text{MultiplicateurAction}$$
*(Les dégâts minimums sont de 1 PV. Si coup critique, le résultat final est multiplié par 1.6)*

### 4. Récompenses de Victoires & Niveaux
*   **Points de compétence** : Chaque victoire rapporte des points de statistiques permanents choisis aléatoirement parmi ATK, DEF ou VIT. Le gain augmente avec le niveau du bot battu (1 pt en Facile, 2 pts en Moyen, 3 pts en Difficile).
*   **Montée de niveau** : Tous les 3 combats gagnés, le chat monte de niveau et gagne définitivement +10 PV max.

---

## 🛠️ Technologies Utilisées

*   **Vite** : Outil de build ultra-rapide pour le développement moderne.
*   **JavaScript (ES6 Modules)** : Structuration modulaire et propre du code applicatif.
*   **CSS Moderne** : Styling responsive, thème rétro avec polices Google Fonts et design adapté aux mobiles (détection d'orientation mode paysage/portrait).
*   **Three.js / WebGL** : Rendu graphique en arrière-plan pendant le combat.
*   **PWA** : Service Worker (`sw.js`) pour la mise en cache des assets et fichier `manifest.json` pour l'installation sur l'écran d'accueil.

---

## 📂 Structure du Projet

L'architecture du projet sépare proprement les données, l'interface utilisateur (les scènes) et le moteur logique :

```text
Cat-Battle/
├── public/                # Assets statiques de l'application
│   ├── audio/             # Fichiers audio (OST, SFX)
│   ├── items/             # Images des objets équipables
│   ├── sprites/           # Sprites et logos du jeu
│   ├── manifest.json      # Configuration PWA
│   └── sw.js              # Service Worker (gestion du cache hors-ligne)
├── src/                   # Fichiers sources
│   ├── core/              # Logique centrale
│   │   ├── audio.js       # Gestionnaire du son
│   │   ├── sceneManager.js# Routeur et gestionnaire d'affichage des écrans
│   │   ├── storage.js     # Gestion de la persistance locale (localStorage)
│   │   └── webglBackground.js # Rendu de fond de combat en WebGL
│   ├── data/              # Données de configuration et configurations statiques
│   │   ├── attacks.js     # Définition des actions de combat
│   │   ├── items.js       # Objets équipables et leurs bonus
│   │   └── levels.js      # Niveaux de bots et générateur de bots
│   ├── entities/          # Modèles de données
│   │   └── Cat.js         # Classes Cat, DomesticCat et WildCat
│   ├── scenes/            # Logique liée à l'UI et aux écrans
│   │   ├── battle.js      # Écran de combat
│   │   ├── catList.js     # Liste des chats et adoption
│   │   ├── home.js        # Écran d'accueil principal
│   │   ├── levelSelect.js # Choix du niveau de combat
│   │   └── stats.js       # Écran d'historique et statistiques
│   ├── systems/           # Systèmes de logique pure
│   │   └── battleEngine.js# Moteur de combat au tour par tour (sans couplage DOM)
│   ├── battle.css         # Styles spécifiques au combat
│   ├── style.css          # Styles généraux de l'UI rétro
│   └── main.js            # Initialisation globale de l'application
├── index.html             # Structure HTML principale de l'application
├── package.json           # Dépendances et scripts Node.js
└── README.md              # Documentation du projet
```

---

## 🚀 Démarrage Rapide

### Prérequis
Assurez-vous d'avoir installé [Node.js](https://nodejs.org/) sur votre machine.

### Installation
Clonez le dépôt ou téléchargez les fichiers du projet, puis installez les dépendances à la racine du projet :
```bash
npm install
```

### Lancement en mode développement
Pour démarrer le serveur de développement local :
```bash
npm run dev
```
Ouvrez ensuite l'adresse indiquée (généralement `http://localhost:5173`) dans votre navigateur.

### Build de production
Pour compiler l'application en vue d'un déploiement :
```bash
npm run build
```
Les fichiers générés se trouveront dans le dossier `dist/`.
