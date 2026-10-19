// Статусы, которые встречаются в данных. Незнакомый статус приводим к 'unknown',
// чтобы экран не падал на новых значениях с сервера.
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'unknown';

export type Team = {
  id: string;
  name: string;
  city: string;
};

export type Score = {
  home: number;
  away: number;
};

export type Match = {
  id: string;
  /** Время начала в ISO 8601 или null, если матч ещё не назначен (перенос). */
  startsAt: string | null;
  status: MatchStatus;
  /** Минута матча — есть только у идущих матчей. */
  minute?: number;
  home: Team;
  away: Team;
  /** Счёт null, пока матч не начался. */
  score: Score | null;
};

export type MatchesRound = {
  round: number;
  matches: Match[];
};
