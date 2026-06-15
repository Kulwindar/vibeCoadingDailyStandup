import { Heart, Send, X } from 'lucide-react';
import { useState } from 'react';
import { useGetKudosLeaderboardQuery, useGetKudosFeedQuery, useSubmitKudosMutation, useGetMembersQuery } from '../services/api';

export const KudosFeed: React.FC = () => {
  const [fromMember, setFromMember] = useState('');
  const [toMember, setToMember] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetKudosFeedQuery(20);
  const { data: leaderboardData, isLoading: lbLoading, refetch: refetchLB } = useGetKudosLeaderboardQuery();
  const [submitKudos, { isLoading: isSubmitting }] = useSubmitKudosMutation();
  const { data: membersData } = useGetMembersQuery();

  const memberOptions = membersData?.data?.members
    ? [...membersData.data.members].map(m => ({ value: m.email, label: m.name }))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!fromMember || !toMember || !message.trim()) {
      setSubmitError('All fields required');
      return;
    }

    try {
      await submitKudos({ from_member: fromMember, to_member: toMember, message }).unwrap();
      setSubmitSuccess(true);
      setMessage('');
      setToMember('');
      refetchFeed();
      refetchLB();
    } catch (err: any) {
      setSubmitError(err?.data?.message || 'Failed to submit kudos');
    }
  };

  if (feedLoading || lbLoading) {
    return (
      <div className="glass p-6 rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
<div className="flex items-center justify-between mb-4">
         <div className="flex items-center space-x-2">
           <Heart className="w-5 h-5 text-rose-500" />
           <h2 className="text-xl font-semibold text-white">Kudos Feed</h2>
         </div>
         <button
           onClick={() => setShowForm(!showForm)}
           className="flex items-center space-x-2 px-3 py-1.5 bg-rose-600/20 text-rose-400 rounded-lg hover:bg-rose-600/30 transition text-sm"
         >
           {showForm ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
           <span>{showForm ? 'Cancel' : 'Send Kudos'}</span>
         </button>
       </div>

       {showForm && (
        <form onSubmit={handleSubmit} className="glass p-4 rounded-lg mb-4 border border-rose-500/20">
          <div className="space-y-3">
            <select
              value={fromMember}
              onChange={(e) => setFromMember(e.target.value)}
              className="w-full bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              required
            >
              <option value="" className="bg-darkBg">From (Your Email)</option>
              {memberOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-darkBg">{opt.label}</option>
              ))}
            </select>

            <select
              value={toMember}
              onChange={(e) => setToMember(e.target.value)}
              className="w-full bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              required
            >
              <option value="" className="bg-darkBg">To (Recipient)</option>
              {memberOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-darkBg">{opt.label}</option>
              ))}
            </select>

            <textarea
              placeholder="Your kudos message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-darkBg/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-none"
              rows={3}
              maxLength={500}
              required
            />

            {submitError && (
              <p className="text-xs text-rose-400">{submitError}</p>
            )}

            {submitSuccess && (
              <p className="text-xs text-emerald-400">Kudos sent successfully!</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition disabled:opacity-50"
            >
              <Heart className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Kudos'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-medium text-emerald-400 mb-2">Leaderboard</h3>
        <div className="flex space-x-4">
          {leaderboardData?.data?.leaderboard?.slice(0, 3).map((entry: any, index: number) => (
            <div key={entry.email} className="flex-1 glass p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{index + 1}</div>
              <div className="text-sm text-gray-300">{entry.name.split(' ')[0]}</div>
              <div className="text-emerald-400 font-semibold">{entry.points} pts</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {feedData?.data?.kudos?.map((kudo: any) => (
          <div key={kudo.id} className="glass p-3 rounded-lg border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {kudo.from_member} → {kudo.to_member}
              </span>
              <span className="text-xs text-emerald-400">+{kudo.points}</span>
            </div>
            <p className="text-sm text-gray-300">{kudo.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KudosFeed;