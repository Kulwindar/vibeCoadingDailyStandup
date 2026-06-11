import React, { useState } from 'react';
import { Form } from './components/Form';
import { Dashboard } from './components/Dashboard';
import { ClipboardList, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'dashboard'>('form');

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('form')}>
            <span className="text-2xl">⏰</span>
            <h1 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Standup System
            </h1>
          </div>
          
          <nav className="flex space-x-2">
            <button
              onClick={() => setView('form')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                view === 'form'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Submit Standup</span>
            </button>
            
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                view === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Manager Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-grow">
        {view === 'form' ? <Form /> : <Dashboard />}
      </main>
    </div>
  );
};

export default App;
