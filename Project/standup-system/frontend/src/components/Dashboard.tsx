import React, { useState } from 'react';
import { 
  useGetDigestQuery, 
  useSendDigestMutation, 
  useGetDigestStatusQuery 
} from '../services/api';
import { 
  Calendar, 
  Mail, 
  Clock, 
  AlertOctagon, 
  CheckCircle, 
  HelpCircle,
  Loader,
  RefreshCw
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getLocalDateString());
  const [managerEmail, setManagerEmail] = useState<string>('manager@company.com');
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const { data: digestResponse, isLoading: loadingDigest, refetch } = useGetDigestQuery(date);
  const { data: statusResponse, refetch: refetchStatus } = useGetDigestStatusQuery(date);
  const [sendDigest, { isLoading: sendingEmail }] = useSendDigestMutation();

  const digest = digestResponse?.data;
  const status = statusResponse?.data;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccess(null);
    setEmailError(null);

    try {
      const res = await sendDigest({ date, recipient_email: managerEmail }).unwrap();
      if (res.status === 200) {
        setEmailSuccess(`Email digest successfully sent to ${managerEmail}!`);
        refetchStatus();
      }
    } catch (err: any) {
      setEmailError(err?.data?.message || 'Failed to dispatch email digest.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between items-start md:items-center">
        {/* Date Selection */}
        <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="bg-transparent focus:outline-none text-white cursor-pointer select-none"
          />
          <button 
            onClick={() => { refetch(); refetchStatus(); }}
            className="p-1 hover:bg-white/10 rounded transition duration-200"
            title="Refresh Digest"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Email Dispatcher Form */}
        <form onSubmit={handleSendEmail} className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-1.5 w-full md:w-auto">
          <div className="flex items-center space-x-2 pl-3 flex-grow md:flex-grow-0">
            <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <input 
              type="email" 
              value={managerEmail} 
              onChange={(e) => setManagerEmail(e.target.value)} 
              placeholder="manager@company.com"
              required
              className="bg-transparent focus:outline-none text-white text-sm w-full md:w-48 placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={sendingEmail}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 flex items-center space-x-1.5 flex-shrink-0"
          >
            {sendingEmail ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Dispatch Email</span>
            )}
          </button>
        </form>
      </div>

      {/* Toast Notifications */}
      {emailSuccess && (
        <div className="mb-6 p-4 bg-successEmerald/10 border border-successEmerald/20 rounded-lg flex items-center space-x-3 text-successEmerald animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{emailSuccess}</span>
        </div>
      )}
      {emailError && (
        <div className="mb-6 p-4 bg-errorRose/10 border border-errorRose/20 rounded-lg flex items-center space-x-3 text-errorRose animate-fade-in">
          <AlertOctagon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{emailError}</span>
        </div>
      )}

      {/* Main Grid */}
      {loadingDigest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 glass rounded-xl animate-pulse"></div>
          <div className="h-48 glass rounded-xl animate-pulse"></div>
        </div>
      ) : !digest ? (
        <div className="text-center py-12 glass rounded-2xl border border-white/5">
          <HelpCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-300">No Digest Available</h3>
          <p className="text-gray-500 mt-2">Could not retrieve standups for the selected date.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Stats */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center glass p-6 rounded-2xl border border-white/10 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Standup Digest for {digest.date}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-400">
                  Roster: {digest.submitted_count} submitted / {digest.pending_count} pending
                </span>
                <span className="text-gray-600">•</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${status?.digest_sent ? 'bg-successEmerald' : 'bg-gray-600'}`}></span>
                  <span className="text-sm text-gray-400">
                    {status?.digest_sent ? `Email Digest Dispatched at ${new Date(status.sent_at!).toLocaleTimeString()}` : 'Email Digest Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-300 uppercase tracking-wider text-xs">Submissions ({digest.submissions.length})</h3>
            {digest.submissions.length === 0 ? (
              <div className="text-center py-12 glass rounded-xl border border-white/10">
                <p className="text-gray-500">No standup submissions logged yet for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {digest.submissions.map((sub) => {
                  const hasBlocker = sub.blockers.toLowerCase() !== 'none' && sub.blockers.trim() !== '';
                  return (
                    <div 
                      key={sub.id} 
                      className={`glass p-6 rounded-xl border-l-4 transition duration-300 glass-hover ${
                        hasBlocker ? 'border-l-blockerAmber' : 'border-l-indigo-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{sub.member_name}</h4>
                          <p className="text-xs text-gray-400">{sub.member_email}</p>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Yesterday</span>
                          <p className="text-sm text-gray-300 leading-relaxed">{sub.yesterday}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Today</span>
                          <p className="text-sm text-gray-300 leading-relaxed">{sub.today}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${hasBlocker ? 'bg-blockerAmber/10 border border-blockerAmber/20' : 'bg-white/5'}`}>
                          <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
                            hasBlocker ? 'text-blockerAmber' : 'text-gray-400'
                          }`}>Blockers</span>
                          <p className={`text-sm leading-relaxed ${hasBlocker ? 'text-amber-200' : 'text-gray-300'}`}>{sub.blockers}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Section */}
          {digest.pending.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-300 uppercase tracking-wider text-xs">Awaiting Submission ({digest.pending.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {digest.pending.map((m) => (
                  <div key={m.member_email} className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between opacity-60 hover:opacity-90 transition duration-200">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{m.member_name}</h4>
                      <p className="text-xs text-gray-500">{m.member_email}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
