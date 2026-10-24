import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { NoAssignedPondState } from '@/components/common/no-assigned-pond';
import { useFarm } from '@/context/farm-context';
import { evaluateWaterMetricStatus } from '@/api/services/pond.service';
import { StatusLevel } from '@/types/pond';
import { AppetiteLevel } from '@/types/camera';

function getGaugeColors(status: StatusLevel) {
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
    default:
      return {
        bgPill: '#E8F5E9',
        textColor: '#006E2D',
        borderColor: '#7CF994',
        label: 'AN TOÀN',
      };
  }
}

const FIS_LEVELS: { level: AppetiteLevel; code: string; label: string; sub: string }[] = [
  { level: 0, code: 'Mức 0', label: 'Không ăn', sub: 'Dư cám nhiều' },
  { level: 1, code: 'Mức 1', label: 'Ăn yếu', sub: 'Sót cám nhá' },
  { level: 2, code: 'Mức 2', label: 'Bình thường', sub: 'Tiêu thụ ổn' },
  { level: 3, code: 'Mức 3', label: 'Ăn mạnh', sub: 'Sạch nhá' },
];

export default function ScreenTrayWater() {
  const colors = useTheme();
  const {
    farmInfo,
    ponds,
    selectedPond,
    latestTelemetry,
    latestFis,
    fisAppetiteLevel,
    setFisAppetiteLevel,
    trayCleanPercent,
    isScanningTray,
    scanTray,
    isRefreshingPondData,
    refreshPondOperationalData,
    refreshFarmsAndPonds,
  } = useFarm();

  const hasAssignedPond = Boolean(selectedPond && ponds.length > 0);
  const pondDisplayName = selectedPond?.name || selectedPond?.code || 'Không có ao giám sát';

  // 6 chỉ số nước thực tế từ GET /ponds/:pondId/telemetry/latest
  const doVal = latestTelemetry?.dissolvedOxygenMgL ?? farmInfo.dissolvedOxygen;
  const phVal = latestTelemetry?.ph ?? farmInfo.ph;
  const tempVal = latestTelemetry?.temperatureC ?? farmInfo.waterTemp;
  const salVal = latestTelemetry?.salinityPpt ?? farmInfo.salinity;
  const nh3Val = latestTelemetry?.ammoniaMgL ?? farmInfo.nh3;
  const turbVal = latestTelemetry?.turbidityNtu ?? farmInfo.turbidity ?? 22.0;
  const measuredTimeStr = latestTelemetry?.measuredAt
    ? new Date(latestTelemetry.measuredAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Vừa cập nhật';

  // Đánh giá màu sắc chuẩn theo Quy tắc 3 (Xanh: optimal, Vàng: warning, Đỏ: critical)
  const doStatus = evaluateWaterMetricStatus('do', doVal);
  const phStatus = evaluateWaterMetricStatus('ph', phVal);
  const tempStatus = evaluateWaterMetricStatus('temperature', tempVal);
  const salStatus = evaluateWaterMetricStatus('salinity', salVal);
  const nh3Status = evaluateWaterMetricStatus('nh3', nh3Val);
  const turbStatus = evaluateWaterMetricStatus('turbidity', turbVal);

  const hasCriticalWater =
    doStatus === 'critical' || phStatus === 'critical' || nh3Status === 'critical';
  const hasWarningWater =
    !hasCriticalWater &&
    (doStatus === 'warning' || phStatus === 'warning' || nh3Status === 'warning');

  // Dữ liệu Camera FIS từ GET /camera/ponds/:pondId/latest-fis
  const fisScore = latestFis?.status?.fisScore ?? 0.785;
  const remainingFeedPct = latestFis?.status?.remainingFeedPercent ?? 100 - trayCleanPercent;
  const shrimpDensity = latestFis?.status?.shrimpDensity ?? 18.5;
  const ageSeconds = latestFis?.status?.ageSeconds ?? 25;
  const isCameraStale = Boolean(latestFis?.status?.isStale || ageSeconds > 120);

  const doTheme = getGaugeColors(doStatus);
  const phTheme = getGaugeColors(phStatus);
  const tempTheme = getGaugeColors(tempStatus);
  const salTheme = getGaugeColors(salStatus);
  const nh3Theme = getGaugeColors(nh3Status);
  const turbTheme = getGaugeColors(turbStatus);

  if (!hasAssignedPond) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.surface }]}>
        <AppHeader subtitle="Giám Sát & Nhá Ăn" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingPondData}
              onRefresh={refreshFarmsAndPonds}
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
      <AppHeader subtitle="Giám Sát & Nhá Ăn" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingPondData}
            onRefresh={refreshPondOperationalData}
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
                  : hasWarningWater
                  ? '#F59E0B'
                  : colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.pingDotGroup,
                  {
                    backgroundColor: hasCriticalWater
                      ? '#BA1A1A'
                      : hasWarningWater
                      ? '#F59E0B'
                      : '#006E2D',
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
                {pondDisplayName} • Đo lúc {measuredTimeStr}
              </Text>
            </View>
            <View
              style={[
                styles.bioBadge,
                {
                  backgroundColor: hasCriticalWater
                    ? '#FFDAD6'
                    : hasWarningWater
                    ? '#FEF3C7'
                    : colors.secondaryContainer,
                },
              ]}>
              <MaterialIcons
                name={hasCriticalWater ? 'error' : hasWarningWater ? 'warning' : 'verified'}
                size={14}
                color={
                  hasCriticalWater
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
                    color: hasCriticalWater
                      ? '#BA1A1A'
                      : hasWarningWater
                      ? '#B45309'
                      : colors.onSecondaryContainer,
                  },
                ]}>
                {hasCriticalWater
                  ? 'Nguy cấp nước'
                  : hasWarningWater
                  ? 'Cần chú ý'
                  : 'Đạt chuẩn sinh học'}
              </Text>
            </View>
          </View>

          {/* AI Camera & Tray Assessment Card (UC014, UC019) */}
          <View
            style={[
              styles.trayCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: isCameraStale ? '#F59E0B' : colors.outlineVariant + '40',
              },
            ]}>
            {/* Stale Warning Banner (> 120s) - Quy tắc 3 */}
            {isCameraStale && (
              <View style={styles.staleWarningBanner}>
                <MaterialIcons name="warning-amber" size={18} color="#92400E" />
                <Text style={styles.staleWarningText}>
                  Mất tín hiệu Camera (&gt; 120s) • Ảnh cuối cách đây {ageSeconds}s
                </Text>
              </View>
            )}

            {/* Viewport Image with AI Overlays */}
            <View style={styles.cameraViewport}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ5YhCPxPklKToJ8k-wu5XIXNzq3YF7WcI0NUdVhyhmXEaEIm5WD86Qe2e5hMoZkVTI126NEAMzsfFDAz5lTGDRRnj3tqPSuiMLxpg9yEpeBXns6aKoTnEzsTYbPYylJW0VV-73SyheKRqDihZjZwfeU7PLav6P-5bzh9baBXA1OOhJbXSThUN6NtR_3dHYiU1_2xoAXsKzQYOWl4_zUc0OSTawSHR5Ata6bCYlNGUDTtp8W42WWWfxQ',
                }}
                style={styles.trayImg}
                contentFit="cover"
              />

              {/* Floating Top AI Tag */}
              <View style={styles.floatingAiTag}>
                <MaterialIcons name="auto-awesome" size={16} color="#7FFC97" />
                <Text style={styles.floatingAiTagText}>
                  YOLO11n + MobileNetV3 • FIS:{' '}
                  <Text style={{ fontWeight: '900', color: '#7FFC97' }}>
                    {fisScore.toFixed(2)}
                  </Text>{' '}
                  • Cám dư: <Text style={{ fontWeight: '900' }}>{remainingFeedPct}%</Text>
                </Text>
              </View>

              {/* Floating Freshness Pill */}
              <View
                style={[
                  styles.freshnessPill,
                  {
                    backgroundColor: isCameraStale
                      ? 'rgba(245, 158, 11, 0.95)'
                      : 'rgba(0, 110, 45, 0.9)',
                  },
                ]}>
                <MaterialIcons
                  name={isCameraStale ? 'signal-wifi-statusbar-connected-no-internet-4' : 'videocam'}
                  size={13}
                  color="#FFFFFF"
                />
                <Text style={styles.freshnessPillText}>
                  {isCameraStale
                    ? `Mất tín hiệu Camera (> 120s)`
                    : `Live • ${ageSeconds}s trước`}
                </Text>
              </View>

              {/* Floating Bottom Activity Tag */}
              <View style={styles.floatingBottomTag}>
                <View style={styles.activityIcon}>
                  <MaterialIcons name="psychology" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>
                    Cường độ bắt mồi:{' '}
                    {latestFis?.status?.appetiteLevelDescription ||
                      `Mức ${fisAppetiteLevel} (${FIS_LEVELS[fisAppetiteLevel]?.label})`}
                  </Text>
                  <Text style={styles.activitySub}>
                    {selectedPond?.code ? `${selectedPond.code} • ` : ''}Mật độ quanh sàng:{' '}
                    {shrimpDensity} con • Độ sạch nhá: {trayCleanPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Scan Action Button */}
            <Pressable
              onPress={scanTray}
              disabled={isScanningTray}
              style={({ pressed }) => [
                styles.btnScanTray,
                { opacity: pressed || isScanningTray ? 0.85 : 1 },
              ]}>
              {isScanningTray ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                  <Text style={styles.btnScanTrayText}>
                    CHỤP ẢNH / PHÂN TÍCH NHÁ MỚI BẰNG AI
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* 4-Level FIS Appetite Selector Strip (0: Không ăn, 1: Ăn yếu, 2: Bình thường, 3: Ăn mạnh) */}
          <View
            style={[
              styles.appetiteCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.appetiteHeaderRow}>
              <Text style={[styles.appetiteHeading, { color: colors.onSurface }]}>
                CHỈ SỐ BẮT MỒI FIS (4 MỨC CHUẨN AI & KỸ THUẬT VIÊN)
              </Text>
              <Text style={styles.fisScoreTag}>FIS = {fisScore.toFixed(2)}</Text>
            </View>
            <View style={styles.appetiteButtons}>
              {FIS_LEVELS.map((item) => {
                const isSelected = fisAppetiteLevel === item.level;
                const activeBg =
                  item.level === 0
                    ? '#FFDAD6'
                    : item.level === 1
                    ? '#FEF3C7'
                    : item.level === 2
                    ? '#E0F2FE'
                    : '#E8F5E9';
                const activeBorder =
                  item.level === 0
                    ? '#BA1A1A'
                    : item.level === 1
                    ? '#F59E0B'
                    : item.level === 2
                    ? '#0284C7'
                    : '#006E2D';
                const activeColor =
                  item.level === 0
                    ? '#93000A'
                    : item.level === 1
                    ? '#92400E'
                    : item.level === 2
                    ? '#0369A1'
                    : '#006E2D';

                return (
                  <Pressable
                    key={item.level}
                    onPress={() => setFisAppetiteLevel(item.level)}
                    style={[
                      styles.appetiteBtn,
                      isSelected && {
                        backgroundColor: activeBg,
                        borderColor: activeBorder,
                        borderWidth: 1.5,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.appetiteCode,
                        isSelected && { color: activeColor, fontWeight: '900' },
                      ]}>
                      {item.code}
                    </Text>
                    <Text
                      style={[
                        styles.appetiteText,
                        isSelected && { color: activeColor, fontWeight: '900' },
                      ]}>
                      {item.label}
                    </Text>
                    <Text style={styles.appetiteSub}>{item.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6-Water Metrics Real-Time Dashboard (Telemetry Gauges - UC013) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              6 CHỈ SỐ MÔI TRƯỜNG NƯỚC (TELEMETRY GAUGES)
            </Text>
            <Pressable onPress={refreshPondOperationalData} style={styles.syncRow}>
              <MaterialIcons name="sync" size={14} color="#006E2D" />
              <Text style={styles.sensorStatus}>Làm mới</Text>
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
                    doStatus !== 'optimal' ? doTheme.borderColor : colors.outlineVariant + '40',
                  borderWidth: doStatus !== 'optimal' ? 1.5 : 1,
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
                {doVal.toFixed(1)} <Text style={styles.metricUnit}>mg/L</Text>
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
                    phStatus !== 'optimal' ? phTheme.borderColor : colors.outlineVariant + '40',
                  borderWidth: phStatus !== 'optimal' ? 1.5 : 1,
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
                {phVal.toFixed(2)} <Text style={styles.metricUnit}>pH</Text>
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
                    tempStatus !== 'optimal' ? tempTheme.borderColor : colors.outlineVariant + '40',
                  borderWidth: tempStatus !== 'optimal' ? 1.5 : 1,
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
                {tempVal.toFixed(1)} <Text style={styles.metricUnit}>°C</Text>
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
                    salStatus !== 'optimal' ? salTheme.borderColor : colors.outlineVariant + '40',
                  borderWidth: salStatus !== 'optimal' ? 1.5 : 1,
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
                {salVal.toFixed(1)} <Text style={styles.metricUnit}>‰</Text>
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
                    nh3Status !== 'optimal' ? nh3Theme.borderColor : colors.outlineVariant + '40',
                  borderWidth: nh3Status !== 'optimal' ? 1.5 : 1,
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
                {nh3Val.toFixed(2)} <Text style={styles.metricUnit}>mg/L</Text>
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
                    turbStatus !== 'optimal' ? turbTheme.borderColor : colors.outlineVariant + '40',
                  borderWidth: turbStatus !== 'optimal' ? 1.5 : 1,
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
                {turbVal.toFixed(1)} <Text style={styles.metricUnit}>NTU</Text>
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
  },
  pingDotGroup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006E2D',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bioBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trayCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  staleWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  staleWarningText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  cameraViewport: {
    position: 'relative',
    width: '100%',
    height: 215,
    backgroundColor: '#213145',
  },
  trayImg: {
    width: '100%',
    height: '100%',
  },
  floatingAiTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 28, 48, 0.86)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  floatingAiTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  freshnessPill: {
    position: 'absolute',
    top: 46,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  freshnessPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingBottomTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 28, 48, 0.88)',
    padding: 8,
    borderRadius: 12,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9D4300',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activitySub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  btnScanTray: {
    height: 48,
    backgroundColor: '#006E2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnScanTrayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appetiteCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  appetiteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appetiteHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    flex: 1,
  },
  fisScoreTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EA580C',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  appetiteButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  appetiteBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 1,
  },
  appetiteCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C7164',
  },
  appetiteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B1C30',
    textAlign: 'center',
  },
  appetiteSub: {
    fontSize: 9,
    color: '#584237',
    textAlign: 'center',
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
