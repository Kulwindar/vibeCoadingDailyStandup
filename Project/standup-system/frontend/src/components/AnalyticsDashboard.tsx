import { BarChart3 } from 'lucide-react';
import { useGetSprintAnalyticsQuery } from '../services/api';

interface AnalyticsDashboardProps {
  date?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ date }) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const { data, isLoading, error } = useGetSprintAnalyticsQuery(targetDate);

  if (isLoading) {
    return (
      <div className="glass p-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-4"></div>
          <div className="h-48 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-xl">
        <p className="text-rose-400">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white">Sprint Analytics</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{data?.data?.velocity_score || 0}</div>
          <div className="text-sm text-gray-400">Velocity Score</div>
        </div>
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{data?.data?.completed_tasks || 0}</div>
          <div className="text-sm text-gray-400">Tasks Completed</div>
        </div>
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{data?.data?.working_days || 0}</div>
          <div className="text-sm text-gray-400">Working Days</div>
        </div>
      </div>

      {data?.data?.trend && data.data.trend.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Daily Trend</h3>
          <div className="flex items-end space-x-2 h-32">
            {data.data.trend.map((day: any) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-indigo-500/30 rounded-t"
                  style={{ height: `${Math.max(10, day.velocity * 40)}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;