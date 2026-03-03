'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.push('/dashboard');
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Créer le profil utilisateur dans Firestore s'il n'existe pas
      const userRef = doc(db, 'users', user.uid, 'profil', 'info');
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nom: user.displayName,
          email: user.email,
          photo: user.photoURL,
          createdAt: Date.now(),
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Erreur connexion Google :', error);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="clap-icon">🎬</div>
        <h1 className="app-title">PLATEAU <span className="version">v4</span></h1>
        <p className="app-tagline">Studio de Production Cloud en Temps Réel</p>
        <p className="app-quote">
          "Un réalisateur ne regarde pas ses rushes le lendemain.<br />
          Il les voit sur le moniteur, en direct, pendant qu'il tourne."
        </p>
        <button className="google-btn" onClick={handleGoogleSignIn}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.8 34c-2 1.4-4.5 2-7.8 2-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.4 4.9C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Se connecter avec Google
        </button>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', monospace;
          background-image: radial-gradient(ellipse at 20% 50%, rgba(255,80,0,0.07) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(255,200,0,0.05) 0%, transparent 50%);
        }
        .login-card {
          text-align: center;
          max-width: 480px;
          padding: 60px 40px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(10px);
        }
        .clap-icon {
          font-size: 48px;
          margin-bottom: 20px;
          display: block;
        }
        .app-title {
          font-size: 48px;
          font-weight: 900;
          letter-spacing: 8px;
          color: #fff;
          margin: 0 0 6px 0;
          text-transform: uppercase;
        }
        .version {
          color: #ff5000;
          font-size: 24px;
          letter-spacing: 2px;
        }
        .app-tagline {
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0 0 32px 0;
        }
        .app-quote {
          color: rgba(255,255,255,0.3);
          font-size: 13px;
          line-height: 1.8;
          border-left: 2px solid rgba(255,80,0,0.4);
          padding-left: 16px;
          text-align: left;
          margin: 0 0 40px 0;
          font-style: italic;
        }
        .google-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          color: #1a1a1a;
          border: none;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          justify-content: center;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.5px;
        }
        .google-btn:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }
        .google-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
