import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MATCH_FILTERS, type MatchesFilterKey } from '../lib/matches';

type Props = {
  value: MatchesFilterKey;
  onChange: (value: MatchesFilterKey) => void;
};

export function MatchesFilter({ value, onChange }: Props) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {MATCH_FILTERS.map((filter) => {
        const selected = filter.key === value;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[styles.item, selected && styles.itemSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={filter.label}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  labelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
