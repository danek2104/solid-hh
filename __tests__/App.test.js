import React from 'react';
import renderer, { act } from 'react-test-renderer';

import App from '../App';

describe('App root screen', () => {
  it('рендерится без ошибок и возвращает структуру', () => {
    let component;

    act(() => {
      component = renderer.create(<App />);
    });

    expect(component).toBeTruthy();
    act(() => {
      component.unmount();
    });
  });
});

