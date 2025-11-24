import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../services/i18n'; // Initialize i18n

export const LanguageContext = createContext();

const LANGUAGE_SELECTED_KEY = 'user-language-selected-v1';

export const LanguageProvider = ({ children }) => {
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLanguageStatus = async () => {
      try {
        const hasSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
        if (hasSelected === 'true') {
          setIsLanguageSelected(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLanguageStatus();
  }, []);

  const confirmLanguageSelection = async () => {
    try {
      await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
      setIsLanguageSelected(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LanguageContext.Provider value={{ isLanguageSelected, isLoading, confirmLanguageSelection }}>
      {children}
    </LanguageContext.Provider>
  );
};
