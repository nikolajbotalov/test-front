import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  active: boolean;
  onPress: () => void;
  /** Что именно добавляем в избранное — попадает в подпись для скринридера. */
  subject?: string;
};

// Звёздочка «в избранное».
export function FavoriteButton({ active, onPress, subject }: Props) {
  const action = active ? 'Убрать из избранного' : 'Добавить в избранное';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={subject ? `${action}: ${subject}` : action}
    >
      <Text style={[styles.star, active && styles.active]}>{active ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  star: {
    fontSize: 22,
    color: '#9ca3af',
  },
  active: {
    color: '#ef3124',
  },
});
