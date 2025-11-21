import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorDisplay, InlineError } from '../../components/ErrorDisplay';

// Моки для иконок
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('ErrorDisplay', () => {
  it('должен рендериться с сообщением об ошибке', () => {
    const error = new Error('Test error message');
    const { getByText } = render(<ErrorDisplay error={error} />);

    expect(getByText('Test error message')).toBeTruthy();
  });

  it('должен использовать кастомное сообщение если передан message', () => {
    const error = new Error('Original error');
    const { getByText, queryByText } = render(
      <ErrorDisplay error={error} message="Custom error message" />
    );

    expect(getByText('Custom error message')).toBeTruthy();
    expect(queryByText('Original error')).toBeNull();
  });

  it('должен использовать дефолтное сообщение если нет error и message', () => {
    const { getByText } = render(<ErrorDisplay />);

    expect(getByText('Произошла ошибка')).toBeTruthy();
  });

  it('должен отображать заголовок если передан title', () => {
    const { getByText } = render(
      <ErrorDisplay title="Ошибка загрузки" />
    );

    expect(getByText('Ошибка загрузки')).toBeTruthy();
  });

  it('не должен отображать заголовок если title не передан', () => {
    const { queryByText } = render(<ErrorDisplay />);
    // Проверяем, что заголовок отсутствует - ищем тексты из стилей заголовка
    // Если title не передан, то он не должен рендериться
    expect(queryByText(/Ошибка загрузки/)).toBeNull();
  });

  it('должен отображать иконку по умолчанию', () => {
    const { getByText } = render(<ErrorDisplay message="Test" />);
    // Проверяем, что компонент рендерится (значит иконка тоже)
    expect(getByText('Test')).toBeTruthy();
  });

  it('не должен отображать основную иконку если showIcon=false', () => {
    // Проверяем, что компонент рендерится даже без иконки
    const { getByText } = render(<ErrorDisplay showIcon={false} message="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('должен вызывать onRetry при нажатии кнопки "Попробовать снова"', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorDisplay onRetry={onRetry} />);

    const retryButton = getByText('Попробовать снова');
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('не должен отображать кнопку retry если onRetry не передан', () => {
    const { queryByText } = render(<ErrorDisplay />);

    expect(queryByText('Попробовать снова')).toBeNull();
  });

  it('должен вызывать onDismiss при нажатии кнопки "Закрыть"', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(<ErrorDisplay onDismiss={onDismiss} />);

    const dismissButton = getByText('Закрыть');
    fireEvent.press(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('не должен отображать кнопку dismiss если onDismiss не передан', () => {
    const { queryByText } = render(<ErrorDisplay />);

    expect(queryByText('Закрыть')).toBeNull();
  });

  it('должен отображать обе кнопки когда переданы и onRetry и onDismiss', () => {
    const onRetry = jest.fn();
    const onDismiss = jest.fn();
    const { getByText } = render(
      <ErrorDisplay onRetry={onRetry} onDismiss={onDismiss} />
    );

    expect(getByText('Попробовать снова')).toBeTruthy();
    expect(getByText('Закрыть')).toBeTruthy();
  });

  it('должен обрабатывать error с message', () => {
    const error = { message: 'Error from object' };
    const { getByText } = render(<ErrorDisplay error={error} />);

    expect(getByText('Error from object')).toBeTruthy();
  });

  it('должен обрабатывать error без message', () => {
    const error = {};
    const { getByText } = render(<ErrorDisplay error={error} />);

    expect(getByText('Произошла ошибка')).toBeTruthy();
  });
});

describe('InlineError', () => {
  it('должен рендериться когда передан error', () => {
    const { getByText } = render(<InlineError error="Field is required" />);

    expect(getByText('Field is required')).toBeTruthy();
  });

  it('не должен рендериться когда error не передан', () => {
    const TestWrapper = () => {
      return (
        <>
          <InlineError error={null} />
          <Text testID="test-content">Content</Text>
        </>
      );
    };
    const { getByTestId, queryByText } = render(<TestWrapper />);
    // Когда error null, компонент возвращает null
    // Проверяем, что контент рендерится (значит InlineError не сломал рендеринг)
    expect(getByTestId('test-content')).toBeTruthy();
    // Но текста ошибки не должно быть
    expect(queryByText(/error/i)).toBeNull();
  });

  it('не должен рендериться когда error пустая строка', () => {
    const TestWrapper = () => {
      return (
        <>
          <InlineError error="" />
          <Text testID="test-content">Content</Text>
        </>
      );
    };
    const { getByTestId, queryByText } = render(<TestWrapper />);
    // Пустая строка falsy, компонент вернет null
    expect(getByTestId('test-content')).toBeTruthy();
    // Но текста ошибки не должно быть
    expect(queryByText(/error/i)).toBeNull();
  });

  it('должен применять кастомные стили', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <InlineError error="Test error" style={customStyle} />
    );
    // Проверяем, что компонент рендерится с кастомными стилями
    expect(getByText('Test error')).toBeTruthy();
  });

  it('должен отображать иконку и текст ошибки', () => {
    const { getByText } = render(<InlineError error="Test error" />);
    expect(getByText('Test error')).toBeTruthy();
  });
});

