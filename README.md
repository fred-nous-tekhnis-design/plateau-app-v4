**Structure du dépôt GitHub :**
```
plateau-app-v4/
├── app/                        ← Code Next.js
│   ├── page.jsx                ← Page de connexion Firebase Auth
│   ├── dashboard/
│   │   └── page.jsx            ← Tableau de bord des projets
│   └── project/
│       └── [projectId]/
│           └── page.jsx        ← Espace de travail principal
├── components/
│   ├── Regie.jsx               ← Barre latérale temps réel
│   └── steps/
│       ├── Pitch.jsx           ← Formulaire Pitch
│       ├── Bible.jsx           ← Affichage Bible
│       └── FeuilleService.jsx  ← Checklist déploiement
├── lib/
│   ├── firebase.js             ← Configuration Firebase SDK
│   └── aiapp.js                ← Appel AI Application Vertex AI
├── functions/                  ← Cloud Functions (déployées par Firebase)
│   ├── index.js                ← Point d'entrée des Functions
│   └── handlers/
│       ├── onPitchSubmitted.js ← Trigger Firestore pitch
│       ├── onBibleValidated.js ← Trigger Firestore bible
│       └── onScenarioValidated.js
├── firebase.json               ← Configuration Firebase
├── .firebaserc                 ← Projet Firebase associé
└── package.json                ← Dépendances
```
