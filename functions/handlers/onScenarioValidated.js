// MACHINISTE — onScenarioValidated
// Déclenché quand le Scénario passe au statut "VALIDE"
// Lance en parallèle : Agent Directeur de Prod → Dépouillement + Plan de Travail

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { Firestore } = require('@google-cloud/firestore');
const { callAIApplication, getAccessToken } = require('../../lib/aiapp');

exports.onScenarioValidated = onDocumentUpdated(
  'users/{userId}/projects/{projectId}',
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // On ne traite que si le Scénario vient de passer à "VALIDE"
    if (before?.scenario?.statut === after?.scenario?.statut) return;
    if (after?.scenario?.statut !== 'VALIDE') return;

    const { userId, projectId } = event.params;
    const db = new Firestore();
    const projectRef = db.doc(`users/${userId}/projects/${projectId}`);

    const scenarioContenu = after.scenario?.contenu || '';
    const bibleContenu = after.bible?.contenu || '';

    // Marquer Dépouillement ET Plan de Travail comme "EN GÉNÉRATION"
    await projectRef.update({
      'depouillement.statut': 'EN_GENERATION',
      'plan_travail.statut': 'EN_GENERATION',
    });

    try {
      const token = await getAccessToken();

      // Lance les deux agents EN PARALLÈLE (Loi 5)
      const [depouillementContent, planTravailContent] = await Promise.all([
        // Agent Directeur de Production → Dépouillement
        callAIApplication(
          `Génère le Dépouillement (inventaire exhaustif des services Firebase + GCP nécessaires avec coûts).
          
SCÉNARIO :
${scenarioContenu}

BIBLE :
${bibleContenu}

Format attendu : JSON structuré avec la liste des services, leur rôle, full_managed:true/false, et coût estimé.`,
          'directeur-prod',
          token
        ),

        // Agent Directeur de Production → Plan de Travail
        callAIApplication(
          `Génère le Plan de Travail (ordre de déploiement par sessions et dépendances).
          
SCÉNARIO :
${scenarioContenu}

BIBLE :
${bibleContenu}

Format attendu : tableau structuré en Markdown avec les sessions, durées estimées, et critères de validation.`,
          'directeur-prod',
          token
        ),
      ]);

      await projectRef.update({
        'depouillement.contenu': depouillementContent,
        'depouillement.statut': 'GENEREE',
        'depouillement.timestamp': Date.now(),
        'plan_travail.contenu': planTravailContent,
        'plan_travail.statut': 'GENEREE',
        'plan_travail.timestamp': Date.now(),
      });

    } catch (err) {
      console.error('Erreur onScenarioValidated :', err);
      await projectRef.update({
        'depouillement.statut': 'EN_CONFLIT',
        'depouillement.conflit': { niveau: 2, message: err.message },
        'plan_travail.statut': 'EN_CONFLIT',
        'plan_travail.conflit': { niveau: 2, message: err.message },
      });
    }
  }
);
