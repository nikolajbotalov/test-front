import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { MatchCard } from '../components/MatchCard';
import { MatchesFilter } from '../components/MatchesFilter';
import { SearchField } from '../components/SearchField';
import { EmptyState, ErrorState, LoadingState } from '../components/StateView';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { useFavorites } from '../hooks/useFavorites';
import { useMatches } from '../hooks/useMatches';
import { selectMatches, type MatchesFilterKey } from '../lib/matches';
import type { Match } from '../types';

// Экран «Матчи тура» — задание в README.md, часть 1.
export function MatchesScreen() {
  const { matches, round, status, isRefreshing, error, updatedAt, reload } = useMatches();
  const { isFavorite, toggle } = useFavorites();
  const [filter, setFilter] = useState<MatchesFilterKey>('all');
  const [query, setQuery] = useState('');

  const visibleMatches = useMemo(
    () => selectMatches(matches, { filter, query }),
    [matches, filter, query],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Match>) => (
      <MatchCard match={item} isFavorite={isFavorite(item.id)} onToggleFavorite={toggle} />
    ),
    [isFavorite, toggle],
  );

  const keyExtractor = useCallback((match: Match) => match.id, []);

  const resetFilters = useCallback(() => {
    setFilter('all');
    setQuery('');
  }, []);

  const refresh = useCallback(() => {
    void reload();
  }, [reload]);

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return <ErrorState message={error ?? 'Не удалось загрузить матчи'} onRetry={refresh} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Матчи тура</Text>
          {round !== null && <Text style={styles.round}>Тур {round}</Text>}
        </View>

        <View style={styles.controlsRow}>
          {updatedAt !== null && <UpdatedAgo since={updatedAt} />}
          <Pressable
            onPress={refresh}
            disabled={isRefreshing}
            style={[styles.refresh, isRefreshing && styles.refreshDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Обновить матчи"
            accessibilityState={{ disabled: isRefreshing }}
          >
            <Text style={styles.refreshLabel}>{isRefreshing ? 'Обновляем…' : 'Обновить'}</Text>
          </Pressable>
        </View>

        {error !== null && <Text style={styles.errorBanner}>{error}</Text>}

        <SearchField value={query} onChangeText={setQuery} />
        <MatchesFilter value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={visibleMatches}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#111827" />
        }
        ListEmptyComponent={
          <EmptyState isFiltered={matches.length > 0} onReset={resetFilters} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  round: {
    fontSize: 14,
    color: '#6b7280',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  refresh: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshDisabled: {
    opacity: 0.5,
  },
  refreshLabel: {
    fontSize: 14,
    color: '#111827',
  },
  errorBanner: {
    fontSize: 13,
    color: '#b91c1c',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
