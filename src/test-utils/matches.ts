import type { Match } from '../types';

/** Билдер матча: в тестах переопределяем только нужные поля. */
export function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'test-match',
    startsAt: '2026-10-11T13:00:00Z',
    status: 'scheduled',
    home: { id: 'home', name: 'Хозяева', city: 'Город хозяев' },
    away: { id: 'away', name: 'Гости', city: 'Город гостей' },
    score: null,
    ...overrides,
  };
}

/** Минимальный ответ сервера для мока fetch. */
export function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

/** Мок fetch, который бросается ошибкой сети, как настоящий fetch при обрыве соединения. */
export function networkError(): Error {
  return new TypeError('Network request failed');
}
