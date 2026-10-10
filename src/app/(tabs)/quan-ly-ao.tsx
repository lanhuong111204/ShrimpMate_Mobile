import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { useFarm } from '@/context/farm-context';

export default function ScreenTrayWater() {
  const colors = useTheme();
  const {
    farmInfo,
    selectedPond,
    selectedFarm,
    appetiteLevel,
    setAppetiteLevel,
    trayCleanPercent,
    isScanningTray,
    scanTray,
  } = useFarm();

  const pondDisplayName = selectedPond?.name || selectedPond?.code || farmInfo.selectedPond;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Giám Sát & Nhá Ăn" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Top Quick Bio Status Strip */}
          <View
            style={[
              styles.statusStrip,
              { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.statusLeft}>
              <View style={styles.pingDotGroup}>
                <View style={styles.pingDot} />
              </View>
              <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
                {pondDisplayName} • Giám sát trực tiếp
              </Text>
            </View>
            <View style={[styles.bioBadge, { backgroundColor: colors.secondaryContainer }]}>
              <MaterialIcons name="verified" size={14} color={colors.onSecondaryContainer} />
              <Text style={[styles.bioBadgeText, { color: colors.onSecondaryContainer }]}>
                Đạt chuẩn sinh học
              </Text>
            </View>
          </View>

          {/* AI Camera & Tray Assessment Card */}
          <View
            style={[
              styles.trayCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
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
                  AI nhận diện độ sạch sàng:{' '}
                  <Text style={{ fontWeight: '900', color: '#7FFC97' }}>
                    {trayCleanPercent}%
                  </Text>
                </Text>
              </View>

              {/* Floating Bottom Activity Tag */}
              <View style={styles.floatingBottomTag}>
                <View style={styles.activityIcon}>
                  <MaterialIcons name="psychology" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.activityTitle}>Sức ăn tôm: Rất Mạnh</Text>
                  <Text style={styles.activitySub}>
                    {selectedPond?.code ? `${selectedPond.code} • ` : ''}Nhá số 02 • Giữa tim ao
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
                    CHỤP ẢNH / QUÉT NHÁ MỚI BẰNG AI
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Appetite Selector Strip */}
          <View
            style={[
              styles.appetiteCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <Text style={[styles.appetiteHeading, { color: colors.onSurface }]}>
              ĐÁNH GIÁ SỨC ĂN TÔM (CHỦ VUÔNG XÁC NHẬN)
            </Text>
            <View style={styles.appetiteButtons}>
              <Pressable
                onPress={() => setAppetiteLevel('weak')}
                style={[
                  styles.appetiteBtn,
                  appetiteLevel === 'weak' && styles.appetiteBtnWeak,
                ]}>
                <Text
                  style={[
                    styles.appetiteText,
                    appetiteLevel === 'weak' && styles.appetiteTextWeak,
                  ]}>
                  Ăn Chậm (Sót cám)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setAppetiteLevel('strong')}
                style={[
                  styles.appetiteBtn,
                  appetiteLevel === 'strong' && styles.appetiteBtnStrong,
                ]}>
                <Text
                  style={[
                    styles.appetiteText,
                    appetiteLevel === 'strong' && styles.appetiteTextStrong,
                  ]}>
                  Ăn Mạnh (Hết sạch)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setAppetiteLevel('skip')}
                style={[
                  styles.appetiteBtn,
                  appetiteLevel === 'skip' && styles.appetiteBtnSkip,
                ]}>
                <Text
                  style={[
                    styles.appetiteText,
                    appetiteLevel === 'skip' && styles.appetiteTextSkip,
                  ]}>
                  Cắt Cữ (Thời tiết xấu)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 5-Water Metrics Real-Time Dashboard */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              CHỈ SỐ MÔI TRƯỜNG NƯỚC THỜI GIAN THỰC
            </Text>
            <Text style={styles.sensorStatus}>Cảm biến IoT LoRa • Ổn định</Text>
          </View>

          <View style={styles.metricsGrid}>
            {/* Metric 1: Dissolved Oxygen */}
            <View
              style={[
                styles.metricCardItem,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="air" size={18} color="#006E2D" />
                <View style={[styles.metricPill, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.metricPillText, { color: '#006E2D' }]}>TỐI ƯU</Text>
                </View>
              </View>
              <Text style={styles.metricName}>Oxy Hòa Tan (DO)</Text>
              <Text style={[styles.metricLargeVal, { color: '#006E2D' }]}>
                {farmInfo.dissolvedOxygen}{' '}
                <Text style={styles.metricUnit}>mg/L</Text>
              </Text>
              <Text style={styles.metricTarget}>Chuẩn VietGAP: &gt; 4.0 mg/L</Text>
            </View>

            {/* Metric 2: Water Temperature */}
            <View
              style={[
                styles.metricCardItem,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="thermostat" size={18} color="#F97316" />
                <View style={[styles.metricPill, { backgroundColor: '#FFDBCA' }]}>
                  <Text style={[styles.metricPillText, { color: '#9D4300' }]}>HƠI NẮNG</Text>
                </View>
              </View>
              <Text style={styles.metricName}>Nhiệt Độ Nước</Text>
              <Text style={[styles.metricLargeVal, { color: '#F97316' }]}>
                {farmInfo.waterTemp}{' '}
                <Text style={styles.metricUnit}>°C</Text>
              </Text>
              <Text style={styles.metricTarget}>Chuẩn VietGAP: 28 - 32°C</Text>
            </View>

            {/* Metric 3: Salinity */}
            <View
              style={[
                styles.metricCardItem,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="opacity" size={18} color="#006398" />
                <View style={[styles.metricPill, { backgroundColor: '#CCE5FF' }]}>
                  <Text style={[styles.metricPillText, { color: '#006398' }]}>LÝ TƯỞNG</Text>
                </View>
              </View>
              <Text style={styles.metricName}>Độ Mặn Vuông</Text>
              <Text style={[styles.metricLargeVal, { color: '#006398' }]}>
                {farmInfo.salinity}{' '}
                <Text style={styles.metricUnit}>‰</Text>
              </Text>
              <Text style={styles.metricTarget}>Trạm Ba Tri: 18‰</Text>
            </View>

            {/* Metric 4: pH */}
            <View
              style={[
                styles.metricCardItem,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="colorize" size={18} color="#006E2D" />
                <View style={[styles.metricPill, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.metricPillText, { color: '#006E2D' }]}>ỔN ĐỊNH</Text>
                </View>
              </View>
              <Text style={styles.metricName}>Độ pH Nước</Text>
              <Text style={[styles.metricLargeVal, { color: '#006E2D' }]}>
                {farmInfo.ph}{' '}
                <Text style={styles.metricUnit}>pH</Text>
              </Text>
              <Text style={styles.metricTarget}>Chuẩn VietGAP: 7.5 - 8.5</Text>
            </View>

            {/* Metric 5: Toxic gas NH3 */}
            <View
              style={[
                styles.metricCardItemFull,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
              ]}>
              <View style={styles.metricCardTop}>
                <MaterialIcons name="science" size={18} color="#006E2D" />
                <View style={[styles.metricPill, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.metricPillText, { color: '#006E2D' }]}>AN TOÀN</Text>
                </View>
              </View>
              <Text style={styles.metricName}>Khí Độc Đáy Ao (NH3 / Khí Amoniac)</Text>
              <Text style={[styles.metricLargeVal, { color: '#006E2D' }]}>
                {farmInfo.nh3}{' '}
                <Text style={styles.metricUnit}>mg/L</Text>
              </Text>
              <Text style={styles.metricTarget}>
                Ngưỡng an toàn sinh học: &lt; 0.1 mg/L • Đáy ao sạch mùn bã
              </Text>
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
  },
  pingDotGroup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006E2D',
  },
  pingDot: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
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
  cameraViewport: {
    position: 'relative',
    width: '100%',
    height: 210,
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
    backgroundColor: 'rgba(33, 49, 69, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  floatingAiTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingBottomTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(33, 49, 69, 0.85)',
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
    fontSize: 13,
    fontWeight: '800',
  },
  activitySub: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  appetiteHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  appetiteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  appetiteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appetiteBtnWeak: {
    backgroundColor: '#FFDAD6',
    borderWidth: 1.5,
    borderColor: '#BA1A1A',
  },
  appetiteBtnStrong: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#006E2D',
  },
  appetiteBtnSkip: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  appetiteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#584237',
    textAlign: 'center',
  },
  appetiteTextWeak: {
    color: '#BA1A1A',
    fontWeight: '900',
  },
  appetiteTextStrong: {
    color: '#006E2D',
    fontWeight: '900',
  },
  appetiteTextSkip: {
    color: '#9D4300',
    fontWeight: '900',
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
    letterSpacing: 0.3,
  },
  sensorStatus: {
    fontSize: 11,
    color: '#8C7164',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCardItem: {
    width: '48.5%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  metricCardItemFull: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metricPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  metricName: {
    fontSize: 12,
    color: '#584237',
    fontWeight: '700',
    marginTop: 2,
  },
  metricLargeVal: {
    fontSize: 22,
    fontWeight: '900',
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
