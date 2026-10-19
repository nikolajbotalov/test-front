import { fireEvent, render, screen } from '@testing-library/react-native';

import { MatchesFilter } from './MatchesFilter';

describe('MatchesFilter', () => {
  it('показывает три фильтра и отмечает выбранный', async () => {
    await render(<MatchesFilter value="upcoming" onChange={jest.fn()} />);

    expect(screen.getByText('Все')).toBeTruthy();
    expect(screen.getByText('Предстоящие')).toBeTruthy();
    expect(screen.getByText('Завершённые')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Предстоящие' }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('сообщает о выборе другого фильтра', async () => {
    const onChange = jest.fn();
    await render(<MatchesFilter value="all" onChange={onChange} />);

    await fireEvent.press(screen.getByText('Завершённые'));

    expect(onChange).toHaveBeenCalledWith('finished');
  });
});
