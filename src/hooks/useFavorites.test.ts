import { act, renderHook } from '@testing-library/react-native';

import { useFavorites } from './useFavorites';

describe('useFavorites', () => {
  it('изначально пуст', async () => {
    const { result } = await renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite('m1')).toBe(false);
  });

  it('добавляет первый матч: индекс 0 не должен считаться «не избранным»', async () => {
    const { result } = await renderHook(() => useFavorites());

    await act(() => result.current.toggle('m1'));

    expect(result.current.favorites).toEqual(['m1']);
    expect(result.current.isFavorite('m1')).toBe(true);
  });

  it('добавляет и убирает только выбранный матч', async () => {
    const { result } = await renderHook(() => useFavorites());

    await act(() => result.current.toggle('m1'));
    await act(() => result.current.toggle('m2'));

    expect(result.current.isFavorite('m1')).toBe(true);
    expect(result.current.isFavorite('m2')).toBe(true);
    expect(result.current.isFavorite('m3')).toBe(false);

    await act(() => result.current.toggle('m1'));

    expect(result.current.favorites).toEqual(['m2']);
    expect(result.current.isFavorite('m1')).toBe(false);
  });

  it('обновляет массив иммутабельно, а не мутирует предыдущее состояние', async () => {
    const { result } = await renderHook(() => useFavorites());
    const before = result.current.favorites;

    await act(() => result.current.toggle('m1'));

    expect(result.current.favorites).not.toBe(before);
    expect(before).toEqual([]);
  });

  it('двойное нажатие возвращает исходное состояние', async () => {
    const { result } = await renderHook(() => useFavorites());

    await act(() => result.current.toggle('m1'));
    await act(() => result.current.toggle('m1'));

    expect(result.current.favorites).toEqual([]);
  });
});
