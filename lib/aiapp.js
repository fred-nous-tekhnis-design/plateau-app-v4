// LIB/AIAPP.JS — Appel à l'AI Application Vertex AI (Agent Builder)
// Appelé depuis les Cloud Functions — PAS depuis le code Next.js (Loi 4)
// Ce fichier sert de référence partagée pour les Cloud Functions.

const REGION = process.env.AGENT_REGION || 'europe-west1';
const GCP_PROJECT = process.env.GCP_PROJECT;
const AI_APP_ID = process.env.AI_APP_ID;

/**
 * Appelle un agent de l'AI Application Vertex AI et retourne la réponse texte.
 * @param {string} query - Le prompt envoyé à l'agent
 * @param {string} agentRole - Rôle cible : 'architecte' | 'scripte' | 'directeur-prod' | 'regulisseur'
 * @param {string} accessToken - Token OAuth2 Google (fourni par GoogleAuth)
 * @returns {Promise<string>} - Réponse textuelle de l'agent
 */
async function callAIApplication(query, agentRole, accessToken) {
  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${GCP_PROJECT}/locations/${REGION}/agents/${AI_APP_ID}:query`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: { text: query },
      agentRole,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Application error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  return result?.answer?.text || result?.content?.[0]?.text || 'Erreur : réponse vide de l\'agent.';
}

/**
 * Obtient un token d'accès Google OAuth2 via Application Default Credentials.
 * Fonctionne automatiquement dans l'environnement Cloud Functions.
 * @returns {Promise<string>} - Access token
 */
async function getAccessToken() {
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

module.exports = { callAIApplication, getAccessToken };
