import type { MatchingError, MatchResult } from './types';

export const combineResults = (...results: MatchResult[]): MatchResult =>
  results.flat();

export const makeResults = (...err: MatchingError[]): MatchResult => [...err];
