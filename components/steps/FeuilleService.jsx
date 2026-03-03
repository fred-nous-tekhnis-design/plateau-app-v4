'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Les étapes de déploiement sont générées par l'Agent Régisseur.
// Ce composant affiche la checklist interactive et met à jour Firestore.
export default function FeuilleService({ project, userId, projectId }) {
  const feuille = project?.feuille_service;
  const statut = feuille?.statut || 'VIDE';
  const etapes = feuille?.etapes || DEFAULT_ETAPES;
  const progression = feuille?.progression || {};
  const [saving, setSaving] = useState(false);

  const handleToggle = async (etapeId) => {
    if (statut === 'VIDE') return;
    setSaving(true);
    try {
      const newProgression = { ...progression, [etapeId]: !progression[etapeId] };
      const done = Object.values(newProgression).filter(Boolean).length;
      const total = etapes.length;
      const newStatut = done === total ? 'DEPLOYE' : 'EN_COURS';

      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      await updateDoc(projectRef, {
        [`feuille_service.progression.${etapeId}`]: !progression[etapeId],
        'feuille_service.statut': newStatut,
      });
    } catch (err) {
      console.error('Erreur progression :', err);
    } finally {
      setSaving(false);
    }
  };

  const doneCount = Object.values(progression).filter(Boolean).length;
  const totalCount = etapes.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (statut === 'VIDE') {
    return (
      <div className="fs-empty">
        <div className="empty-icon">📋</div>
        <div className="empty-title">FEUILLE DE SERVICE</div>
        <p className="empty-text">
          L'Agent Régisseur générera les instructions de déploiement clic-par-clic
          après validation du Plan de Travail.
        </p>
        <style jsx>{`
          .fs-empty { text-align: center; padding: 80px 20px; }
          .empty-icon { font-size: 48px; margin-bottom: 16px; }
          .empty-title { font-size: 28px; font-weight: 900; letter-spacing: 6px; color: rgba(255,255,255,0.2); margin-bottom: 16px; }
          .empty-text { color: rgba(255,255,255,0.3); font-size: 13px; line-height: 1.8; max-width: 400px; margin: 0 auto; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fs-container">
      <div className="fs-header">
        <h2 className="fs-title">FEUILLE DE SERVICE</h2>
        <div className="fs-meta">Étape 8 / 8 — Déploiement Guidé</div>
      </div>

      {/* Barre de progression globale */}
      <div className="progress-section">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-label">
          {doneCount}/{totalCount} étapes réalisées
          {statut === 'DEPLOYE' && <span className="deployed-badge">🚀 DÉPLOYÉ !</span>}
        </div>
      </div>

      {/* Liste des étapes */}
      <div className="etapes-list">
        {etapes.map((etape, i) => {
          const isDone = !!progression[etape.id];
          const prevDone = i === 0 || !!progression[etapes[i - 1]?.id];
          const isActive = !isDone && prevDone;

          return (
            <div key={etape.id} className={`etape-card ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${!prevDone ? 'locked' : ''}`}>
              <div className="etape-check" onClick={() => prevDone && handleToggle(etape.id)}>
                {isDone ? '✓' : isActive ? '◉' : '○'}
              </div>
              <div className="etape-content">
                <div className="etape-header">
                  <span className="etape-num">Étape {etape.numero || i + 1}</span>
                  <span className="etape-titre">{etape.titre}</span>
                  <span className="etape-console">{etape.console}</span>
                </div>

                {isActive && (
                  <>
                    <div className="etape-chemin">📍 {etape.chemin}</div>
                    <div className="etape-instructions">
                      {etape.instructions?.split('\n').map((line, li) => (
                        <div key={li} className="instruction-line">{line}</div>
                      ))}
                    </div>
                    {etape.resultat && (
                      <div className="etape-resultat">
                        ✅ <strong>Résultat attendu :</strong> {etape.resultat}
                      </div>
                    )}
                    <div className="etape-btns">
                      <button
                        className="btn-done"
                        onClick={() => handleToggle(etape.id)}
                        disabled={saving}
                      >
                        ✓ Étape réalisée
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {statut === 'DEPLOYE' && (
        <div className="deployed-screen">
          🎬 Félicitations ! Votre application est déployée.
          {feuille?.url && (
            <div className="app-url">
              <a href={feuille.url} target="_blank" rel="noopener noreferrer">{feuille.url}</a>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .fs-container { max-width: 720px; margin: 0 auto; }
        .fs-header { margin-bottom: 24px; }
        .fs-title { font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #fff; margin: 0 0 6px 0; }
        .fs-meta { font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 2px; text-transform: uppercase; }

        .progress-section { margin-bottom: 28px; }
        .progress-bar-bg { background: rgba(255,255,255,0.06); height: 6px; margin-bottom: 8px; }
        .progress-bar-fill { background: #ff5000; height: 100%; transition: width 0.4s ease; }
        .progress-label {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .deployed-badge {
          background: rgba(76,175,80,0.2);
          color: #4caf50;
          padding: 2px 10px;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .etapes-list { display: flex; flex-direction: column; gap: 4px; }
        .etape-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.01);
          transition: all 0.2s;
        }
        .etape-card.done {
          border-color: rgba(76,175,80,0.2);
          background: rgba(76,175,80,0.04);
          opacity: 0.7;
        }
        .etape-card.active {
          border-color: rgba(255,80,0,0.3);
          background: rgba(255,80,0,0.05);
        }
        .etape-card.locked { opacity: 0.4; }

        .etape-check {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .etape-card.done .etape-check { color: #4caf50; }
        .etape-card.active .etape-check { color: #ff5000; }

        .etape-content { flex: 1; min-width: 0; }
        .etape-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .etape-num { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; }
        .etape-titre { font-size: 14px; color: #fff; font-weight: bold; letter-spacing: 1px; }
        .etape-console {
          font-size: 10px;
          background: rgba(255,80,0,0.15);
          color: #ff5000;
          padding: 2px 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .etape-chemin {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin: 10px 0 8px;
          letter-spacing: 0.5px;
        }
        .etape-instructions {
          background: rgba(255,255,255,0.03);
          border-left: 2px solid rgba(255,80,0,0.3);
          padding: 12px 16px;
          margin-bottom: 12px;
        }
        .instruction-line {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          line-height: 1.7;
          padding: 2px 0;
        }
        .etape-resultat {
          font-size: 12px;
          color: rgba(76,175,80,0.8);
          margin-bottom: 12px;
          line-height: 1.6;
        }
        .etape-btns { display: flex; gap: 10px; }
        .btn-done {
          background: #ff5000;
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          letter-spacing: 1px;
          transition: background 0.2s;
        }
        .btn-done:hover:not(:disabled) { background: #e04500; }
        .btn-done:disabled { opacity: 0.5; cursor: not-allowed; }

        .deployed-screen {
          background: rgba(76,175,80,0.1);
          border: 1px solid rgba(76,175,80,0.3);
          color: #4caf50;
          padding: 24px;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          text-align: center;
          margin-top: 24px;
        }
        .app-url {
          margin-top: 12px;
          font-size: 13px;
          font-weight: normal;
        }
        .app-url a {
          color: rgba(76,175,80,0.8);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// Étapes par défaut — seront remplacées par les données Firestore de l'Agent Régisseur
const DEFAULT_ETAPES = [
  { id: 'e1', numero: 1, titre: 'Ouvrir le Chantier', console: 'Firebase', chemin: 'console.firebase.google.com → Ajouter un projet', instructions: '1. Cliquer "Ajouter un projet"\n2. Nommer le projet\n3. Cliquer "Créer"', resultat: 'Tableau de bord Firebase actif' },
  { id: 'e2', numero: 2, titre: 'Distribuer les Badges', console: 'Firebase', chemin: 'Firebase Console → Build → Authentication → Commencer', instructions: '1. Cliquer "Commencer"\n2. Activer le fournisseur Google\n3. Cliquer "Enregistrer"', resultat: 'Fournisseur Google "Activé"' },
  { id: 'e3', numero: 3, titre: 'Installer la Régie de Script', console: 'Firebase', chemin: 'Firebase Console → Build → Firestore Database → Créer', instructions: '1. Cliquer "Créer une base de données"\n2. Choisir "Mode de production"\n3. Sélectionner europe-west1', resultat: 'Firestore actif, règles publiées' },
];
