import React, { memo, useState, useCallback } from 'react';
import { View, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../AppStyles';

const LazyImage = memo(({ source, style, placeholder, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <Image
        source={source}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <View style={style}>
      {isLoading && !hasError && (
        <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          {placeholder || <ActivityIndicator size="small" color={theme.primary} />}
        </View>
      )}
      {!hasError && (
        <Image
          source={source}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      {hasError && (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <Ionicons name="image-outline" size={24} color={theme.muted} />
        </View>
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
