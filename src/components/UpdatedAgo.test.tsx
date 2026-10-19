import { act, render, screen } from '@testing-library/react-native';

import { UpdatedAgo } from './UpdatedAgo';

const SINCE = new Date('2026-10-19T12:00:00Z');

describe('UpdatedAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-19T12:00:10Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('показывает, сколько секунд прошло с загрузки, и тикает каждую секунду', async () => {
    await render(<UpdatedAgo since={SINCE} />);

    expect(screen.getByText('Обновлено 10 сек назад')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3_000);
    });

    expect(screen.getByText('Обновлено 13 сек назад')).toBeTruthy();
  });

  it('сбрасывается, когда приходит новая дата загрузки', async () => {
    const { rerender } = await render(<UpdatedAgo since={SINCE} />);

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('Обновлено 15 сек назад')).toBeTruthy();

    await rerender(<UpdatedAgo since={new Date()} />);

    expect(screen.getByText('Обновлено 0 сек назад')).toBeTruthy();
  });

  it('останавливает таймер при размонтировании', async () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { unmount } = await render(<UpdatedAgo since={SINCE} />);

    await unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
