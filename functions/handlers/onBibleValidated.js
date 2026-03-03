// MACHINISTE — onBibleValidated
// Déclenché quand la Bible passe au statut "VALIDE"
// Lance en parallèle : Agent Scripte → Synopsis ET Traitement (Loi 5)

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { Firestore } = require('@google-cloud/firestore');
const { callAIApplication, getAccessToken } = require('../../lib/aiapp');

exports.onBibleValidated = onDocumentUpdated(
  'users/{userId}/projects/{projectId}',
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // On ne traite que si la Bible vient de passer à "VALIDE"
    if (before?.bible?.statut === after?.bible?.statut) return;
    if (after?.bible?.statut !== 'VALIDE') return;

    const { userId, projectId } = event.params;
    const db = new Firestore();
    const projectRef = db.doc(`users/${userId}/projects/${projectId}`);

    const bibleContenu = after.bible?.contenu || '';
    const pitchContenu = after.pitch?.contenu || '';

    // Marquer Synopsis ET Traitement comme "EN GÉNÉRATION" simultanément (Loi 5)
    await projectRef.update({
      'synopsis.statut': 'EN_GENERATION',
      'traitement.statut': 'EN_GENERATION',
    });

    try {
      const token = await getAccessToken();

      // Lance les deux agents EN PARALLÈLE (Promise.all — Loi 5)
      const [synopsisContent, traitementContent] = await Promise.all([
        // Agent Architecte → Synopsis
        callAIApplication(
          `À partir de ce Pitch et de cette Bible, génère le Synopsis (parcours utilisateur complet en 10 scènes).
          
PITCH :
${pitchContenu}

BIBLE :
${bibleContenu}

Format attendu : texte structuré en Markdown, 10 scènes organisées en 3 actes.`,
          'architecte',
          token
        ),

        // Agent Scripte → Traitement
        callAIApplication(
          `À partir de ce Pitch et de cette Bible, génère le Traitement (design de l'interface et wireframes écran par écran).
          
PITCH :
${pitchContenu}

BIBLE :
${bibleContenu}

Format attendu : texte structuré en Markdown avec wireframes ASCII pour chaque écran principal.`,
          'scripte',
          token
        ),
      ]);

      // Écriture des deux documents dans Firestore simultanément
      await projectRef.update({
        'synopsis.contenu': synopsisContent,
        'synopsis.statut': 'GENEREE',
        'synopsis.timestamp': Date.now(),
        'traitement.contenu': traitementContent,
        'traitement.statut': 'GENEREE',
        'traitement.timestamp': Date.now(),
      });

    } catch (err) {
      console.error('Erreur onBibleValidated :', err);
      await projectRef.update({
        'synopsis.statut': 'EN_CONFLIT',
        'synopsis.conflit': { niveau: 2, message: err.message },
        'traitement.statut': 'EN_CONFLIT',
        'traitement.conflit': { niveau: 2, message: err.message },
      });
    }
  }
);
