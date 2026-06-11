import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponse, MemberStatus, DigestData, Standup } from '../types';

export const standupApi = createApi({
  reducerPath: 'standupApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Members', 'Digest', 'DigestStatus'],
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
    })
  })
});

export const {
  useGetMembersQuery,
  useGetDigestQuery,
  useSubmitStandupMutation,
  useSendDigestMutation,
  useGetDigestStatusQuery
} = standupApi;
