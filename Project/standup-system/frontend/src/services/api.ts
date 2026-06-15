import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponse, MemberStatus, DigestData, Standup } from '../types';

export const standupApi = createApi({
  reducerPath: 'standupApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Members', 'Digest', 'DigestStatus', 'Kudos', 'Analytics', 'Archive'],
  endpoints: (builder) => ({
    getMembers: builder.query<ApiResponse<{ date: string; members: MemberStatus[] }>, string | void>({
      query: (date) => `/standups/members${date ? `?date=${date}` : ''}`,
      providesTags: ['Members']
    }),
    getDigest: builder.query<ApiResponse<DigestData>, string | void>({
      query: (date) => `/standups${date ? `?date=${date}` : ''}`,
      providesTags: ['Digest']
    }),
    submitStandup: builder.mutation<ApiResponse<Standup>, {
      member_name: string;
      member_email: string;
      yesterday: string;
      today: string;
      blockers: string;
    }>({
      query: (body) => ({
        url: '/standups',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Members', 'Digest']
    }),
    sendDigest: builder.mutation<ApiResponse<any>, { date: string; recipient_email: string }>({
      query: (body) => ({
        url: '/digest/send',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DigestStatus']
    }),
    getDigestStatus: builder.query<ApiResponse<{
      date: string;
      digest_sent: boolean;
      sent_at: string | null;
      recipient: string;
      submissions_included: number;
    }>, string>({
      query: (date) => `/digest/status?date=${date}`,
      providesTags: ['DigestStatus']
    }),
    // V2 - Kudos
    getKudosLeaderboard: builder.query<ApiResponse<{ leaderboard: any[] }>, void>({
      query: () => '/kudos/leaderboard',
      providesTags: ['Kudos']
    }),
    getKudosFeed: builder.query<ApiResponse<{ kudos: any[]; total: number }>, number>({
      query: (limit = 20) => `/kudos/feed?limit=${limit}`,
      providesTags: ['Kudos']
    }),
    submitKudos: builder.mutation<ApiResponse<any>, {
      from_member: string;
      to_member: string;
      message: string;
    }>({
      query: (body) => ({
        url: '/kudos',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Kudos']
    }),
    // V2 - Analytics
    getSprintAnalytics: builder.query<ApiResponse<any>, string>({
      query: (date) => `/analytics/sprint?date=${date}`,
      providesTags: ['Analytics']
    }),
    // V2 - Archive
    searchArchive: builder.query<ApiResponse<any>, {
      q?: string;
      dateFrom?: string;
      dateTo?: string;
      memberEmail?: string;
      page?: number;
      limit?: number;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.q) searchParams.set('q', params.q);
        if (params.dateFrom) searchParams.set('date_from', params.dateFrom);
        if (params.dateTo) searchParams.set('date_to', params.dateTo);
        if (params.memberEmail) searchParams.set('member_email', params.memberEmail);
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());
        return `/archive/search?${searchParams.toString()}`;
      },
      providesTags: ['Archive']
    }),
    clearAllData: builder.mutation<ApiResponse<any>, void>({
      query: () => ({
        url: '/dev/clear-all',
        method: 'POST'
      }),
      invalidatesTags: ['Members', 'Digest', 'Kudos', 'Analytics', 'Archive']
    })
  })
});

export const {
  useGetMembersQuery,
  useGetDigestQuery,
  useSubmitStandupMutation,
  useSendDigestMutation,
  useGetDigestStatusQuery,
  useGetKudosLeaderboardQuery,
  useGetKudosFeedQuery,
  useSubmitKudosMutation,
  useGetSprintAnalyticsQuery,
  useSearchArchiveQuery,
  useClearAllDataMutation,
  util: { resetApiState }
} = standupApi;