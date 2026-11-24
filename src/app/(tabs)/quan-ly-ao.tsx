import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { NoAssignedPondState } from '@/components/common/no-assigned-pond';
import { useFarm } from '@/context/farm-context';
import {
  evaluateWaterMetricStatus,
  pondService,
  WaterMetricType,
} from '@/api/services/pond.service';
import { StatusLevel } from '@/types/pond';
import { TelemetryReading } from '@/types/telemetry';

const HISTORY_METRICS: {
  key: WaterMetricType;
  field: keyof TelemetryReading;
  label: string;
  unit: string;
  decimals: number;
  targetNote: string;
}[] = [
  { key: 'do', field: 'dissolvedOxygenMgL', label: 'DO', unit: 'mg/L', decimals: 2, targetNote: 'An toàn ≥ 4.0 (Tối ưu ≥ 5.0)' },
  { key: 'ph', field: 'ph', label: 'pH', unit: '', decimals: 2, targetNote: 'An toàn 7.2 – 8.8 pH' },
  { key: 'temperature', field: 'temperatureC', label: 'Nhiệt độ', unit: '°C', decimals: 1, targetNote: 'An toàn 26.0 – 33.5°C' },
  { key: 'salinity', field: 'salinityPpt', label: 'Độ mặn', unit: '‰', decimals: 1, targetNote: 'An toàn 5.0 – 30.0‰' },
  { key: 'nh3', field: 'ammoniaMgL', label: 'NH₃', unit: 'mg/L', decimals: 3, targetNote: 'An toàn ≤ 0.1 mg/L' },
  { key: 'turbidity', field: 'turbidityNtu', label: 'Độ đục', unit: 'NTU', decimals: 1, targetNote: 'An toàn ≤ 60.0 NTU' },
];

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
  const [historyReadings, setHistoryReadings] = useState<TelemetryReading[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedHistoryMetric, setSelectedHistoryMetric] = useState<WaterMetricType>('do');

  const loadTelemetryHistory = useCallback(async () => {
    if (!selectedPond?.id) {
      setHistoryReadings([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const list = await pondService.getTelemetryHistory(selectedPond.id, {
        page: 1,
        limit: 24,
      });
      const chronological = [...list].sort(
        (a, b) =>
          new Date(a.measuredAt || 0).getTime() - new Date(b.measuredAt || 0).getTime()
      );
      setHistoryReadings(chronological);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedPond?.id]);

  useEffect(() => {
    void loadTelemetryHistory();
  }, [loadTelemetryHistory]);

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
      await Promise.all([refreshAction(), loadTelemetryHistory()]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const hasAssignedPond = Boolean(selectedPond && ponds.length > 0);
  const pondDisplayName = selectedPond?.name || selectedPond?.code || 'Không có ao giám sát';

  // 6 chỉ số nước thực tế từ GET /ponds/:pondId/telemetry/latest
  const toMetricVal = (raw: number | null | undefined) =>
    raw !== undefined && raw !== null && !isNaN(Number(raw)) ? Number(raw) : undefined;
  const doVal = toMetricVal(latestTelemetry?.dissolvedOxygenMgL);
  const phVal = toMetricVal(latestTelemetry?.ph);
  const tempVal = toMetricVal(latestTelemetry?.temperatureC);
  const salVal = toMetricVal(latestTelemetry?.salinityPpt);
  const nh3Val = toMetricVal(latestTelemetry?.ammoniaMgL);
  const turbVal = toMetricVal(latestTelemetry?.turbidityNtu);
  const hasTelemetry = Boolean(
    latestTelemetry &&
      (doVal !== undefined ||
        phVal !== undefined ||
        tempVal !== undefined ||
        salVal !== undefined ||
        nh3Val !== undefined ||
        turbVal !== undefined)
  );

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
              <Text style={styles.metricTarget}>An toàn ≥ 4.0 (Tối ưu ≥ 5.0) • Cấm &lt; 3.5</Text>
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
              <Text style={styles.metricTarget}>An toàn: 7.2 – 8.8 pH (Tối ưu 7.5–8.5)</Text>
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
              <Text style={styles.metricTarget}>An toàn: 26.0 – 33.5°C (Tối ưu 28–32)</Text>
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
              <Text style={styles.metricTarget}>An toàn: 5.0 – 30.0‰ (Tối ưu 10–25)</Text>
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
              <Text style={styles.metricTarget}>An toàn ≤ 0.1 • Độc &gt; 0.3 mg/L</Text>
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
              <Text style={styles.metricTarget}>An toàn ≤ 60.0 NTU (Tối ưu 20–40)</Text>
            </View>
          </View>

          {/* Telemetry History Trend Chart (GET /ponds/:pondId/telemetry/history) */}
          {(() => {
            const metricCfg =
              HISTORY_METRICS.find((m) => m.key === selectedHistoryMetric) || HISTORY_METRICS[0];
            const pts = historyReadings
              .map((r) => {
                const raw = r[metricCfg.field];
                const num = raw !== undefined && raw !== null ? Number(raw) : NaN;
                if (!Number.isFinite(num)) return null;
                return { value: num, measuredAt: r.measuredAt };
              })
              .filter((x): x is { value: number; measuredAt: string } => x !== null);
            const vals = pts.map((p) => p.value);
            const minV = vals.length > 0 ? Math.min(...vals) : 0;
            const maxV = vals.length > 0 ? Math.max(...vals) : 0;
            const avgV = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
            const span = Math.max(maxV - minV, 0.2);

            return (
              <View
                style={[
                  styles.historyCard,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderColor: colors.outlineVariant + '40',
                  },
                ]}>
                <View style={styles.historyHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="show-chart" size={18} color="#006398" />
                    <Text style={[styles.historyTitle, { color: colors.onSurface }]}>
                      XU HƯỚNG LỊCH SỬ ({pts.length} MẪU)
                    </Text>
                  </View>
                  <Pressable onPress={() => void loadTelemetryHistory()} style={styles.syncRow}>
                    {isLoadingHistory ? (
                      <ActivityIndicator size="small" color="#006398" />
                    ) : (
                      <Text style={[styles.sensorStatus, { color: '#006398' }]}>Cập nhật</Text>
                    )}
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.historyTabs}>
                  {HISTORY_METRICS.map((m) => {
                    const active = m.key === selectedHistoryMetric;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => setSelectedHistoryMetric(m.key)}
                        style={[
                          styles.historyTabBtn,
                          active && styles.historyTabBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.historyTabText,
                            active && styles.historyTabTextActive,
                          ]}>
                          {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {pts.length === 0 ? (
                  <Text style={styles.historyEmpty}>
                    {isLoadingHistory
                      ? 'Đang tải dữ liệu lịch sử quan trắc...'
                      : `Chưa có dữ liệu lịch sử cho chỉ số ${metricCfg.label}.`}
                  </Text>
                ) : (
                  <>
                    <View style={styles.historyStatsRow}>
                      <Text style={styles.historyStatItem}>
                        Thấp: <Text style={styles.historyStatBold}>{minV.toFixed(metricCfg.decimals)}</Text>
                      </Text>
                      <Text style={styles.historyStatItem}>
                        TB: <Text style={styles.historyStatBold}>{avgV.toFixed(metricCfg.decimals)}</Text>
                      </Text>
                      <Text style={styles.historyStatItem}>
                        Cao: <Text style={styles.historyStatBold}>{maxV.toFixed(metricCfg.decimals)}</Text> {metricCfg.unit}
                      </Text>
                    </View>

                    <View style={styles.chartBarsWrap}>
                      {pts.map((pt, idx) => {
                        const pct = Math.max(14, Math.min(100, ((pt.value - minV) / span) * 86 + 14));
                        const st = evaluateWaterMetricStatus(metricCfg.key, pt.value);
                        const barColor =
                          st === 'critical' ? '#BA1A1A' : st === 'warning' ? '#F59E0B' : '#006398';
                        return (
                          <View key={`${pt.measuredAt}-${idx}`} style={styles.chartBarCol}>
                            <View style={[styles.chartBar, { height: `${pct}%`, backgroundColor: barColor }]} />
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.historyHint}>
                      Ngưỡng chuẩn: {metricCfg.targetNote}
                    </Text>
                  </>
                )}
              </View>
            );
          })()}
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
  historyCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  historyTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  historyTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  historyTabBtnActive: {
    backgroundColor: '#0B1C30',
  },
  historyTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  historyTabTextActive: {
    color: '#FFFFFF',
  },
  historyEmpty: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 14,
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyStatItem: {
    fontSize: 11,
    color: '#64748B',
  },
  historyStatBold: {
    fontWeight: '900',
    color: '#0B1C30',
  },
  chartBarsWrap: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
    paddingTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chartBarCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '100%',
    maxWidth: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  historyHint: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
});
