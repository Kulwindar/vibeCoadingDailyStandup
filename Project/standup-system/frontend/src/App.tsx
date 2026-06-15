import React, { useState } from 'react';
import { Form } from './components/Form';
import { Dashboard } from './components/Dashboard';
import { ClipboardList, LayoutDashboard, Heart, BarChart3, Search, AlertTriangle } from 'lucide-react';
import KudosFeed from './components/KudosFeed';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ArchiveSearch from './components/ArchiveSearch';
import BlockerDashboard from './components/BlockerDashboard';

type View = 'form' | 'dashboard' | 'kudos' | 'analytics' | 'archive' | 'blockers';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');

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
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <ClipboardList className="w-4 h-4 text-white" />
               <span>Submit Standup</span>
             </button>
            
<button
               onClick={() => setView('dashboard')}
               className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                 view === 'dashboard'
                   ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <LayoutDashboard className="w-4 h-4 text-white" />
               <span>Manager Dashboard</span>
             </button>
            
<button
               onClick={() => setView('blockers')}
               className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                 view === 'blockers'
                   ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <AlertTriangle className="w-4 h-4 text-white" />
               <span>Blockers</span>
             </button>

            <button
               onClick={() => setView('analytics')}
               className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                 view === 'analytics'
                   ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <BarChart3 className="w-4 h-4 text-white" />
               <span>Analytics</span>
             </button>

            <button
               onClick={() => setView('kudos')}
               className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                 view === 'kudos'
                   ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <Heart className="w-4 h-4 text-white" />
               <span>Kudos</span>
             </button>

            <button
               onClick={() => setView('archive')}
               className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                 view === 'archive'
                   ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                   : 'text-white hover:bg-white/5 border border-transparent'
               }`}
             >
               <Search className="w-4 h-4 text-white" />
               <span>Archive</span>
             </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8">
        {view === 'form' && <Form />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'blockers' && <BlockerDashboard />}
        {view === 'analytics' && <AnalyticsDashboard />}
        {view === 'kudos' && <KudosFeed />}
        {view === 'archive' && <ArchiveSearch />}
      </main>
    </div>
  );
};

export default App;
