import type { Match, MatchStatus } from '../types';

export const MATCH_FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'finished', label: 'Завершённые' },
] as const;

export type MatchesFilterKey = (typeof MATCH_FILTERS)[number]['key'];

// «Предстоящие» — это всё, что ещё не завершилось: запланированные, идущие и перенесённые
// матчи. Так ни один матч не пропадает из фильтров; у идущего матча есть свой бейдж.
const UPCOMING_STATUSES: readonly MatchStatus[] = ['scheduled', 'live', 'postponed'];

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Предстоящий',
  live: 'Идёт',
  finished: 'Завершён',
  postponed: 'Перенесён',
  unknown: 'Статус неизвестен',
};

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Дата и время начала в часовом поясе устройства. */
export function formatMatchDateTime(
  startsAt: string | null,
  formatter: Intl.DateTimeFormat = dateTimeFormatter,
): string {
  if (startsAt === null) {
    return 'Дата уточняется';
  }
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return 'Дата уточняется';
  }
  return formatter.format(date);
}

export function getStatusLabel(match: Match): string {
  if (match.status === 'live' && typeof match.minute === 'number') {
    return `Идёт, ${match.minute}′`;
  }
  return STATUS_LABELS[match.status];
}

/** Счёт показываем только когда он есть: 0:0 — валидный счёт, «нет счёта» — это null. */
export function formatScore(match: Match): string {
  if (match.score === null) {
    return '—';
  }
  return `${match.score.home}:${match.score.away}`;
}

export function matchesFilter(match: Match, filter: MatchesFilterKey): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'upcoming':
      return UPCOMING_STATUSES.includes(match.status);
    case 'finished':
      return match.status === 'finished';
  }
}

export function matchesQuery(match: Match, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return [match.home.name, match.away.name].some((name) =>
    name.toLowerCase().includes(needle),
  );
}

function startTimestamp(match: Match): number | null {
  if (match.startsAt === null) {
    return null;
  }
  const timestamp = Date.parse(match.startsAt);
  return Number.isNaN(timestamp) ? null : timestamp;
}

/** Сортировка по времени начала; матчи без даты (перенос) уезжают в конец списка. */
export function compareMatchesByStart(a: Match, b: Match): number {
  const aStart = startTimestamp(a);
  const bStart = startTimestamp(b);
  if (aStart === null && bStart === null) {
    return a.id.localeCompare(b.id);
  }
  if (aStart === null) {
    return 1;
  }
  if (bStart === null) {
    return -1;
  }
  return aStart - bStart || a.id.localeCompare(b.id);
}

export type SelectMatchesOptions = {
  filter: MatchesFilterKey;
  query?: string;
};

/** Фильтр по статусу + поиск по клубу + сортировка. Чистая функция — удобно тестировать. */
export function selectMatches(matches: readonly Match[], options: SelectMatchesOptions): Match[] {
  const { filter, query = '' } = options;
  return matches
    .filter((match) => matchesFilter(match, filter) && matchesQuery(match, query))
    .sort(compareMatchesByStart);
}

/** Сколько секунд прошло с момента последней загрузки — для подписи UpdatedAgo. */
export function elapsedSeconds(since: Date, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - since.getTime()) / 1000));
}
