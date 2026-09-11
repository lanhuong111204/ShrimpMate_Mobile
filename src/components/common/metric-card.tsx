import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SensorMetric } from '@/types/pond';
import { formatMetricValue } from '@/utils/formatters';
import { StatusBadge } from './status-badge';
import { useTheme } from '@/hooks/use-theme';

interface MetricCardProps {
  metric: SensorMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{metric.name}</Text>
        <StatusBadge status={metric.status} />
      </View>

      <Text style={[styles.value, { color: colors.text }]}>
        {formatMetricValue(metric.value, metric.type)}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.rangeText, { color: colors.textSecondary }]}>
          Ngưỡng: {metric.minThreshold} - {metric.maxThreshold} {metric.unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    minWidth: 140,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  footer: {
    marginTop: 2,
  },
  rangeText: {
    fontSize: 11,
  },
});
