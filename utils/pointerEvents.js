/**
 * Утилиты для обработки событий указателя
 * Использует современный PointerEvent.pointerType вместо устаревшего MouseEvent.mozInputSource
 */

/**
 * Получить тип указателя из события
 * @param {Event|PointerEvent|MouseEvent|TouchEvent} event - Событие
 * @returns {string|null} - Тип указателя ('mouse', 'pen', 'touch') или null
 */
export const getPointerType = (event) => {
  // Приоритет: использовать современный PointerEvent.pointerType
  if (event instanceof PointerEvent) {
    return event.pointerType || null;
  }

  // Для нативных событий React Native (веб-версия)
  if (event?.nativeEvent) {
    const nativeEvent = event.nativeEvent;
    
    // Если это PointerEvent в nativeEvent
    if (nativeEvent instanceof PointerEvent) {
      return nativeEvent.pointerType || null;
    }
    
    // Устаревший Firefox-специфичный способ (mozInputSource)
    // НЕ ИСПОЛЬЗУЕМ, так как он устарел
    // if (nativeEvent.mozInputSource !== undefined) { ... }
    
    // Используем pointerType из nativeEvent, если доступен
    if (nativeEvent.pointerType) {
      return nativeEvent.pointerType;
    }
    
    // Проверка на touch события
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      return 'touch';
    }
  }

  // Прямая проверка на TouchEvent
  if (event instanceof TouchEvent || (event?.touches && event.touches.length > 0)) {
    return 'touch';
  }

  // Для обычных MouseEvent (по умолчанию мышь)
  if (event instanceof MouseEvent || event?.type?.startsWith('mouse')) {
    return 'mouse';
  }

  // Если event.type начинается с 'pointer', пытаемся получить pointerType
  if (event?.type?.startsWith('pointer') && event?.pointerType) {
    return event.pointerType;
  }

  return null;
};

/**
 * Проверить, является ли событие событием касания
 * @param {Event|PointerEvent|MouseEvent|TouchEvent} event - Событие
 * @returns {boolean} - true, если это событие касания
 */
export const isTouchEvent = (event) => {
  const pointerType = getPointerType(event);
  return pointerType === 'touch';
};

/**
 * Проверить, является ли событие событием мыши
 * @param {Event|PointerEvent|MouseEvent|TouchEvent} event - Событие
 * @returns {boolean} - true, если это событие мыши
 */
export const isMouseEvent = (event) => {
  const pointerType = getPointerType(event);
  return pointerType === 'mouse';
};

/**
 * Проверить, является ли событие событием пера/стилуса
 * @param {Event|PointerEvent|MouseEvent|TouchEvent} event - Событие
 * @returns {boolean} - true, если это событие пера
 */
export const isPenEvent = (event) => {
  const pointerType = getPointerType(event);
  return pointerType === 'pen';
};

/**
 * Создать обработчик события с правильным определением типа указателя
 * @param {Function} handler - Обработчик события, принимающий (event, pointerType)
 * @returns {Function} - Обёрнутый обработчик
 */
export const createPointerEventHandler = (handler) => {
  return (event) => {
    const pointerType = getPointerType(event);
    return handler(event, pointerType);
  };
};





