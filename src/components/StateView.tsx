import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

type EmptyStateProps = {
  /** true, если матчи загрузились, но не прошли фильтр или поиск. */
  isFiltered: boolean;
  onReset: () => void;
};

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
      <Text style={styles.hint}>Загружаем матчи…</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Не получилось загрузить матчи</Text>
      <Text style={styles.hint}>{message}</Text>
      <ActionButton label="Повторить" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ isFiltered, onReset }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isFiltered ? 'Ничего не найдено' : 'Матчей пока нет'}</Text>
      <Text style={styles.hint}>
        {isFiltered
          ? 'Попробуйте изменить фильтр или запрос поиска'
          : 'Как только появятся матчи тура, они появятся здесь'}
      </Text>
      {isFiltered && <ActionButton label="Сбросить фильтры" onPress={onReset} />}
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
};

export function ActionButton({ label, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
