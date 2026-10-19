import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { elapsedSeconds } from '../lib/matches';

type Props = {
  // Момент последней успешной загрузки данных.
  since: Date;
};

// Подпись «Обновлено N сек назад».
export function UpdatedAgo({ since }: Props) {
  // Храним только текущее время и считаем разницу при рендере. Так подпись
  // не «застывает» на первом тике и сама сбрасывается, когда меняется since.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return <Text style={styles.text}>Обновлено {elapsedSeconds(since, now)} сек назад</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: '#6b7280',
  },
});
