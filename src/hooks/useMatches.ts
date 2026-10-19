import { useCallback, useEffect, useRef, useState } from 'react';

import { MatchesApiError, fetchMatches } from '../api/matches';
import type { Match } from '../types';

export type MatchesStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(cause: unknown): string {
  if (cause instanceof MatchesApiError) {
    return cause.message;
  }
  return 'Не удалось загрузить матчи';
}

/**
 * Загрузка матчей: первичный лоадер, повторная загрузка (кнопка и pull-to-refresh),
 * отмена устаревших запросов и защита от setState после размонтирования.
 */
export function useMatches() {
  const [matches, setMatches] = useState<readonly Match[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [status, setStatus] = useState<MatchesStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // Меняется при каждом обновлении — эффект ниже перезапускает загрузку.
  const [requestKey, setRequestKey] = useState(0);

  const hasDataRef = useRef(false);

  const reload = useCallback(() => {
    // Обработчик события, а не эффект: синхронно показать лоадер здесь безопасно.
    if (!hasDataRef.current) {
      setStatus('loading');
    }
    setIsRefreshing(true);
    setRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchMatches({ signal: controller.signal })
      .then((data) => {
        if (!active) {
          return;
        }
        setMatches(data.matches);
        setRound(data.round);
        setUpdatedAt(new Date());
        setError(null);
        hasDataRef.current = true;
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) {
          return;
        }
        setError(toErrorMessage(cause));
        // Если данные уже были — не стираем список, показываем ошибку баннером.
        setStatus(hasDataRef.current ? 'ready' : 'error');
      })
      .finally(() => {
        if (active) {
          setIsRefreshing(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey]);

  return { matches, round, status, isRefreshing, error, updatedAt, reload };
}
