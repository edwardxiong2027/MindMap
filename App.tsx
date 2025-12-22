
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import UserCenter from './components/UserCenter';
import LoginModal from './components/LoginModal';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600"></div>
          <span className="font-bold text-indigo-900 text-sm uppercase tracking-[0.2em]">MindMap Pro</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <Navbar 
          user={user} 
          onLoginClick={() => setShowLoginModal(true)} 
        />
        
        <main className="flex-grow flex flex-col min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<LandingPage user={user} onGetStarted={() => setShowLoginModal(true)} />} />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/editor/:mapId" 
              element={user ? <Editor user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <UserCenter user={user} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>

        <Footer />

        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    </Router>
  );
};

export default App;
