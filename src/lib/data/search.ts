import { fetchJobs } from './jobs';
import { fetchUpdates } from './updates';
import { fetchAllStates } from './states';
import { fetchAdmitCards } from './admitCards';
import { fetchResults } from './results';
import { fetchAnswerKeys } from './answerKeys';
import {
  JobVacancy,
  GovernmentUpdate,
  StateInfo,
  AdmitCardItem,
  ResultItem,
  AnswerKeyItem,
} from '../../types';

export interface UnifiedSearchResults {
  jobs: JobVacancy[];
  updates: GovernmentUpdate[];
  states: StateInfo[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  answerKeys: AnswerKeyItem[];
  totalMatches: number;
}

export async function searchAll(
  query: string,
  filterType: 'all' | 'jobs' | 'states' | 'admit-cards' | 'results' | 'answer-keys' | 'updates' = 'all'
): Promise<UnifiedSearchResults> {
  const q = (query || '').trim().toLowerCase();

  const [
    jobsRes,
    updatesRes,
    allStates,
    admitCardsRes,
    resultsRes,
    answerKeysRes,
  ] = await Promise.all([
    fetchJobs({ searchQuery: q, pageSize: 50 }),
    fetchUpdates({ searchQuery: q, pageSize: 50 }),
    fetchAllStates(),
    fetchAdmitCards({ searchQuery: q, pageSize: 50 }),
    fetchResults({ searchQuery: q, pageSize: 50 }),
    fetchAnswerKeys({ searchQuery: q, pageSize: 50 }),
  ]);

  const matchedStates = q
    ? allStates.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.capital.toLowerCase().includes(q) ||
          s.highlightOrganizations.some((org) => org.toLowerCase().includes(q))
      )
    : allStates;

  const jobs = filterType === 'all' || filterType === 'jobs' ? jobsRes.data : [];
  const updates = filterType === 'all' || filterType === 'updates' ? updatesRes.data : [];
  const states = filterType === 'all' || filterType === 'states' ? matchedStates : [];
  const admitCards = filterType === 'all' || filterType === 'admit-cards' ? admitCardsRes.data : [];
  const results = filterType === 'all' || filterType === 'results' ? resultsRes.data : [];
  const answerKeys = filterType === 'all' || filterType === 'answer-keys' ? answerKeysRes.data : [];

  const totalMatches =
    jobs.length +
    updates.length +
    states.length +
    admitCards.length +
    results.length +
    answerKeys.length;

  return {
    jobs,
    updates,
    states,
    admitCards,
    results,
    answerKeys,
    totalMatches,
  };
}
