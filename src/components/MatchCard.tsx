import { StyleSheet, Text, View } from 'react-native';

import { formatMatchDateTime, formatScore } from '../lib/matches';
import type { Match } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { MatchStatusBadge } from './MatchStatusBadge';

type Props = {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export function MatchCard({ match, isFavorite, onToggleFavorite }: Props) {
  const dateText = formatMatchDateTime(match.startsAt);

  return (
    <View style={styles.card}>
      <View style={styles.favorite}>
        <FavoriteButton active={isFavorite} onPress={() => onToggleFavorite(match.id)} />
      </View>

      <View style={styles.row}>
        <View style={styles.teamColumn}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.home.name}
          </Text>
          <Text style={styles.teamCity} numberOfLines={1}>
            {match.home.city}
          </Text>
        </View>

        <Text style={styles.score}>{formatScore(match)}</Text>

        <View style={[styles.teamColumn, styles.awayColumn]}>
          <Text style={[styles.teamName, styles.awayText]} numberOfLines={1}>
            {match.away.name}
          </Text>
          <Text style={[styles.teamCity, styles.awayText]} numberOfLines={1}>
            {match.away.city}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{dateText}</Text>
        <MatchStatusBadge match={match} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  favorite: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 30,
  },
  teamColumn: {
    flex: 1,
  },
  awayColumn: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  teamCity: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  awayText: {
    textAlign: 'right',
  },
  score: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
});
