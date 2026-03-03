'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push('/');
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const unsubscribe = onSnapshot(projectsRef, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Trier par date de création décroissante
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProjects(data);
    });
    return () => unsubscribe();
  }, [user]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const newDoc = await addDoc(projectsRef, {
      nom: newProjectName.trim(),
      statut: 'EN_COURS',
      createdAt: serverTimestamp(),
      pitch: { statut: 'VIDE' },
      bible: { statut: 'VIDE' },
      synopsis: { statut: 'VIDE' },
      traitement: { statut: 'VIDE' },
      scenario: { statut: 'VIDE' },
      depouillement: { statut: 'VIDE' },
      plan_travail: { statut: 'VIDE' },
      feuille_service: { statut: 'VIDE' },
    });
    setNewProjectName('');
    setShowInput(false);
    router.push(`/project/${newDoc.id}`);
  };

  const getProgressBar = (project) => {
    const steps = ['pitch', 'bible', 'synopsis', 'traitement', 'scenario', 'depouillement', 'plan_travail', 'feuille_service'];
    const done = steps.filter((s) => project[s]?.statut === 'VALIDÉ' || project[s]?.statut === 'GENEREE' || project[s]?.statut === 'VALIDE').length;
    return { done, total: steps.length };
  };

  const getStepLabel = (project) => {
    const steps = [
      { key: 'pitch', label: 'Pitch' },
      { key: 'bible', label: 'Bible' },
      { key: 'synopsis', label: 'Synopsis' },
      { key: 'traitement', label: 'Traitement' },
      { key: 'scenario', label: 'Scénario' },
      { key: 'depouillement', label: 'Dépouillement' },
      { key: 'plan_travail', label: 'Plan de Travail' },
      { key: 'feuille_service', label: 'Feuille de Service' },
    ];
    const firstEmpty = steps.find((s) => !project[s.key] || project[s.key].statut === 'VIDE');
    return firstEmpty?.label || 'Déployé';
  };

  if (loading) return <div style={{ color: '#fff', padding: 40, fontFamily: 'monospace' }}>Chargement...</div>;

  return (
    <main className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎬 PLATEAU <span className="v4">v4</span></div>
        <div className="dash-user">
          {user?.photoURL && <img src={user.photoURL} alt="avatar" className="avatar" />}
          <span className="user-name">{user?.displayName?.split(' ')[0]}</span>
          <button className="logout-btn" onClick={() => signOut(auth).then(() => router.push('/'))}>
            Quitter le Studio
          </button>
        </div>
      </header>

      <section className="projects-section">
        <h2 className="section-title">MES TOURNAGES</h2>

        <div className="projects-grid">
          {projects.map((p) => {
            const { done, total } = getProgressBar(p);
            const pct = Math.round((done / total) * 100);
            return (
              <div key={p.id} className="project-card" onClick={() => router.push(`/project/${p.id}`)}>
                <div className="project-icon">🎥</div>
                <div className="project-info">
                  <div className="project-name">{p.nom}</div>
                  <div className="project-step">{getStepLabel(p)}</div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    <span className="progress-text">{done}/{total}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bouton nouveau projet */}
          {!showInput ? (
            <div className="project-card new-card" onClick={() => setShowInput(true)}>
              <div className="new-icon">+</div>
              <div className="new-label">Lancer un nouveau tournage</div>
            </div>
          ) : (
            <div className="project-card new-form">
              <input
                className="project-input"
                placeholder="Nom du projet..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                autoFocus
              />
              <div className="form-btns">
                <button className="btn-create" onClick={createProject}>Créer</button>
                <button className="btn-cancel" onClick={() => { setShowInput(false); setNewProjectName(''); }}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'Courier New', monospace;
          background-image: radial-gradient(ellipse at 10% 80%, rgba(255,80,0,0.06) 0%, transparent 50%);
        }
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.4);
        }
        .dash-brand {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 6px;
          color: #fff;
          text-transform: uppercase;
        }
        .v4 { color: #ff5000; font-size: 14px; }
        .dash-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .user-name {
          color: rgba(255,255,255,0.7);
          font-size: 13px;
        }
        .logout-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.4);
          padding: 6px 14px;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          border-color: rgba(255,80,0,0.5);
          color: rgba(255,80,0,0.8);
        }
        .projects-section {
          padding: 40px;
        }
        .section-title {
          font-size: 11px;
          letter-spacing: 4px;
          color: rgba(255,255,255,0.3);
          margin: 0 0 28px 0;
          font-weight: normal;
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .project-card {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .project-card:hover {
          border-color: rgba(255,80,0,0.3);
          background: rgba(255,80,0,0.04);
        }
        .project-icon { font-size: 24px; }
        .project-info { flex: 1; min-width: 0; }
        .project-name {
          font-size: 15px;
          color: #fff;
          font-weight: bold;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .project-step {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .progress-bar-wrap {
          background: rgba(255,255,255,0.06);
          height: 4px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .progress-bar-fill {
          background: #ff5000;
          height: 100%;
          transition: width 0.5s ease;
        }
        .progress-text {
          position: absolute;
          right: 0;
          top: -16px;
          font-size: 10px;
          color: rgba(255,255,255,0.3);
        }
        .new-card {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          border-style: dashed;
          border-color: rgba(255,255,255,0.12);
          gap: 8px;
        }
        .new-card:hover {
          border-color: rgba(255,80,0,0.4);
        }
        .new-icon {
          font-size: 28px;
          color: rgba(255,255,255,0.2);
          line-height: 1;
        }
        .new-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 1px;
        }
        .new-form {
          flex-direction: column;
          gap: 12px;
        }
        .project-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,80,0,0.4);
          color: #fff;
          padding: 10px 14px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
          outline: none;
        }
        .form-btns { display: flex; gap: 8px; }
        .btn-create {
          background: #ff5000;
          color: #fff;
          border: none;
          padding: 8px 20px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.2s;
        }
        .btn-create:hover { background: #e04500; }
        .btn-cancel {
          background: transparent;
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 8px 16px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
