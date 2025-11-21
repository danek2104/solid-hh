/**
 * Утилита для обработки пропов View компонента
 * Извлекает pointerEvents из пропов и перемещает его в style
 */

/**
 * Обрабатывает пропы для View компонента, перемещая pointerEvents в style
 * @param {Object} props - Пропы компонента
 * @returns {Object} - Обработанные пропы и стили
 */
export const processViewProps = (props) => {
  const { pointerEvents, style, ...restProps } = props;
  
  const processedStyle = [style];
  
  // Если pointerEvents передан как проп, перемещаем его в style
  if (pointerEvents !== undefined) {
    processedStyle.push({ pointerEvents });
  }
  
  return {
    style: processedStyle.length === 1 ? processedStyle[0] : processedStyle,
    ...restProps,
  };
};





