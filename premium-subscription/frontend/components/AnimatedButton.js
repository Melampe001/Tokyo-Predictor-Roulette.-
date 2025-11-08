/**
 * Animated Button Component
 * 
 * A reusable button component with loading animation
 * Used throughout the premium subscription UI
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View
} from 'react-native';

const AnimatedButton = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium'
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled || loading) {
      Animated.timing(opacityAnim, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [disabled, loading]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    // Variant styles
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    } else if (variant === 'danger') {
      baseStyle.push(styles.dangerButton);
    }

    // Size styles
    if (size === 'small') {
      baseStyle.push(styles.smallButton);
    } else if (size === 'large') {
      baseStyle.push(styles.largeButton);
    }

    // Custom style
    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    // Variant text styles
    if (variant === 'primary' || variant === 'danger') {
      baseStyle.push(styles.primaryButtonText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButtonText);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButtonText);
    }

    // Size text styles
    if (size === 'small') {
      baseStyle.push(styles.smallButtonText);
    } else if (size === 'large') {
      baseStyle.push(styles.largeButtonText);
    }

    // Custom text style
    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim
      }}
    >
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              color={variant === 'outline' ? '#007AFF' : '#FFF'}
              size="small"
            />
            {typeof children === 'string' && (
              <Text style={[getTextStyle(), styles.loadingText]}>{children}</Text>
            )}
          </View>
        ) : (
          <>
            {typeof children === 'string' ? (
              <Text style={getTextStyle()}>{children}</Text>
            ) : (
              children
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  primaryButton: {
    backgroundColor: '#007AFF'
  },
  secondaryButton: {
    backgroundColor: '#5AC8FA'
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  dangerButton: {
    backgroundColor: '#FF3B30'
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  primaryButtonText: {
    color: '#FFF'
  },
  secondaryButtonText: {
    color: '#FFF'
  },
  outlineButtonText: {
    color: '#007AFF'
  },
  smallButtonText: {
    fontSize: 14
  },
  largeButtonText: {
    fontSize: 18
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginLeft: 8
  }
});

export default AnimatedButton;
