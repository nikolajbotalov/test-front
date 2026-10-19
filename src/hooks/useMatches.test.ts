import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMatches } from './useMatches';
import { buildMatch, jsonResponse, networkError } from '../test-utils/matches';

const originalFetch = globalThis.fetch;
let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const payload = {
  round: 12,
  matches: [buildMatch({ id: 'm1', status: 'finished', score: { home: 2, away: 1 } })],
};

describe('useMatches', () => {
  it('начинает с загрузки и переходит к данным', async () => {
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = await renderHook(() => useMatches());
    expect(result.current.status).toBe('loading');

    await act(async () => {
      resolveFetch(jsonResponse(payload));
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.matches).toEqual(payload.matches);
    expect(result.current.round).toBe(12);
    expect(result.current.error).toBeNull();
    expect(result.current.updatedAt).toBeInstanceOf(Date);
  });

  it('показывает ошибку, если первая загрузка не удалась', async () => {
    fetchMock.mockRejectedValue(networkError());

    const { result } = await renderHook(() => useMatches());
    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toContain('соединение');
    expect(result.current.matches).toEqual([]);
  });

  it('повторная загрузка после ошибки показывает данные', async () => {
    fetchMock.mockRejectedValueOnce(networkError()).mockResolvedValueOnce(jsonResponse(payload));

    const { result } = await renderHook(() => useMatches());
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => {
      result.current.reload();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.error).toBeNull();
    expect(result.current.matches).toHaveLength(1);
  });

  it('ошибка обновления не стирает уже загруженный список', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(payload)).mockRejectedValueOnce(networkError());

    const { result } = await renderHook(() => useMatches());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      result.current.reload();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.matches).toEqual(payload.matches);
    expect(result.current.error).toContain('соединение');
  });

  it('игнорирует ответ устаревшего запроса', async () => {
    const resolvers: ((response: Response) => void)[] = [];
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { result } = await renderHook(() => useMatches());
    await waitFor(() => expect(resolvers).toHaveLength(1));

    await act(async () => {
      void result.current.reload();
    });
    await waitFor(() => expect(resolvers).toHaveLength(2));

    await act(async () => {
      resolvers[1](jsonResponse({ round: 12, matches: [buildMatch({ id: 'fresh' })] }));
      resolvers[0](jsonResponse({ round: 12, matches: [buildMatch({ id: 'stale' })] }));
    });

    await waitFor(() =>
      expect(result.current.matches.map((match) => match.id)).toEqual(['fresh']),
    );
  });

  it('отменяет запрос при размонтировании', async () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal = init.signal;
          init.signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const { unmount } = await renderHook(() => useMatches());
    await unmount();

    expect(signal?.aborted).toBe(true);
  });
});
