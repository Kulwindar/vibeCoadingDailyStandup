import React, { useState } from 'react';
import { useFormik } from 'formik';
import { standupSchema } from '../validations/validation';
import { useGetMembersQuery, useSubmitStandupMutation } from '../services/api';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export const Form: React.FC = () => {
  const { data: membersResponse, isLoading: loadingMembers, refetch } = useGetMembersQuery();
  const [submitStandup, { isLoading: submitting }] = useSubmitStandupMutation();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const members = membersResponse?.data?.members || [];

  const formik = useFormik({
    initialValues: {
      member_email: '',
      yesterday: '',
      today: '',
      blockers: ''
    },
    validationSchema: standupSchema,
    onSubmit: async (values) => {
      setServerError(null);
      
      const selectedMember = members.find(m => m.email === values.member_email);
      if (!selectedMember) {
        setServerError('Please select a valid team member.');
        return;
      }

      try {
        const payload = {
          member_name: selectedMember.name,
          member_email: selectedMember.email,
          yesterday: values.yesterday,
          today: values.today,
          blockers: values.blockers
        };

        const res = await submitStandup(payload).unwrap();
        if (res.status === 201) {
          setSuccess(true);
          formik.resetForm();
          refetch();
        }
      } catch (err: any) {
        const errMsg = err?.data?.message || 'Failed to submit standup. Please try again.';
        if (errMsg.includes('DUPLICATE_SUBMISSION')) {
          setServerError('You have already submitted your standup for today.');
        } else {
          setServerError(errMsg);
        }
      }
    }
  });

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="glass p-8 md:p-12 rounded-2xl max-w-md w-full shadow-2xl border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-successEmerald mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-white">Standup Submitted!</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Thank you! Your daily update has been logged and included in today's manager digest. See you tomorrow.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 px-6 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition duration-200 shadow-md shadow-indigo-600/30"
          >
            Submit Another Update
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="glass p-8 md:p-10 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primaryIndigo to-indigo-400"></div>
        
        <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-white">Daily Standup</h2>
        <p className="text-gray-400 mb-8">Share your status and blockers for today.</p>

        {serverError && (
          <div className="mb-6 p-4 bg-errorRose/10 border border-errorRose/20 rounded-lg flex items-start space-x-3 text-errorRose">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{serverError}</span>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Member Selection */}
          <div>
            <label htmlFor="member_email" className="block text-sm font-semibold mb-2 text-gray-300">
              Select Your Name
            </label>
            {loadingMembers ? (
              <div className="h-11 bg-white/5 animate-pulse rounded-lg border border-white/10"></div>
            ) : (
              <select
                id="member_email"
                name="member_email"
                value={formik.values.member_email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-white/5 border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-200 ${
                  formik.touched.member_email && formik.errors.member_email
                    ? 'border-errorRose/60'
                    : 'border-white/10'
                }`}
              >
                <option value="" className="bg-darkBg text-gray-400">-- Select Yourself --</option>
                {members.map((m) => (
                  <option key={m.email} value={m.email} className="bg-darkBg text-white">
                    {m.name} {m.submitted ? '✓ (Done)' : ''}
                  </option>
                ))}
              </select>
            )}
            {formik.touched.member_email && formik.errors.member_email && (
              <p className="mt-1 text-xs text-errorRose font-medium">{formik.errors.member_email}</p>
            )}
          </div>

          {/* Yesterday */}
          <div>
            <label htmlFor="yesterday" className="block text-sm font-semibold mb-2 text-gray-300">
              What did you complete yesterday?
            </label>
            <textarea
              id="yesterday"
              name="yesterday"
              rows={3}
              value={formik.values.yesterday}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="List key tasks completed..."
              className={`w-full bg-white/5 border text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-200 placeholder-gray-500 ${
                formik.touched.yesterday && formik.errors.yesterday
                  ? 'border-errorRose/60'
                  : 'border-white/10'
              }`}
            />
            {formik.touched.yesterday && formik.errors.yesterday && (
              <p className="mt-1 text-xs text-errorRose font-medium">{formik.errors.yesterday}</p>
            )}
          </div>

          {/* Today */}
          <div>
            <label htmlFor="today" className="block text-sm font-semibold mb-2 text-gray-300">
              What are you planning to work on today?
            </label>
            <textarea
              id="today"
              name="today"
              rows={3}
              value={formik.values.today}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="List planned activities..."
              className={`w-full bg-white/5 border text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-200 placeholder-gray-500 ${
                formik.touched.today && formik.errors.today
                  ? 'border-errorRose/60'
                  : 'border-white/10'
              }`}
            />
            {formik.touched.today && formik.errors.today && (
              <p className="mt-1 text-xs text-errorRose font-medium">{formik.errors.today}</p>
            )}
          </div>

          {/* Blockers */}
          <div>
            <label htmlFor="blockers" className="block text-sm font-semibold mb-2 text-gray-300">
              Any blockers or impediments?
            </label>
            <textarea
              id="blockers"
              name="blockers"
              rows={2}
              value={formik.values.blockers}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Use 'None' if you are good to go..."
              className={`w-full bg-white/5 border text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-200 placeholder-gray-500 ${
                formik.touched.blockers && formik.errors.blockers
                  ? 'border-errorRose/60'
                  : 'border-white/10'
              }`}
            />
            {formik.touched.blockers && formik.errors.blockers && (
              <p className="mt-1 text-xs text-errorRose font-medium">{formik.errors.blockers}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Status...</span>
              </>
            ) : (
              <span>Submit Daily Standup</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
