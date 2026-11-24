import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { NoAssignedPondState } from '@/components/common/no-assigned-pond';
import { useFarm } from '@/context/farm-context';
import { evaluateWaterMetricStatus } from '@/api/services/pond.service';
import { StatusLevel } from '@/types/pond';

function getGaugeColors(status: StatusLevel | 'empty') {
  switch (status) {
    case 'critical':
      return {
        bgPill: '#FFDAD6',
        textColor: '#BA1A1A',
        borderColor: '#BA1A1A',
        label: 'NGUY HIỂM',
      };
    case 'warning':
      return {
        bgPill: '#FEF3C7',
        textColor: '#B45309',
        borderColor: '#F59E0B',
        label: 'CẦN CHÚ Ý',
      };
    case 'empty':
      return {
        bgPill: '#F1F5F9',
        textColor: '#64748B',
        borderColor: '#E2E8F0',
        label: 'Chưa có dữ liệu',
      };
    default:
      return {
        bgPill: '#E8F5E9',
        textColor: '#006E2D',
        borderColor: '#7CF994',
        label: 'AN TOÀN',
      };
  }
}

export default function ScreenTrayWater() {
  const colors = useTheme();
  const {
    ponds,
    selectedPond,
    latestTelemetry,
    isRefreshingPondData,
    refreshPondOperationalData,
    refreshFarmsAndPonds,
  } = useFarm();

  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, [latestTelemetry?.measuredAt]);

  const handlePullRefresh = async (refreshAction: () => Promise<void>) => {
    setIsManualRefreshing(true);
    try {
      await refreshAction();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const hasAssignedPond = Boolean(selectedPond && ponds.length > 0);
  const pondDisplayName = selectedPond?.name || selectedPond?.code || 'Không có ao giám sát';

  // 6 chỉ số nước thực tế từ GET /ponds/:pondId/telemetry/latest
  const hasTelemetry = Boolean(
    latestTelemetry &&
      latestTelemetry.ph !== undefined &&
      latestTelemetry.ph !== null &&
      !isNaN(Number(latestTelemetry.ph))
  );
  const doVal =
    hasTelemetry && latestTelemetry?.dissolvedOxygenMgL !== undefined
      ? Number(latestTelemetry.dissolvedOxygenMgL)
      : undefined;
  const phVal =
    hasTelemetry && latestTelemetry?.ph !== undefined ? Number(latestTelemetry.ph) : undefined;
  const tempVal =
    hasTelemetry && latestTelemetry?.temperatureC !== undefined
      ? Number(latestTelemetry.temperatureC)
      : undefined;
  const salVal =
    hasTelemetry && latestTelemetry?.salinityPpt !== undefined
      ? Number(latestTelemetry.salinityPpt)
      : undefined;
  const nh3Val =
    hasTelemetry && latestTelemetry?.ammoniaMgL !== undefined
      ? Number(latestTelemetry.ammoniaMgL)
      : undefined;
  const turbVal =
    hasTelemetry && latestTelemetry?.turbidityNtu !== undefined
      ? Number(latestTelemetry.turbidityNtu)
      : undefined;

  const measuredDate = latestTelemetry?.measuredAt
    ? new Date(latestTelemetry.measuredAt)
    : null;
  const isValidMeasuredDate = Boolean(measuredDate && Number.isFinite(measuredDate.getTime()));
  const readingAgeMinutes =
    hasTelemetry && isValidMeasuredDate && measuredDate
      ? Math.max(0, Math.floor((nowMs - measuredDate.getTime()) / 60000))
      : null;
  const isTelemetryStale = Boolean(
    hasTelemetry && readingAgeMinutes !== null && readingAgeMinutes > 30
  );
  const measuredTimeStr =
    isValidMeasuredDate && measuredDate
      ? measuredDate.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Chưa có dữ liệu đo';

  // Đánh giá màu sắc chuẩn theo Quy tắc 3 (Xanh: optimal, Vàng: warning, Đỏ: critical, Xám: empty)
  const doStatus: StatusLevel | 'empty' =
    hasTelemetry && doVal !== undefined ? evaluateWaterMetricStatus('do', doVal) : 'empty';
  const phStatus: StatusLevel | 'empty' =
    hasTelemetry && phVal !== undefined ? evaluateWaterMetricStatus('ph', phVal) : 'empty';
  const tempStatus: StatusLevel | 'empty' =
    hasTelemetry && tempVal !== undefined
      ? evaluateWaterMetricStatus('temperature', tempVal)
      : 'empty';
  const salStatus: StatusLevel | 'empty' =
    hasTelemetry && salVal !== undefined ? evaluateWaterMetricStatus('salinity', salVal) : 'empty';
  const nh3Status: StatusLevel | 'empty' =
    hasTelemetry && nh3Val !== undefined ? evaluateWaterMetricStatus('nh3', nh3Val) : 'empty';
  const turbStatus: StatusLevel | 'empty' =
    hasTelemetry && turbVal !== undefined
      ? evaluateWaterMetricStatus('turbidity', turbVal)
      : 'empty';

  const hasCriticalWater =
    hasTelemetry && (doStatus === 'critical' || phStatus === 'critical' || nh3Status === 'critical');
  const hasWarningWater =
    hasTelemetry &&
    !hasCriticalWater &&
    (doStatus === 'warning' || phStatus === 'warning' || nh3Status === 'warning');

  const doTheme = getGaugeColors(doStatus);
  const phTheme = getGaugeColors(phStatus);
  const tempTheme = getGaugeColors(tempStatus);
  const salTheme = getGaugeColors(salStatus);
  const nh3Theme = getGaugeColors(nh3Status);
  const turbTheme = getGaugeColors(turbStatus);

  if (!hasAssignedPond) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.surface }]}>
        <AppHeader subtitle="Giám Sát Môi Trường Nước" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={() => handlePullRefresh(refreshFarmsAndPonds)}
              colors={['#EA580C']}
              tintColor="#EA580C"
            />
          }>
          <View style={styles.container}>
            <NoAssignedPondState />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Giám Sát Môi Trường Nước" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={() => handlePullRefresh(refreshPondOperationalData)}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }>
        <View style={styles.container}>
          {/* Top Quick Bio Status Strip */}
          <View
            style={[
              styles.statusStrip,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: hasCriticalWater
                  ? '#BA1A1A'
                  : hasWarningWater || isTelemetryStale
                  ? '#F59E0B'
                  : colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.pingDotGroup,
                  {
                    backgroundColor: !hasTelemetry
                      ? '#94A3B8'
                      : hasCriticalWater
                      ? '#BA1A1A'
                      : hasWarningWater || isTelemetryStale
                      ? '#F59E0B'
                      : '#006E2D',
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
                {pondDisplayName} •{' '}
                {hasTelemetry && readingAgeMinutes !== null
                  ? `Cập nhật lúc: ${measuredTimeStr} (Cách đây ${readingAgeMinutes} phút)`
                  : hasTelemetry
                  ? `Cập nhật lúc: ${measuredTimeStr}`
                  : 'Chưa có dữ liệu đo'}
              </Text>
            </View>
            <View
              style={[
                styles.bioBadge,
                {
                  backgroundColor: !hasTelemetry
                    ? '#F1F5F9'
                    : hasCriticalWater
                    ? '#FFDAD6'
                    : hasWarningWater
                    ? '#FEF3C7'
                    : colors.secondaryContainer,
                },
              ]}>
              <MaterialIcons
                name={
                  !hasTelemetry
                    ? 'sensors-off'
                    : hasCriticalWater
                    ? 'error'
                    : hasWarningWater
                    ? 'warning'
                    : 'verified'
                }
                size={14}
                color={
                  !hasTelemetry
                    ? '#64748B'
                    : hasCriticalWater
                    ? '#BA1A1A'
                    : hasWarningWater
                    ? '#B45309'
                    : colors.onSecondaryContainer
                }
              />
              <Text
                style={[
                  styles.bioBadgeText,
                  {
                    color: !hasTelemetry
                      ? '#64748B'
                      : hasCriticalWater
                      ? '#BA1A1A'
                      : hasWarningWater
                      ? '#B45309'
                      : colors.onSecondaryContainer,
                  },
                ]}>
                {!hasTelemetry
                  ? 'Chưa có dữ liệu'
                  : hasCriticalWater
                  ? 'Nguy cấp nước'
                  : hasWarningWater
                  ? 'Cần chú ý'
                  : 'Đạt chuẩn sinh học'}
              </Text>
            </View>
          </View>

          {/* Stale Telemetry Warning Banner (> 30 phút) */}
          {isTelemetryStale && (
            <View style={styles.staleWarningBanner}>
              <MaterialIcons name="warning-amber" size={20} color="#92400E" />
              <Text style={styles.staleWarningText}>
                ⚠️ Dữ liệu trạm đo đã quá cũ (&gt;30 phút). Vui lòng kiểm tra lại thiết bị ngoài ao!
              </Text>
            </View>
          )}

          {/* 6-Water Metrics Real-Time Dashboard (Telemetry Gauges - UC013) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              6 CHỈ SỐ MÔI TRƯỜNG NƯỚC (TELEMETRY GAUGES)
            </Text>
            <Pressable
              onPress={refreshPondOperationalData}
              disabled={isRefreshingPondData}
              style={styles.syncRow}>
              <MaterialIcons name="sync" size={14} color="#006E2D" />
              <Text style={styles.sensorStatus}>
                {isRefreshingPondData ? 'Đang tải...' : 'Làm mới'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            {/* Gauge 1: Dissolved Oxygen (DO) */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    doStatus !== 'optimal' && doStatus !== 'empty'
                      ? doTheme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: doStatus !== 'optimal' && doStatus !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="air" size={18} color={doTheme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: doTheme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: doTheme.textColor }]}>
                    {doTheme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>1. Oxy Hòa Tan (DO)</Text>
              <Text style={[styles.metricLargeVal, { color: doTheme.textColor }]}>
                {hasTelemetry && doVal !== undefined ? doVal.toFixed(1) : '--'}{' '}
                <Text style={styles.metricUnit}>mg/L</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn ≥ 5.0 • Cấm ăn &lt; 3.5</Text>
            </View>

            {/* Gauge 2: pH */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    phStatus !== 'optimal' && phStatus !== 'empty'
                      ? phTheme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: phStatus !== 'optimal' && phStatus !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="colorize" size={18} color={phTheme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: phTheme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: phTheme.textColor }]}>
                    {phTheme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>2. Độ pH Nước</Text>
              <Text style={[styles.metricLargeVal, { color: phTheme.textColor }]}>
                {hasTelemetry && phVal !== undefined ? phVal.toFixed(2) : '--'}{' '}
                <Text style={styles.metricUnit}>pH</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn: 7.5 - 8.5 pH</Text>
            </View>

            {/* Gauge 3: Water Temperature */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    tempStatus !== 'optimal' && tempStatus !== 'empty'
                      ? tempTheme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: tempStatus !== 'optimal' && tempStatus !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="thermostat" size={18} color={tempTheme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: tempTheme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: tempTheme.textColor }]}>
                    {tempTheme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>3. Nhiệt Độ Nước</Text>
              <Text style={[styles.metricLargeVal, { color: tempTheme.textColor }]}>
                {hasTelemetry && tempVal !== undefined ? tempVal.toFixed(1) : '--'}{' '}
                <Text style={styles.metricUnit}>°C</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn: 26.0 - 32.0°C</Text>
            </View>

            {/* Gauge 4: Salinity */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    salStatus !== 'optimal' && salStatus !== 'empty'
                      ? salTheme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: salStatus !== 'optimal' && salStatus !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="opacity" size={18} color={salTheme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: salTheme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: salTheme.textColor }]}>
                    {salTheme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>4. Độ Mặn (Salinity)</Text>
              <Text style={[styles.metricLargeVal, { color: salTheme.textColor }]}>
                {hasTelemetry && salVal !== undefined ? salVal.toFixed(1) : '--'}{' '}
                <Text style={styles.metricUnit}>‰</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn: 10.0 - 25.0‰</Text>
            </View>

            {/* Gauge 5: Toxic Ammonia NH3 */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    nh3Status !== 'optimal' && nh3Status !== 'empty'
                      ? nh3Theme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: nh3Status !== 'optimal' && nh3Status !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="science" size={18} color={nh3Theme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: nh3Theme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: nh3Theme.textColor }]}>
                    {nh3Theme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>5. Khí Độc NH₃</Text>
              <Text style={[styles.metricLargeVal, { color: nh3Theme.textColor }]}>
                {hasTelemetry && nh3Val !== undefined ? nh3Val.toFixed(2) : '--'}{' '}
                <Text style={styles.metricUnit}>mg/L</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn &lt; 0.05 • Nguy hiểm &gt; 0.1</Text>
            </View>

            {/* Gauge 6: Turbidity (Độ đục) */}
            <View
              style={[
                styles.metricCardItem,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor:
                    turbStatus !== 'optimal' && turbStatus !== 'empty'
                      ? turbTheme.borderColor
                      : colors.outlineVariant + '40',
                  borderWidth: turbStatus !== 'optimal' && turbStatus !== 'empty' ? 1.5 : 1,
                },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="blur-on" size={18} color={turbTheme.textColor} />
                <View style={[styles.metricPill, { backgroundColor: turbTheme.bgPill }]}>
                  <Text style={[styles.metricPillText, { color: turbTheme.textColor }]}>
                    {turbTheme.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricName}>6. Độ Đục (Turbidity)</Text>
              <Text style={[styles.metricLargeVal, { color: turbTheme.textColor }]}>
                {hasTelemetry && turbVal !== undefined ? turbVal.toFixed(1) : '--'}{' '}
                <Text style={styles.metricUnit}>NTU</Text>
              </Text>
              <Text style={styles.metricTarget}>An toàn: 10.0 - 40.0 NTU</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  container: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  pingDotGroup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006E2D',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  bioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  bioBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  staleWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  staleWarningText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sensorStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006E2D',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCardItem: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  metricPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  metricName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  metricLargeVal: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  metricTarget: {
    fontSize: 10,
    color: '#8C7164',
    fontWeight: '600',
  },
});
