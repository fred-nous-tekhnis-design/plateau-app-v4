// FUNCTIONS/INDEX.JS — Point d'entrée des Machinistes Automatiques
// Firebase détecte ce fichier et déploie toutes les Cloud Functions listées ici.
// Aucune configuration manuelle requise — le déploiement est automatique via App Hosting + GitHub.

const { onPitchSubmitted } = require('./handlers/onPitchSubmitted');
const { onBibleValidated } = require('./handlers/onBibleValidated');
const { onScenarioValidated } = require('./handlers/onScenarioValidated');

// Exporter toutes les Cloud Functions
exports.onPitchSubmitted = onPitchSubmitted;
exports.onBibleValidated = onBibleValidated;
exports.onScenarioValidated = onScenarioValidated;
