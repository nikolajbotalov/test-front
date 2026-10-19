import { MATCHES_URL, REQUEST_TIMEOUT_MS } from '../config';
import type { Match, MatchStatus, MatchesRound, Score, Team } from '../types';

/** Ошибка загрузки матчей с понятным для пользователя сообщением. */
export class MatchesApiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MatchesApiError';
  }
}

const KNOWN_STATUSES: readonly string[] = ['scheduled', 'live', 'finished', 'postponed'];

function normalizeStatus(value: unknown): MatchStatus {
  return KNOWN_STATUSES.includes(value as string) ? (value as MatchStatus) : 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseTeam(value: unknown): Team | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    city: typeof value.city === 'string' ? value.city : '',
  };
}

/** Счёт может отсутствовать, но 0:0 — валидный счёт, поэтому проверяем только тип. */
function parseScore(value: unknown): Score | null {
  if (!isRecord(value)) {
    return null;
  }
  const { home, away } = value;
  if (typeof home !== 'number' || typeof away !== 'number') {
    return null;
  }
  return { home, away };
}

/** Мусорную дату превращаем в null, чтобы не печатать «Invalid Date». */
function parseStartsAt(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  return Number.isNaN(Date.parse(value)) ? null : value;
}

/** Минута есть только у идущего матча и должна быть целым неотрицательным числом. */
function parseMinute(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function parseMatch(value: unknown): Match | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }
  const home = parseTeam(value.home);
  const away = parseTeam(value.away);
  if (!home || !away) {
    return null;
  }
  return {
    id: value.id,
    startsAt: parseStartsAt(value.startsAt),
    status: normalizeStatus(value.status),
    minute: parseMinute(value.minute),
    home,
    away,
    score: parseScore(value.score),
  };
}

/**
 * Проверяет ответ сервера. Битые матчи пропускаем, но если структура ответа не та
 * или разобрать не удалось ни одного матча — это уже ошибка, о которой нужно сказать.
 */
export function parseMatchesRound(payload: unknown): MatchesRound {
  if (!isRecord(payload) || !Array.isArray(payload.matches)) {
    throw new MatchesApiError('Сервер вернул данные в неожиданном формате');
  }

  const matches: Match[] = [];
  const seenIds = new Set<string>();
  for (const item of payload.matches) {
    const match = parseMatch(item);
    // id — ключ списка и избранного, дубликаты сломали бы и то, и другое.
    if (match === null || seenIds.has(match.id)) {
      continue;
    }
    seenIds.add(match.id);
    matches.push(match);
  }

  if (payload.matches.length > 0 && matches.length === 0) {
    throw new MatchesApiError('Сервер вернул данные в неожиданном формате');
  }

  return {
    round: typeof payload.round === 'number' ? payload.round : null,
    matches,
  };
}

export type FetchMatchesOptions = {
  signal?: AbortSignal;
};

/** fetch бросает и Error, и DOMException — проверяем только имя. */
function isAbortError(cause: unknown): boolean {
  return typeof cause === 'object' && cause !== null && (cause as { name?: unknown }).name === 'AbortError';
}

export async function fetchMatches({ signal }: FetchMatchesOptions = {}): Promise<MatchesRound> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    // GitHub raw отдаёт data/matches.json с Cache-Control: max-age=300,
    // поэтому к «Обновить» добавляем параметр, чтобы не показать закэшированные данные.
    const cacheBuster = `t=${Date.now()}`;
    const url = `${MATCHES_URL}${MATCHES_URL.includes('?') ? '&' : '?'}${cacheBuster}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new MatchesApiError(`Сервер вернул ошибку ${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new MatchesApiError('Не удалось прочитать ответ сервера', cause);
    }

    return parseMatchesRound(payload);
  } catch (cause) {
    // Отмену по инициативе вызывающего пробрасываем как есть — экран её игнорирует.
    if (signal?.aborted && !timedOut) {
      throw cause;
    }
    if (cause instanceof MatchesApiError) {
      throw cause;
    }
    if (timedOut) {
      throw new MatchesApiError('Сервер не ответил вовремя. Проверьте соединение', cause);
    }
    if (isAbortError(cause)) {
      throw new MatchesApiError('Загрузка прервана', cause);
    }
    throw new MatchesApiError('Не удалось связаться с сервером. Проверьте соединение', cause);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
