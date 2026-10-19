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
    minute: typeof value.minute === 'number' ? value.minute : undefined,
    home,
    away,
    score: parseScore(value.score),
  };
}

/**
 * Проверяет ответ сервера. Битые матчи пропускаем, но если структура ответа не та —
 * это уже не «данные странные», а ошибка, о которой нужно сказать пользователю.
 */
export function parseMatchesRound(payload: unknown): MatchesRound {
  if (!isRecord(payload) || !Array.isArray(payload.matches)) {
    throw new MatchesApiError('Сервер вернул данные в неожиданном формате');
  }
  const matches = payload.matches
    .map(parseMatch)
    .filter((match): match is Match => match !== null);

  return {
    round: typeof payload.round === 'number' ? payload.round : 0,
    matches,
  };
}

export type FetchMatchesOptions = {
  signal?: AbortSignal;
};

function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
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
    const response = await fetch(MATCHES_URL, {
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
