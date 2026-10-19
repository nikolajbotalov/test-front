import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MatchesScreen } from './MatchesScreen';
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

const matches = [
  buildMatch({
    id: 'finished',
    startsAt: '2026-10-11T13:00:00Z',
    status: 'finished',
    score: { home: 2, away: 1 },
    home: { id: 'zenit', name: 'Зенит', city: 'Санкт-Петербург' },
    away: { id: 'spartak', name: 'Спартак', city: 'Москва' },
  }),
  buildMatch({
    id: 'live',
    startsAt: '2026-10-15T16:00:00Z',
    status: 'live',
    minute: 67,
    score: { home: 1, away: 1 },
    home: { id: 'dynamo', name: 'Динамо', city: 'Москва' },
    away: { id: 'rubin', name: 'Рубин', city: 'Казань' },
  }),
  buildMatch({
    id: 'postponed',
    startsAt: null,
    status: 'postponed',
    home: { id: 'baltika', name: 'Балтика', city: 'Калининград' },
    away: { id: 'fakel', name: 'Факел', city: 'Воронеж' },
  }),
];

async function renderLoadedScreen() {
  fetchMock.mockResolvedValue(jsonResponse({ round: 12, matches }));
  await render(<MatchesScreen />);
  await screen.findByText('Зенит');
}

describe('MatchesScreen', () => {
  it('показывает загрузку, а затем матчи тура', async () => {
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    await render(<MatchesScreen />);

    expect(screen.getByText('Загружаем матчи…')).toBeTruthy();

    await act(async () => {
      resolveFetch(jsonResponse({ round: 12, matches }));
    });
    await screen.findByText('Зенит');

    expect(screen.getByText('Тур 12')).toBeTruthy();
    expect(screen.getByText('Рубин')).toBeTruthy();
    expect(screen.getByText('Идёт, 67′')).toBeTruthy();
    expect(screen.getByText('Балтика')).toBeTruthy();
  });

  it('фильтрует по статусу: завершённые, предстоящие (включая live и postponed)', async () => {
    await renderLoadedScreen();

    await fireEvent.press(screen.getByText('Завершённые'));
    expect(screen.getByText('Зенит')).toBeTruthy();
    expect(screen.queryByText('Рубин')).toBeNull();
    expect(screen.queryByText('Балтика')).toBeNull();

    await fireEvent.press(screen.getByText('Предстоящие'));
    expect(screen.queryByText('Зенит')).toBeNull();
    expect(screen.getByText('Рубин')).toBeTruthy();
    expect(screen.getByText('Балтика')).toBeTruthy();
  });

  it('ищет по названию клуба и показывает пустое состояние фильтра', async () => {
    await renderLoadedScreen();

    await fireEvent.changeText(screen.getByLabelText('Поиск по названию клуба'), 'зенит');
    expect(screen.getByText('Зенит')).toBeTruthy();
    expect(screen.queryByText('Рубин')).toBeNull();

    await fireEvent.changeText(
      screen.getByLabelText('Поиск по названию клуба'),
      'нет такого клуба',
    );
    expect(screen.getByText('Ничего не найдено')).toBeTruthy();

    await fireEvent.press(screen.getByText('Сбросить фильтры'));
    expect(screen.getByText('Рубин')).toBeTruthy();
  });

  it('подключает звёздочку только к выбранной карточке', async () => {
    await renderLoadedScreen();

    expect(screen.getAllByLabelText('Добавить в избранное')).toHaveLength(3);

    await fireEvent.press(screen.getAllByLabelText('Добавить в избранное')[0]);

    expect(screen.getAllByLabelText('Убрать из избранного')).toHaveLength(1);
    expect(screen.getAllByLabelText('Добавить в избранное')).toHaveLength(2);
  });

  it('показывает ошибку и повторяет загрузку', async () => {
    fetchMock
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(jsonResponse({ round: 12, matches }));
    await render(<MatchesScreen />);

    await screen.findByText('Не получилось загрузить матчи');
    expect(screen.getByText(/соединение/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Повторить'));

    await screen.findByText('Зенит');
  });

  it('показывает пустой экран, если матчей нет', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ round: 12, matches: [] }));
    await render(<MatchesScreen />);

    await waitFor(() => expect(screen.getByText('Матчей пока нет')).toBeTruthy());
  });

  it('обновляет данные по кнопке', async () => {
    await renderLoadedScreen();

    await fireEvent.press(screen.getByText('Обновить'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Зенит')).toBeTruthy();
  });
});


