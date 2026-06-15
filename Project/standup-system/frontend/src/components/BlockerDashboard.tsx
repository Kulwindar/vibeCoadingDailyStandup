import { AlertTriangle } from 'lucide-react';
import { useGetDigestQuery } from '../services/api';

export const BlockerDashboard: React.FC = () => {
  const { data, isLoading } = useGetDigestQuery();

  if (isLoading) {
    return (
      <div className="glass p-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/50 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  const blockers = data?.data?.submissions?.filter((s: any) => 
    s.blockers && s.blockers.toLowerCase() !== 'none'
  ) || [];

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-semibold text-white">Blockers</h2>
      </div>

      {blockers.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No active blockers today</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {blockers.map((blocker: any) => (
            <div key={blocker.id} className="glass p-4 rounded-lg border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-white">{blocker.member_name}</span>
                <span className="text-xs text-gray-500">{new Date(blocker.submitted_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-gray-300">{blocker.blockers}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockerDashboard;