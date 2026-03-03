// Machiniste automatique — Déclenché quand le Pitch est soumis dans Firestore
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { GoogleAuth } = require('google-auth-library');
const { Firestore } = require('@google-cloud/firestore');

const AI_APP_ID = process.env.AI_APP_ID; // ID de l'AI Application
const GCP_PROJECT = process.env.GCP_PROJECT;
const REGION = 'europe-west1';

exports.onPitchSubmitted = onDocumentUpdated(
  'users/{userId}/projects/{projectId}/pitch',
  async (event) => {
    const newData = event.data.after.data();
    
    // On ne traite que si le statut passe à "SOUMIS"
    if (newData.statut !== 'SOUMIS') return;
    
    const { userId, projectId } = event.params;
    const db = new Firestore();
    
    // 1. Marquer la Bible comme "EN GÉNÉRATION" dans Firestore
    // → L'interface met à jour la Régie instantanément
    await db.doc(`users/${userId}/projects/${projectId}/bible`)
      .set({ statut: 'EN_GENERATION', timestamp: Date.now() });
    
    // 2. Appeler l'AI Application (Le Cerveau)
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    const response = await fetch(
      `https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${GCP_PROJECT}/locations/${REGION}/agents/${AI_APP_ID}:query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: { text: `Génère la Bible depuis ce Pitch : ${newData.contenu}` },
          agentRole: 'architecte'
        })
      }
    );
    
    const result = await response.json();
    const bibleContent = result?.answer?.text || 'Erreur de génération';
    
    // 3. Écrire la Bible dans Firestore
    // → L'interface affiche la Bible instantanément dans le Plateau
    await db.doc(`users/${userId}/projects/${projectId}/bible`)
      .set({
        contenu: bibleContent,
        statut: 'GENEREE',
        timestamp: Date.now(),
        version: '1.0'
      });
  }
);