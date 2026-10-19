import {
  compareMatchesByStart,
  elapsedSeconds,
  formatMatchDateTime,
  formatScore,
  getStatusLabel,
  matchesFilter,
  matchesQuery,
  selectMatches,
} from './matches';
import { buildMatch } from '../test-utils/matches';

const finished = buildMatch({
  id: 'finished',
  status: 'finished',
  startsAt: '2026-10-11T13:00:00Z',
  score: { home: 2, away: 1 },
});
const scheduled = buildMatch({
  id: 'scheduled',
  status: 'scheduled',
  startsAt: '2026-10-18T11:30:00Z',
});
const live = buildMatch({ id: 'live', status: 'live', startsAt: '2026-10-15T16:00:00Z', minute: 67 });
const postponed = buildMatch({ id: 'postponed', status: 'postponed', startsAt: null });
const unknown = buildMatch({ id: 'unknown', status: 'unknown', startsAt: '2026-10-19T16:30:00Z' });

const allMatches = [unknown, postponed, live, scheduled, finished];

describe('matchesFilter', () => {
  it('относит к «Предстоящим» всё, что не завершено: scheduled, live и postponed', () => {
    const upcoming = allMatches.filter((match) => matchesFilter(match, 'upcoming'));

    expect(upcoming.map((match) => match.id).sort()).toEqual(['live', 'postponed', 'scheduled']);
  });

  it('показывает в «Завершённых» только finished', () => {
    const finishedMatches = allMatches.filter((match) => matchesFilter(match, 'finished'));

    expect(finishedMatches.map((match) => match.id)).toEqual(['finished']);
  });

  it('в «Все» показывает матчи с любым, в том числе неизвестным статусом', () => {
    expect(allMatches.filter((match) => matchesFilter(match, 'all'))).toHaveLength(allMatches.length);
  });
});

describe('matchesQuery', () => {
  it('ищет по названию хозяев и гостей без учёта регистра', () => {
    const zenit = buildMatch({ home: { id: 'zenit', name: 'Зенит', city: 'Санкт-Петербург' } });

    expect(matchesQuery(zenit, 'зЕнИт')).toBe(true);
    expect(matchesQuery(zenit, 'ЗЕНИТ')).toBe(true);
  });

  it('игнорирует пробелы вокруг запроса и пустой запрос', () => {
    const spartak = buildMatch({ away: { id: 'spartak', name: 'Спартак', city: 'Москва' } });

    expect(matchesQuery(spartak, '  спартак ')).toBe(true);
    expect(matchesQuery(spartak, '   ')).toBe(true);
  });

  it('не находит матч, если клуб не совпадает', () => {
    const cska = buildMatch({ away: { id: 'cska', name: 'ЦСКА', city: 'Москва' } });

    expect(matchesQuery(cska, 'Зенит')).toBe(false);
  });
});

describe('compareMatchesByStart', () => {
  it('сортирует по времени начала', () => {
    expect([...allMatches].sort(compareMatchesByStart).map((match) => match.id)).toEqual([
      'finished',
      'live',
      'scheduled',
      'unknown',
      'postponed',
    ]);
  });

  it('считает матчи без даты равными между собой и ставит их по id', () => {
    const a = buildMatch({ id: 'a', startsAt: null });
    const b = buildMatch({ id: 'b', startsAt: null });

    expect(compareMatchesByStart(a, b)).toBeLessThan(0);
    expect(compareMatchesByStart(b, a)).toBeGreaterThan(0);
  });
});

describe('selectMatches', () => {
  it('фильтрует, ищет и сортирует одновременно', () => {
    const result = selectMatches(
      [
        buildMatch({ id: 'a', status: 'finished', home: { id: 'a', name: 'Зенит', city: 'СПб' } }),
        buildMatch({ id: 'b', status: 'scheduled', home: { id: 'b', name: 'Зенит', city: 'СПб' } }),
        buildMatch({ id: 'c', status: 'scheduled', home: { id: 'c', name: 'Ростов', city: 'Ростов' } }),
      ],
      { filter: 'upcoming', query: 'зенит' },
    );

    expect(result.map((match) => match.id)).toEqual(['b']);
  });

  it('не мутирует исходный массив', () => {
    const source = [scheduled, finished];
    const snapshot = [...source];

    selectMatches(source, { filter: 'all' });

    expect(source).toEqual(snapshot);
  });
});

describe('formatMatchDateTime', () => {
  it('печатает дату и время в часовом поясе устройства', () => {
    const local = new Date(2026, 9, 11, 16, 0);

    expect(formatMatchDateTime(local.toISOString())).toBe('11.10.2026, 16:00');
  });

  it('для матча без даты и битой даты возвращает понятный текст', () => {
    expect(formatMatchDateTime(null)).toBe('Дата уточняется');
    expect(formatMatchDateTime('не дата')).toBe('Дата уточняется');
  });
});

describe('formatScore', () => {
  it('показывает счёт, в том числе 0:0', () => {
    expect(formatScore(buildMatch({ score: { home: 0, away: 0 } }))).toBe('0:0');
    expect(formatScore(buildMatch({ score: { home: 3, away: 2 } }))).toBe('3:2');
  });

  it('вместо отсутствующего счёта показывает прочерк', () => {
    expect(formatScore(buildMatch({ score: null }))).toBe('—');
  });
});

describe('getStatusLabel', () => {
  it('переводит статусы на русский', () => {
    expect(getStatusLabel(scheduled)).toBe('Предстоящий');
    expect(getStatusLabel(finished)).toBe('Завершён');
    expect(getStatusLabel(postponed)).toBe('Перенесён');
    expect(getStatusLabel(unknown)).toBe('Статус неизвестен');
  });

  it('добавляет минуту к идущему матчу', () => {
    expect(getStatusLabel(live)).toBe('Идёт, 67′');
    expect(getStatusLabel(buildMatch({ status: 'live' }))).toBe('Идёт');
  });
});

describe('elapsedSeconds', () => {
  it('считает секунды от момента загрузки и не уходит в минус', () => {
    const since = new Date('2026-10-19T12:00:00Z');

    expect(elapsedSeconds(since, since.getTime() + 5_900)).toBe(5);
    expect(elapsedSeconds(since, since.getTime() - 1_000)).toBe(0);
  });
});
