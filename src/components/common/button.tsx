import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = useTheme();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled || isLoading) return colors.border;
    switch (variant) {
      case 'primary':
        return pressed ? colors.textSecondary : colors.primary;
      case 'secondary':
        return pressed ? colors.border : colors.backgroundElement;
      case 'outline':
        return 'transparent';
      case 'danger':
        return pressed ? '#B91C1C' : colors.critical;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled || isLoading) return colors.textSecondary;
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
        return colors.text;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Pressable
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === 'outline' ? colors.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
