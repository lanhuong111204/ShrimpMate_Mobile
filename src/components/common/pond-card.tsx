import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Pond } from '@/types/pond';
import { StatusBadge } from './status-badge';
import { formatMetricValue } from '@/utils/formatters';
import { useTheme } from '@/hooks/use-theme';

interface PondCardProps {
  pond: Pond;
  onPress?: () => void;
}

export function PondCard({ pond, onPress }: PondCardProps) {
  const colors = useTheme();

  // Determine overall health: if any metric is critical -> critical; else if any warning -> warning; else optimal
  const hasCritical = pond.latestMetrics.some((m) => m.status === 'critical');
  const hasWarning = pond.latestMetrics.some((m) => m.status === 'warning');
  const overallStatus = hasCritical ? 'critical' : hasWarning ? 'warning' : 'optimal';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.titleInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{pond.name}</Text>
          <Text style={[styles.code, { color: colors.textSecondary }]}>
            Mã: {pond.code} • {pond.species || 'Tôm thẻ'}
          </Text>
        </View>
        <StatusBadge status={overallStatus} />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tuổi tôm</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {pond.shrimpAgeDays ? `${pond.shrimpAgeDays} ngày` : '--'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Số lượng thả</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {pond.shrimpCount ? `${(pond.shrimpCount / 1000).toFixed(0)}k con` : '--'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Diện tích</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{pond.areaM2} m²</Text>
        </View>
      </View>

      <View style={[styles.metricsContainer, { borderTopColor: colors.border }]}>
        {pond.latestMetrics.slice(0, 4).map((metric) => (
          <View key={metric.type} style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.name}</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    metric.status === 'critical'
                      ? colors.critical
                      : metric.status === 'warning'
                      ? colors.warning
                      : colors.text,
                },
              ]}>
              {formatMetricValue(metric.value, metric.type)}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleInfo: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  code: {
    fontSize: 13,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
