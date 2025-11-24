const React = require('react');
export const SafeAreaProvider = ({ children }) => React.createElement('View', {}, children);
export const SafeAreaView = ({ children }) => React.createElement('View', {}, children);
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
