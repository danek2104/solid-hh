import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import App from '../App';

describe('Интеграционный сценарий авторизации', () => {
    let alertSpy;
    let randomSpy;

    beforeEach(() => {
        alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
        randomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        alertSpy.mockRestore();
        randomSpy.mockRestore();
    });

    it('проходит регистрацию работника с подтверждением контактов', async () => {
        const screen = render(<App />);

        const [registerTab] = screen.getAllByText('Регистрация');
        fireEvent.press(registerTab);

        fireEvent.changeText(
            screen.getByPlaceholderText('Электронная почта'),
            'worker@example.com'
        );
        fireEvent.changeText(
            screen.getByPlaceholderText('Номер телефона'),
            '+998 90 111 22 33'
        );
        fireEvent.changeText(screen.getByPlaceholderText('Пароль'), 'Secret123');
        fireEvent.changeText(
            screen.getByPlaceholderText('Повторите пароль'),
            'Secret123'
        );
        fireEvent.changeText(
            screen.getByPlaceholderText('Основной навык (маляр, сварщик и т.д.)'),
            'Маляр'
        );
        fireEvent.changeText(
            screen.getByPlaceholderText('Когда можете работать? (например, ночные смены)'),
            'Ночные смены'
        );

        fireEvent.press(screen.getByText('Отправить код'));
        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        fireEvent.changeText(screen.getByPlaceholderText('Код из email'), '100000');
        fireEvent.press(screen.getByText('Подтвердить email'));
        await waitFor(() =>
            expect(screen.getByText('Email подтверждён')).toBeTruthy()
        );

        fireEvent.press(screen.getByText('Отправить SMS-код'));
        await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(3));
        fireEvent.changeText(screen.getByPlaceholderText('Код из SMS'), '100000');
        fireEvent.press(screen.getByText('Подтвердить телефон'));
        await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(4));
        await waitFor(() =>
            expect(screen.getByText('Телефон подтверждён')).toBeTruthy()
        );

        fireEvent.press(screen.getByText('Зарегистрироваться'));

        await waitFor(() =>
            expect(screen.getByText('Профиль работника')).toBeTruthy()
        );
    });
});

