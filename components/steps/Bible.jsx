'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Bible({ project, userId, projectId }) {
  const bible = project?.bible;
  const statut = bible?.statut || 'VIDE';
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      await updateDoc(projectRef, {
        'bible.statut': 'VALIDE',
        'bible.locked': true,
        'bible.validatedAt': Date.now(),
        // Déclenche les agents aval (Synopsis + Traitement en parallèle)
        'synopsis.statut': 'SOUMIS',
        'traitement.statut': 'SOUMIS',
      });
    } catch (err) {
      console.error('Erreur validation Bible :', err);
    } finally {
      setValidating(false);
    }
  };

  const renderContent = () => {
    if (statut === 'VIDE') {
      return (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <div className="empty-title">BIBLE</div>
          <p className="empty-text">
            La Bible sera générée automatiquement par l'Agent Architecte
            après validation du Pitch. Elle apparaîtra ici sans rechargement.
          </p>
        </div>
      );
    }

    if (statut === 'EN_GENERATION' || statut === 'SOUMIS') {
      return (
        <div className="generating-state">
          <div className="gen-animation">
            <span className="gen-dot" style={{ animationDelay: '0s' }}>●</span>
            <span className="gen-dot" style={{ animationDelay: '0.3s' }}>●</span>
            <span className="gen-dot" style={{ animationDelay: '0.6s' }}>●</span>
          </div>
          <div className="gen-title">L'Agent Architecte génère votre Bible...</div>
          <p className="gen-subtitle">
            Il consulte la Bibliothèque RAG et rédige le document fondateur de votre projet.
            <br />Ce processus prend généralement 10 à 30 secondes.
          </p>
        </div>
      );
    }

    return (
      <div className="bible-content-wrap">
        <div className="bible-header">
          <h2 className="bible-title">BIBLE</h2>
          <div className="bible-meta">
            <span className={`statut-badge statut-${statut.toLowerCase()}`}>
              {statut === 'VALIDE' ? '● VALIDÉE ✓' : '● GÉNÉRÉE'}
            </span>
            {bible?.version && <span className="version-tag">v{bible.version}</span>}
          </div>
        </div>

        <div className="bible-body">
          {bible?.contenu ? (
            <div className="bible-text">{bible.contenu}</div>
          ) : (
            <div className="bible-text">Contenu en cours de chargement...</div>
          )}
        </div>

        {statut === 'GENEREE' && !bible?.locked && (
          <div className="bible-actions">
            <p className="action-hint">
              Lisez attentivement la Bible. Elle est le document fondateur de votre projet.
              Une fois validée, elle déclenchera la génération du Synopsis et du Traitement en parallèle.
            </p>
            <button
              className="btn-validate"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? '⏳ Verrouillage...' : '✓ Valider la Bible → Lancer les agents aval'}
            </button>
          </div>
        )}

        {statut === 'VALIDE' && (
          <div className="validated-notice">
            ✓ Bible verrouillée — Synopsis et Traitement en génération dans la Régie.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bible-container">
      {renderContent()}

      <style jsx>{`
        .bible-container { max-width: 720px; margin: 0 auto; }

        .empty-state, .generating-state {
          text-align: center;
          padding: 80px 20px;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 6px;
          color: rgba(255,255,255,0.2);
          margin-bottom: 16px;
        }
        .empty-text {
          color: rgba(255,255,255,0.3);
          font-size: 13px;
          line-height: 1.8;
          max-width: 400px;
          margin: 0 auto;
        }

        .gen-animation {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .gen-dot {
          color: #ffc107;
          font-size: 20px;
          animation: bounce 1.2s infinite;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-8px); opacity: 0.5; }
        }
        .gen-title {
          font-size: 18px;
          color: #ffc107;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .gen-subtitle {
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          line-height: 1.8;
        }

        .bible-content-wrap {}
        .bible-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .bible-title {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 6px;
          color: #fff;
          margin: 0;
        }
        .bible-meta { display: flex; align-items: center; gap: 12px; }
        .statut-badge {
          font-size: 11px;
          padding: 4px 12px;
          letter-spacing: 1px;
          font-weight: bold;
        }
        .statut-generee { background: rgba(76,175,80,0.15); color: #4caf50; }
        .statut-valide { background: rgba(76,175,80,0.2); color: #4caf50; }
        .version-tag {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 1px;
        }

        .bible-body {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 28px;
          margin-bottom: 24px;
        }
        .bible-text {
          color: rgba(255,255,255,0.8);
          font-size: 13px;
          line-height: 1.9;
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
        }

        .bible-actions {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 24px;
        }
        .action-hint {
          color: rgba(255,255,255,0.4);
          font-size: 12px;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .btn-validate {
          background: #ff5000;
          color: #fff;
          border: none;
          padding: 16px 32px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
        }
        .btn-validate:hover:not(:disabled) { background: #e04500; }
        .btn-validate:disabled { opacity: 0.6; cursor: not-allowed; }

        .validated-notice {
          background: rgba(76,175,80,0.1);
          border: 1px solid rgba(76,175,80,0.3);
          color: #4caf50;
          padding: 16px 20px;
          font-size: 13px;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
