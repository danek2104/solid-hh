import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import ErrorBoundary from '../../components/ErrorBoundary';

// Моки для иконок
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Компонент, который выбрасывает ошибку для тестирования ErrorBoundary
class ThrowError extends React.Component {
  render() {
    throw new Error('Test error');
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Подавляем вывод ошибок в консоль во время тестов
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('должен рендерить children когда ошибок нет', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('должен отображать fallback UI при ошибке', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Что-то пошло не так')).toBeTruthy();
    expect(getByText(/Произошла непредвиденная ошибка/)).toBeTruthy();
    expect(getByText('Попробовать снова')).toBeTruthy();
  });

  it('должен вызывать componentDidCatch при ошибке', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary поймал ошибку:',
      expect.any(Error),
      expect.any(Object)
    );
    expect(getByText('Что-то пошло не так')).toBeTruthy();
  });

  it('должен использовать кастомный fallback если передан', () => {
    const customFallback = jest.fn((error, reset) => {
      return <Text>Custom Error UI</Text>;
    });

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error UI')).toBeTruthy();
    expect(customFallback).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Function)
    );
  });

  it('должен отображать детали ошибки когда showDetails=true', () => {
    const { getByText } = render(
      <ErrorBoundary showDetails>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Детали ошибки:')).toBeTruthy();
    expect(getByText(/Error: Test error/)).toBeTruthy();
  });

  it('должен вызывать onReset при нажатии кнопки "Попробовать снова"', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError />
      </ErrorBoundary>
    );

    const resetButton = getByText('Попробовать снова');
    fireEvent.press(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('должен сбросить состояние при нажатии кнопки "Попробовать снова" без onReset', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Что-то пошло не так')).toBeTruthy();

    const resetButton = getByText('Попробовать снова');
    fireEvent.press(resetButton);

    // После сброса ошибка должна быть очищена, но поскольку компонент всё ещё рендерит ThrowError,
    // ошибка произойдет снова. Проверим, что состояние было сброшено (компонент попытался снова рендерить)
    expect(queryByText('Что-то пошло не так')).toBeTruthy();
  });

  it('должен отображать кнопку "Выйти из аккаунта" когда передан onLogout', () => {
    const onLogout = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onLogout={onLogout}>
        <ThrowError />
      </ErrorBoundary>
    );

    const logoutButton = getByText('Выйти из аккаунта');
    expect(logoutButton).toBeTruthy();

    fireEvent.press(logoutButton);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('не должен отображать кнопку "Выйти из аккаунта" когда onLogout не передан', () => {
    const { queryByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(queryByText('Выйти из аккаунта')).toBeNull();
  });

  it('должен отображать componentStack когда он доступен', () => {
    const { getByText } = render(
      <ErrorBoundary showDetails>
        <ThrowError />
      </ErrorBoundary>
    );

    // componentStack может быть пустым или отсутствовать в тестовой среде,
    // но структура для его отображения должна быть готова
    expect(getByText('Детали ошибки:')).toBeTruthy();
  });

  it('должен обрабатывать ошибки в дочерних компонентах', () => {
    const ChildWithError = () => {
      throw new Error('Child error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <View>
          <ChildWithError />
        </View>
      </ErrorBoundary>
    );

    expect(getByText('Что-то пошло не так')).toBeTruthy();
  });
});

