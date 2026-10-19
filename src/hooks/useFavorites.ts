import { useCallback, useState } from 'react';

// Избранные матчи (по id). Хранятся только в памяти, пока открыто приложение.
export function useFavorites() {
  const [favorites, setFavorites] = useState<readonly string[]>([]);

  // Через includes, а не Boolean(indexOf(id)): indexOf возвращает -1, а это тоже truthy.
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  // Обновляем состояние иммутабельно: если мутировать массив и передать ту же ссылку,
  // React посчитает состояние неизменным и не перерисует экран.
  const toggle = useCallback((id: string) => {
    setFavorites((previous) =>
      previous.includes(id) ? previous.filter((favoriteId) => favoriteId !== id) : [...previous, id],
    );
  }, []);

  return { favorites, isFavorite, toggle };
}
