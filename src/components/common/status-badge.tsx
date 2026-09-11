import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusLevel } from '@/types/pond';
import { getStatusText } from '@/utils/formatters';
import { useTheme } from '@/hooks/use-theme';

interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, label, size = 'small' }: StatusBadgeProps) {
  const colors = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'optimal':
        return colors.optimal;
      case 'warning':
        return colors.warning;
      case 'critical':
        return colors.critical;
      default:
        return colors.offline;
    }
  };

  const color = getStatusColor();
  const text = label || getStatusText(status);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: color }, size === 'small' && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === 'small' && styles.textSmall]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
  },
});
