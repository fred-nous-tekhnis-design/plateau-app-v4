'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const QUESTIONS = [
  { id: 'probleme', label: '01 — LE PROBLÈME', placeholder: 'Quel problème votre application résout-elle ? Décrivez la situation actuelle et ses douleurs.' },
  { id: 'public', label: '02 — LE PUBLIC', placeholder: 'Qui utilise cette application ? Décrivez votre utilisateur principal en quelques lignes.' },
  { id: 'solution', label: '03 — LA SOLUTION', placeholder: 'Comment votre application résout-elle le problème ? Décrivez l\'approche choisie.' },
  { id: 'differenciateur', label: '04 — LE DIFFÉRENCIATEUR', placeholder: 'Qu\'est-ce qui rend votre application unique ? Pourquoi vous et pas une autre approche ?' },
  { id: 'contrainte', label: '05 — LA CONTRAINTE FONDAMENTALE', placeholder: 'Quelles sont vos contraintes techniques, budgétaires ou organisationnelles ?' },
];

export default function Pitch({ project, userId, projectId }) {
  const existingPitch = project?.pitch;
  const isValidated = existingPitch?.statut === 'VALIDE' || existingPitch?.statut === 'GENEREE';

  const [answers, setAnswers] = useState({
    probleme: existingPitch?.probleme || '',
    public: existingPitch?.public || '',
    solution: existingPitch?.solution || '',
    differenciateur: existingPitch?.differenciateur || '',
    contrainte: existingPitch?.contrainte || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    const allFilled = Object.values(answers).every((v) => v.trim().length > 0);
    if (!allFilled) {
      alert('Veuillez répondre à toutes les questions avant de valider.');
      return;
    }

    setSubmitting(true);
    try {
      const projectRef = doc(db, 'users', userId, 'projects', projectId);

      // Construire le contenu textuel du pitch pour l'IA
      const contenu = QUESTIONS.map(q => `${q.label}\n${answers[q.id]}`).join('\n\n');

      await updateDoc(projectRef, {
        'pitch.probleme': answers.probleme,
        'pitch.public': answers.public,
        'pitch.solution': answers.solution,
        'pitch.differenciateur': answers.differenciateur,
        'pitch.contrainte': answers.contrainte,
        'pitch.contenu': contenu,
        'pitch.statut': 'SOUMIS',
        'pitch.timestamp': Date.now(),
      });
      // La Cloud Function onPitchSubmitted prend le relais
    } catch (err) {
      console.error('Erreur soumission pitch :', err);
      alert('Erreur lors de la soumission. Vérifiez votre connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatut = existingPitch?.statut || 'VIDE';

  return (
    <div className="pitch-container">
      <div className="pitch-header">
        <h2 className="pitch-title">PITCH</h2>
        <span className="pitch-subtitle">Étape 1 / 8 — L'idée en 5 questions</span>
        {currentStatut !== 'VIDE' && (
          <span className={`statut-badge statut-${currentStatut.toLowerCase()}`}>
            {currentStatut === 'SOUMIS' ? '⏳ EN GÉNÉRATION...' :
             currentStatut === 'VALIDE' ? '✓ VALIDÉ' :
             currentStatut}
          </span>
        )}
      </div>

      <div className="questions-list">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="question-block">
            <label className="question-label">{q.label}</label>
            <textarea
              className="question-textarea"
              placeholder={q.placeholder}
              value={answers[q.id]}
              onChange={(e) => handleChange(q.id, e.target.value)}
              disabled={isValidated || submitting}
              rows={4}
            />
          </div>
        ))}
      </div>

      {!isValidated && (
        <div className="pitch-actions">
          <button
            className="btn-validate"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '⏳ Soumission en cours...' : '✓ Valider le Pitch → Générer la Bible'}
          </button>
          <p className="hint">
            Une fois validé, l'Agent Architecte génère automatiquement votre Bible.
          </p>
        </div>
      )}

      {isValidated && (
        <div className="validated-notice">
          ✓ Pitch validé — La Bible est en cours de génération dans la Régie.
        </div>
      )}

      <style jsx>{`
        .pitch-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .pitch-header {
          margin-bottom: 32px;
          display: flex;
          align-items: baseline;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pitch-title {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 6px;
          color: #fff;
          margin: 0;
          text-transform: uppercase;
        }
        .pitch-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .statut-badge {
          font-size: 11px;
          padding: 4px 12px;
          letter-spacing: 1px;
          font-weight: bold;
        }
        .statut-soumis { background: rgba(255,193,7,0.15); color: #ffc107; }
        .statut-valide, .statut-generee { background: rgba(76,175,80,0.15); color: #4caf50; }
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }
        .question-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .question-label {
          font-size: 11px;
          letter-spacing: 3px;
          color: #ff5000;
          text-transform: uppercase;
          font-weight: bold;
        }
        .question-textarea {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.85);
          padding: 14px 16px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.7;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .question-textarea:focus {
          border-color: rgba(255,80,0,0.4);
          background: rgba(255,80,0,0.03);
        }
        .question-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pitch-actions {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 24px;
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
          transition: background 0.2s, transform 0.1s;
          width: 100%;
        }
        .btn-validate:hover:not(:disabled) {
          background: #e04500;
          transform: translateY(-1px);
        }
        .btn-validate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hint {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          margin: 12px 0 0;
          letter-spacing: 0.5px;
        }
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
