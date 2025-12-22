import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black">DB</div>
            <span className="text-lg font-bold">Diamond Bar Coding</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Built by the Diamond Bar High School Coding Club — turning wild ideas into polished mind maps.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">Product</h4>
          <div className="flex flex-col gap-2 text-sm text-slate-200">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
            <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer" className="hover:text-white">Demo</a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">Club</h4>
          <div className="flex flex-col gap-2 text-sm text-slate-200">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
            <a href="mailto:codingclub@dbhs.edu" className="hover:text-white">Email Us</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Stay in the loop</h4>
          <p className="text-slate-300 text-sm">Sign up for launch notes, club events, and new features.</p>
          <form 
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as HTMLFormElement;
              const emailInput = target.querySelector('input[type="email"]') as HTMLInputElement | null;
              const email = emailInput?.value.trim();
              if (email) {
                alert(`Thanks for joining! We'll reach out at ${email}.`);
                if (emailInput) emailInput.value = '';
              }
            }}
          >
            <input 
              type="email" 
              required 
              placeholder="you@dbhs.edu" 
              className="w-full rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} DBHS Coding Club. Built with caffeine & curiosity.
      </div>
    </footer>
  );
};

export default Footer;
