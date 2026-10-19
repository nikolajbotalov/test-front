import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchField({ value, onChangeText }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Поиск по клубу"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="Поиск по названию клуба"
      />
      {value !== '' && (
        <Pressable
          onPress={() => onChangeText('')}
          style={styles.clear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
        >
          <Text style={styles.clearLabel}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  clear: {
    position: 'absolute',
    right: 10,
  },
  clearLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
