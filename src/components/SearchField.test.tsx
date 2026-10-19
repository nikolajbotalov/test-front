import { fireEvent, render, screen } from '@testing-library/react-native';

import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('передаёт введённый текст наружу', async () => {
    const onChangeText = jest.fn();
    await render(<SearchField value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Поиск по названию клуба'), 'Зенит');

    expect(onChangeText).toHaveBeenCalledWith('Зенит');
  });

  it('показывает кнопку очистки только при непустом запросе и очищает поле', async () => {
    const onChangeText = jest.fn();
    await render(<SearchField value="Зенит" onChangeText={onChangeText} />);

    await fireEvent.press(screen.getByLabelText('Очистить поиск'));

    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('не показывает кнопку очистки для пустого запроса', async () => {
    await render(<SearchField value="" onChangeText={jest.fn()} />);

    expect(screen.queryByLabelText('Очистить поиск')).toBeNull();
  });
});
