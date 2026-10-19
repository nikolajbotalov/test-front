import { fireEvent, render, screen } from '@testing-library/react-native';

import { MatchCard } from './MatchCard';
import { buildMatch } from '../test-utils/matches';

const startsAt = new Date(2026, 9, 11, 16, 0).toISOString();

describe('MatchCard', () => {
  it('показывает команды, счёт, дату и статус', async () => {
    await render(
      <MatchCard
        match={buildMatch({
          id: 'm1',
          startsAt,
          status: 'finished',
          score: { home: 2, away: 1 },
          home: { id: 'zenit', name: 'Зенит', city: 'Санкт-Петербург' },
          away: { id: 'spartak', name: 'Спартак', city: 'Москва' },
        })}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />,
    );

    expect(screen.getByText('Зенит')).toBeTruthy();
    expect(screen.getByText('Спартак')).toBeTruthy();
    expect(screen.getByText('Санкт-Петербург')).toBeTruthy();
    expect(screen.getByText('2:1')).toBeTruthy();
    expect(screen.getByText('11.10.2026, 16:00')).toBeTruthy();
    expect(screen.getByText('Завершён')).toBeTruthy();
  });

  it('не теряет счёт 0:0', async () => {
    await render(
      <MatchCard
        match={buildMatch({ score: { home: 0, away: 0 }, status: 'finished' })}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />,
    );

    expect(screen.getByText('0:0')).toBeTruthy();
  });

  it('показывает прочерк и понятную дату, если счёта и даты ещё нет', async () => {
    await render(
      <MatchCard
        match={buildMatch({ startsAt: null, status: 'postponed', score: null })}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />,
    );

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('Дата уточняется')).toBeTruthy();
    expect(screen.getByText('Перенесён')).toBeTruthy();
  });

  it('показывает минуту идущего матча', async () => {
    await render(
      <MatchCard
        match={buildMatch({ status: 'live', minute: 67 })}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />,
    );

    expect(screen.getByText('Идёт, 67′')).toBeTruthy();
  });

  it('нажимает на звёздочку выбранного матча', async () => {
    const onToggleFavorite = jest.fn();
    const match = buildMatch({ id: 'm42' });

    await render(<MatchCard match={match} isFavorite={false} onToggleFavorite={onToggleFavorite} />);
    await fireEvent.press(screen.getByLabelText('Добавить в избранное'));

    expect(onToggleFavorite).toHaveBeenCalledWith('m42');
  });

  it('показывает закрашенную звезду для избранного матча', async () => {
    await render(<MatchCard match={buildMatch()} isFavorite onToggleFavorite={jest.fn()} />);

    expect(screen.getByLabelText('Убрать из избранного')).toBeTruthy();
    expect(screen.getByText('★')).toBeTruthy();
  });
});
