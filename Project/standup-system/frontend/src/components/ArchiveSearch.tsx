import { Search, Download, X, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useSearchArchiveQuery } from '../services/api';

export const ArchiveSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, error } = useSearchArchiveQuery({
    q: query || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: 1,
    limit: 20
  });

  const handleReset = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('format', 'csv');
    const link = document.createElement('a');
    link.href = `/api/v1/archive/export?${params.toString()}`;
    link.download = 'standups-export.csv';
    link.click();
  };

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white">Search Archive</h2>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Search keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          {(query || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-rose-600/20 text-rose-400 rounded-lg hover:bg-rose-600/30 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse glass p-4 rounded-lg h-20"></div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-rose-400">Error loading search results</p>
      )}

      {data?.data?.results && data.data.results.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.data.results.map((standup: any) => (
            <div key={standup.id} className="glass p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-white">{standup.member_name}</span>
                <span className="text-xs text-gray-500">{standup.date}</span>
              </div>
              <div className="text-sm text-gray-300 mb-1">
                <span className="text-emerald-400">Yesterday:</span> {standup.yesterday?.substring(0, 60) || '—'}
              </div>
              <div className="text-sm text-gray-300">
                <span className="text-indigo-400">Today:</span> {standup.today?.substring(0, 60) || '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.data?.results && data.data.results.length === 0 && !isLoading && (
        <p className="text-gray-500 text-center py-8">No results found.</p>
      )}

      {!data?.data?.results && !isLoading && !error && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">Search Archive</h3>
          <p className="text-sm text-gray-500 mt-2">Enter keywords or select date range to search standup history</p>
        </div>
      )}
    </div>
  );
};

export default ArchiveSearch;