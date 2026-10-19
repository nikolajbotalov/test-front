import { StyleSheet, Text, View } from 'react-native';

import { getStatusLabel } from '../lib/matches';
import type { Match, MatchStatus } from '../types';

type Props = {
  match: Match;
};

const TONES: Record<MatchStatus, { color: string; backgroundColor: string }> = {
  scheduled: { color: '#1d4ed8', backgroundColor: '#dbeafe' },
  live: { color: '#b91c1c', backgroundColor: '#fee2e2' },
  finished: { color: '#374151', backgroundColor: '#e5e7eb' },
  postponed: { color: '#b45309', backgroundColor: '#fef3c7' },
  unknown: { color: '#6b7280', backgroundColor: '#f3f4f6' },
};

export function MatchStatusBadge({ match }: Props) {
  const tone = TONES[match.status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.label, { color: tone.color }]}>{getStatusLabel(match)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
