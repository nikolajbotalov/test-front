import matchesFixture from '../../data/matches.json';
import { REQUEST_TIMEOUT_MS } from '../config';
import { MatchesApiError, fetchMatches, parseMatchesRound } from './matches';
import { buildMatch, jsonResponse, networkError } from '../test-utils/matches';

const originalFetch = globalThis.fetch;
let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});

describe('parseMatchesRound', () => {
  it('разбирает реальный ответ сервера вместе с неочевидными случаями', () => {
    const { round, matches } = parseMatchesRound(matchesFixture);

    expect(round).toBe(12);
    expect(matches).toHaveLength(8);

    const postponed = matches.find((match) => match.id === 'm7');
    expect(postponed?.startsAt).toBeNull();
    expect(postponed?.status).toBe('postponed');

    const live = matches.find((match) => match.id === 'm4');
    expect(live?.status).toBe('live');
    expect(live?.minute).toBe(67);

    const goalless = matches.find((match) => match.id === 'm2');
    expect(goalless?.score).toEqual({ home: 0, away: 0 });
  });

  it('пропускает битые матчи, но оставляет целые', () => {
    const { matches } = parseMatchesRound({
      round: 12,
      matches: [
        buildMatch({ id: 'ok' }),
        { id: 'без-команд', status: 'scheduled' },
        null,
        'строка',
      ],
    });

    expect(matches.map((match) => match.id)).toEqual(['ok']);
  });

  it('считает битый счёт отсутствующим, не теряя матч', () => {
    const { matches } = parseMatchesRound({
      matches: [{ ...buildMatch(), score: { home: '2', away: 1 } }],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBeNull();
  });

  it('приводит незнакомый статус к unknown и битую дату к null', () => {
    const { matches } = parseMatchesRound({
      matches: [{ ...buildMatch(), status: 'cancelled', startsAt: 'не дата' }],
    });

    expect(matches[0].status).toBe('unknown');
    expect(matches[0].startsAt).toBeNull();
  });

  it('падает с понятной ошибкой, если структура ответа не та', () => {
    expect(() => parseMatchesRound({ matches: 'нет' })).toThrow(MatchesApiError);
    expect(() => parseMatchesRound(null)).toThrow('неожиданном формате');
  });

  it('падает с ошибкой, если матчи есть, но ни один не разобрался', () => {
    expect(() => parseMatchesRound({ matches: [{ id: 1 }, 'мусор'] })).toThrow(
      'неожиданном формате',
    );
  });

  it('не показывает номер тура, если сервер его не прислал', () => {
    expect(parseMatchesRound({ matches: [] }).round).toBeNull();
  });

  it('оставляет первый матч из дубликатов id, чтобы не ломать ключи списка', () => {
    const { matches } = parseMatchesRound({
      matches: [buildMatch({ id: 'same' }), buildMatch({ id: 'same', status: 'live' })],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe('scheduled');
  });

  it('игнорирует отрицательную и дробную минуту', () => {
    const { matches } = parseMatchesRound({
      matches: [
        { ...buildMatch({ id: 'a' }), minute: -3 },
        { ...buildMatch({ id: 'b' }), minute: 67.5 },
      ],
    });

    expect(matches.map((match) => match.minute)).toEqual([undefined, undefined]);
  });
});

describe('fetchMatches', () => {
  it('возвращает разобранные матчи', async () => {
    fetchMock.mockResolvedValue(jsonResponse(matchesFixture));

    await expect(fetchMatches()).resolves.toEqual(parseMatchesRound(matchesFixture));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/matches\.json\?t=\d+/),
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('сообщает об ошибке сервера', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, { ok: false, status: 500 }));

    await expect(fetchMatches()).rejects.toThrow('500');
  });

  it('сообщает, если ответ не удалось прочитать как JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(fetchMatches()).rejects.toThrow('прочитать ответ');
  });

  it('превращает ошибку сети в понятное сообщение', async () => {
    fetchMock.mockRejectedValue(networkError());

    await expect(fetchMatches()).rejects.toThrow('Проверьте соединение');
  });

  it('сообщает о таймауте, если сервер не отвечает', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const promise = fetchMatches();
    const assertion = expect(promise).rejects.toThrow('не ответил вовремя');
    jest.advanceTimersByTime(REQUEST_TIMEOUT_MS);

    await assertion;
  });

  it('пробрасывает отмену по инициативе вызывающего', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const controller = new AbortController();

    const promise = fetchMatches({ signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('сообщает, если загрузку прервал не вызывающий', async () => {
    // fetch бросает DOMException, а не Error — проверяем именно такой случай.
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(fetchMatches()).rejects.toThrow('Загрузка прервана');
  });
});
