'use client';

// LA RÉGIE — Barre latérale temps réel
// Écoute Firestore via onSnapshot (géré dans le parent) et affiche les statuts

const STATUS_CONFIG = {
  VIDE:          { icon: '○', color: 'rgba(255,255,255,0.2)', label: 'Vide' },
  SOUMIS:        { icon: '◉', color: '#ffc107', label: 'Soumis' },
  EN_GENERATION: { icon: '◉', color: '#ffc107', label: 'En génération...' },
  GENEREE:       { icon: '●', color: '#4caf50', label: 'Générée' },
  VALIDE:        { icon: '●', color: '#4caf50', label: 'Validée ✓' },
  EN_CONFLIT:    { icon: '⚠', color: '#ff5000', label: 'En conflit' },
  BLOQUE:        { icon: '✕', color: '#f44336', label: 'Bloqué' },
};

export default function Regie({ steps, project, activeStep, onSelectStep }) {
  const getStepStatus = (stepKey) => {
    const stepData = project?.[stepKey];
    if (!stepData || stepData.statut === 'VIDE' || !stepData.statut) return 'VIDE';
    return stepData.statut;
  };

  const isClickable = (stepKey, index) => {
    // Pitch toujours cliquable
    if (index === 0) return true;
    // Les autres sont cliquables si le précédent est au moins GENEREE
    const prevKey = steps[index - 1]?.key;
    const prevStatus = getStepStatus(prevKey);
    return prevStatus === 'GENEREE' || prevStatus === 'VALIDE';
  };

  return (
    <aside className="regie">
      <div className="regie-label">LA RÉGIE</div>

      <nav className="steps-list">
        {steps.map((step, i) => {
          const status = getStepStatus(step.key);
          const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.VIDE;
          const active = activeStep === step.key;
          const clickable = isClickable(step.key, i);

          return (
            <button
              key={step.key}
              className={`step-item ${active ? 'active' : ''} ${!clickable ? 'locked' : ''}`}
              onClick={() => clickable && onSelectStep(step.key)}
              disabled={!clickable}
            >
              <span className="step-icon" style={{ color: cfg.color }}>
                {status === 'EN_GENERATION' ? <PulsingDot /> : cfg.icon}
              </span>
              <span className="step-name">{step.label}</span>
              {status !== 'VIDE' && (
                <span className="step-status" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              )}
              {!clickable && <span className="lock-icon">🔒</span>}
            </button>
          );
        })}
      </nav>

      <div className="regie-legend">
        <div className="legend-item">
          <span style={{ color: '#4caf50' }}>●</span> Validé
        </div>
        <div className="legend-item">
          <span style={{ color: '#ffc107' }}>◉</span> En cours
        </div>
        <div className="legend-item">
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>○</span> Vide
        </div>
        <div className="legend-item">
          <span style={{ color: '#ff5000' }}>⚠</span> Conflit
        </div>
      </div>

      <style jsx>{`
        .regie {
          width: 220px;
          min-width: 220px;
          border-right: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          padding: 24px 0;
          overflow-y: auto;
        }
        .regie-label {
          font-size: 9px;
          letter-spacing: 4px;
          color: rgba(255,255,255,0.25);
          padding: 0 20px 16px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }
        .steps-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 8px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
          font-family: 'Courier New', monospace;
          position: relative;
          border-radius: 2px;
        }
        .step-item:hover:not(.locked) {
          background: rgba(255,255,255,0.04);
        }
        .step-item.active {
          background: rgba(255,80,0,0.12);
          border-left: 2px solid #ff5000;
          padding-left: 10px;
        }
        .step-item.locked {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .step-icon {
          font-size: 14px;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }
        .step-name {
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .step-item.active .step-name {
          color: #fff;
          font-weight: bold;
        }
        .step-status {
          font-size: 9px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .lock-icon {
          font-size: 10px;
          opacity: 0.4;
        }
        .regie-legend {
          padding: 16px 20px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .legend-item {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </aside>
  );
}

// Dot animé pour "EN GÉNÉRATION"
function PulsingDot() {
  return (
    <>
      <span className="pulse-dot">◉</span>
      <style jsx>{`
        .pulse-dot {
          color: #ffc107;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
