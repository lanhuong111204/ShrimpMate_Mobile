import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';

export default function ScreenFeederControl() {
  const colors = useTheme();

  const [isFeeding, setIsFeeding] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentKg, setCurrentKg] = useState(16);
  const [selectedRadius, setSelectedRadius] = useState('8m');
  const targetKg = 22;

  const toggleFeedState = () => {
    setIsFeeding(!isFeeding);
  };

  const togglePauseState = () => {
    setIsPaused(!isPaused);
  };

  const triggerQuickTest = () => {
    Alert.alert(
      'Kiểm Tra Mâm Quay',
      'Đang kích hoạt motor quay 10 giây để kiểm tra và vệ sinh đĩa quăng cám...'
    );
  };

  const addQuickFeed = () => {
    setCurrentKg((k) => k + 2);
    Alert.alert('Bù cám', 'Đã thêm +2 kg vào đợt phun cữ trưa!');
  };

  const emergencyStop = () => {
    setIsFeeding(false);
    setIsPaused(false);
    Alert.alert('🛑 NGẮT NGUỒN KHẨN CẤP', 'ĐÃ NGẮT NGUỒN TOÀN BỘ RƠ-LE MÁY CHO ĂN AO 2!');
  };

  const progressPercent = Math.min(100, Math.round((currentKg / targetKg) * 100));

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader title="Khu Nuôi Bạc Liêu A" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Trạng Thái Trạm Máy Cho Ăn Header Banner */}
          <View
            style={[
              styles.stationBanner,
              { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.stationLeft}>
              <View style={[styles.stationIconBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="precision-manufacturing" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.stationTitle, { color: colors.onSurface }]}>
                  MÁY CHO ĂN — AO SỐ 2
                </Text>
                <View style={styles.stationStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.stationStatusText, { color: colors.secondary }]}>
                    Sóng tốt • Bluetooth bờ ao sẵn sàng
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.stationIdBadge, { backgroundColor: colors.surfaceContainerHighest }]}>
                <Text style={[styles.stationIdText, { color: colors.onSurface }]}>ID: FDX-02</Text>
              </View>
              <Text style={[styles.stationBattery, { color: colors.outline }]}>Pin trạm: 94%</Text>
            </View>
          </View>

          {/* Water Interlock Safe Card */}
          <View
            style={[
              styles.interlockCard,
              {
                backgroundColor: colors.secondaryContainer,
                borderColor: colors.secondary,
              },
            ]}>
            <View style={styles.interlockHeader}>
              <View style={styles.interlockTitleRow}>
                <MaterialIcons name="verified" size={22} color={colors.secondary} />
                <Text style={[styles.interlockTitle, { color: colors.onSecondaryFixed }]}>
                  NƯỚC TỐT — MÁY SẴN SÀNG CHO ĂN
                </Text>
              </View>
              <View style={[styles.interlockBadge, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="lock-open" size={12} color={colors.onSecondaryContainer} />
                <Text style={[styles.interlockBadgeText, { color: colors.onSecondaryContainer }]}>
                  Đã mở van
                </Text>
              </View>
            </View>

            <View style={[styles.interlockGrid, { borderTopColor: colors.secondary + '30' }]}>
              <View style={[styles.interlockMetricBox, { backgroundColor: colors.surface + 'EE' }]}>
                <MaterialIcons name="air" size={22} color={colors.primary} />
                <View>
                  <Text style={[styles.interlockMetricLabel, { color: colors.onSurfaceVariant }]}>
                    OXY HÒA TAN
                  </Text>
                  <Text style={[styles.interlockMetricVal, { color: colors.primary }]}>
                    5.5 <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>mg/L</Text>
                  </Text>
                </View>
              </View>

              <View style={[styles.interlockMetricBox, { backgroundColor: colors.surface + 'EE' }]}>
                <MaterialIcons name="device-thermostat" size={22} color={colors.tertiary} />
                <View>
                  <Text style={[styles.interlockMetricLabel, { color: colors.onSurfaceVariant }]}>
                    NHIỆT ĐỘ NƯỚC
                  </Text>
                  <Text style={[styles.interlockMetricVal, { color: colors.tertiary }]}>29.5°C</Text>
                </View>
              </View>
            </View>

            <View style={styles.interlockFooter}>
              <Text style={[styles.interlockFooterLeft, { color: colors.onSecondaryContainer }]}>
                Đo tại phao tự động ao số 2
              </Text>
              <View style={styles.interlockFooterBadges}>
                <View style={[styles.smallParamBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.smallParamText, { color: colors.onSurface }]}>pH 7.8</Text>
                </View>
                <View style={[styles.smallParamBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.smallParamText, { color: colors.onSurface }]}>Độ mặn 18‰</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Hopper Visual & Feeding Progress */}
          <View
            style={[
              styles.hopperCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.hopperHeader}>
              <View>
                <Text style={[styles.feedingSlotTag, { color: colors.primary }]}>
                  CỮ TRƯA (10:30 - 11:30)
                </Text>
                <Text style={[styles.feedingSlotTitle, { color: colors.onSurface }]}>
                  Tiến độ rải cám hiện tại
                </Text>
              </View>

              <View style={[styles.feedingStatusPill, { backgroundColor: colors.primary }]}>
                <View style={styles.feedingPulseDot} />
                <Text style={styles.feedingStatusText}>
                  {isPaused ? 'Đang tạm dừng' : isFeeding ? 'Đang phun đợt 3' : 'Máy tắt'}
                </Text>
              </View>
            </View>

            <View style={[styles.hopperInner, { backgroundColor: colors.surfaceContainerLow }]}>
              {/* Funnel Hopper Graphic */}
              <View style={[styles.hopperLeft, { borderRightColor: colors.outlineVariant + '40' }]}>
                <View style={styles.hopperGraphicContainer}>
                  <View style={[styles.hopperTrapTop, { backgroundColor: colors.surfaceVariant }]} />
                  <View style={[styles.hopperFeedFill, { backgroundColor: colors.tertiaryContainer }]}>
                    <View style={styles.feedPelletsRow}>
                      <View style={[styles.pellet, { backgroundColor: colors.tertiaryFixedDim }]} />
                      <View style={[styles.pellet, { backgroundColor: colors.tertiaryFixedDim }]} />
                      <View style={[styles.pellet, { backgroundColor: colors.tertiaryFixedDim }]} />
                    </View>
                  </View>
                  <View style={[styles.hopperNozzle, { backgroundColor: colors.outline }]} />
                  <View style={[styles.hopperDisc, { backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.hopperWeightText, { color: colors.onSurface }]}>
                  Thùng còn: <Text style={{ color: colors.tertiary, fontWeight: '900' }}>35 kg</Text>
                </Text>
                <Text style={[styles.hopperCapacity, { color: colors.outline }]}>
                  (Sức chứa 50 kg)
                </Text>
              </View>

              {/* Stats Counter */}
              <View style={styles.hopperRight}>
                <Text style={[styles.counterTag, { color: colors.outline }]}>
                  ĐÃ PHUN / KẾ HOẠCH
                </Text>
                <View style={styles.counterNumRow}>
                  <Text style={[styles.counterBigNum, { color: colors.primary }]}>{currentKg}</Text>
                  <Text style={[styles.counterTargetNum, { color: colors.onSurfaceVariant }]}>
                    / {targetKg} kg
                  </Text>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressLabel, { color: colors.onSurface }]}>
                      Tiến độ cữ trưa:
                    </Text>
                    <Text style={[styles.progressValText, { color: colors.primary }]}>
                      {progressPercent}%
                    </Text>
                  </View>

                  <View style={[styles.progressBarOuter, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <View
                      style={[
                        styles.progressBarInner,
                        { width: `${progressPercent}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>

                  <View style={styles.progressNoteRow}>
                    <MaterialIcons name="check-circle" size={13} color={colors.secondary} />
                    <Text style={[styles.progressNote, { color: colors.onSurfaceVariant }]}>
                      Phun đợt 3/4 • Còn {Math.max(0, targetKg - currentKg)} kg
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Big Touch Control Buttons */}
          <View style={styles.controlsGroup}>
            {/* Run / Stop Toggle Button */}
            <Pressable
              onPress={toggleFeedState}
              style={({ pressed }) => [
                styles.btnMainFeed,
                {
                  backgroundColor: isFeeding ? colors.primary : colors.surfaceContainer,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <MaterialIcons
                name="sync"
                size={28}
                color={isFeeding ? '#FFFFFF' : colors.onSurface}
              />
              <View>
                <Text
                  style={[
                    styles.btnMainFeedTitle,
                    { color: isFeeding ? '#FFFFFF' : colors.onSurface },
                  ]}>
                  {isFeeding ? '[ ĐANG CHẠY PHUN CÁM ]' : '[ BẮT ĐẦU CHO ĂN ]'}
                </Text>
                <Text
                  style={[
                    styles.btnMainFeedSub,
                    { color: isFeeding ? 'rgba(255,255,255,0.9)' : colors.onSurfaceVariant },
                  ]}>
                  Nhịp: 4 giây phun / 25 giây nghỉ
                </Text>
              </View>
            </Pressable>

            {/* Pause Toggle Button */}
            <Pressable
              onPress={togglePauseState}
              style={({ pressed }) => [
                styles.btnPause,
                {
                  backgroundColor: isPaused ? colors.secondary : colors.tertiaryContainer,
                  borderColor: isPaused ? colors.secondary : colors.tertiary + '60',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <MaterialIcons
                name={isPaused ? 'play-arrow' : 'pause-circle'}
                size={26}
                color="#FFFFFF"
              />
              <Text style={styles.btnPauseText}>
                {isPaused
                  ? '[ TIẾP TỤC CHO ĂN ] — ĐÃ XONG NHÁ'
                  : '[ TẠM DỪNG PHUN — KÉO NHÁ ]'}
              </Text>
            </Pressable>

            <View style={styles.quickActionRow}>
              <Pressable
                onPress={triggerQuickTest}
                style={({ pressed }) => [
                  styles.quickActionBtn,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant + '40',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <MaterialIcons name="play-circle" size={22} color={colors.primary} />
                <View>
                  <Text style={[styles.quickActionTitle, { color: colors.primary }]}>
                    PHUN THỬ 10s
                  </Text>
                  <Text style={[styles.quickActionSub, { color: colors.onSurfaceVariant }]}>
                    Check kẹt mâm
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={addQuickFeed}
                style={({ pressed }) => [
                  styles.quickActionBtn,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant + '40',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <MaterialIcons name="add-circle" size={22} color={colors.secondary} />
                <View>
                  <Text style={[styles.quickActionTitle, { color: colors.secondary }]}>
                    + PHUN THÊM 2 KG
                  </Text>
                  <Text style={[styles.quickActionSub, { color: colors.onSurfaceVariant }]}>
                    Bù nhá ăn sạch
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Chỉnh Bán Kính Phun Cám */}
          <View
            style={[
              styles.radiusCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.radiusHeader}>
              <View style={styles.radiusTitleRow}>
                <MaterialIcons name="radar" size={20} color={colors.primary} />
                <Text style={[styles.radiusTitle, { color: colors.onSurface }]}>
                  Bán Kính Phun Cám
                </Text>
              </View>
              <Text style={[styles.radiusSub, { color: colors.primary }]}>Biến tần mâm quay</Text>
            </View>

            <View style={styles.radiusGrid}>
              {[
                { val: '6m', label: '6 Mét', freq: '35 Hz' },
                { val: '8m', label: '8 Mét (Chuẩn)', freq: '45 Hz' },
                { val: '10m', label: '10 Mét', freq: '55 Hz' },
              ].map((r) => {
                const isSelected = selectedRadius === r.val;
                return (
                  <Pressable
                    key={r.val}
                    onPress={() => setSelectedRadius(r.val)}
                    style={({ pressed }) => [
                      styles.radiusBtn,
                      {
                        backgroundColor: isSelected ? colors.inverseSurface : colors.surfaceContainer,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.radiusBtnLabel,
                        { color: isSelected ? '#FFFFFF' : colors.onSurface },
                      ]}>
                      {r.label}
                    </Text>
                    <Text
                      style={[
                        styles.radiusBtnFreq,
                        { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.outline },
                      ]}>
                      {r.freq}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Nút Dừng Khẩn Cấp Ngoại Cỡ */}
          <Pressable
            onPress={emergencyStop}
            style={({ pressed }) => [
              styles.emergencyStopBtn,
              { backgroundColor: colors.error, opacity: pressed ? 0.9 : 1 },
            ]}>
            <MaterialIcons name="dangerous" size={30} color="#FFFFFF" />
            <View>
              <Text style={styles.emergencyStopTitle}>🛑 DỪNG MÁY NGAY LẬP TỨC</Text>
              <Text style={styles.emergencyStopSub}>
                Ngắt điện tức thì • Hãm motor an toàn
              </Text>
            </View>
          </Pressable>

          {/* Cảnh Báo Dự Phòng Đồng Hồ Pin RTC */}
          <View style={[styles.rtcNotice, { backgroundColor: colors.surfaceContainer }]}>
            <MaterialIcons name="offline-bolt" size={20} color={colors.primary} />
            <Text style={[styles.rtcNoticeText, { color: colors.onSurfaceVariant }]}>
              Chế độ độc lập: Nếu mất sóng di động 4G tại bờ ao, máy vẫn tự rải cám chính xác theo vi
              xử lý và đồng hồ pin RTC bên trong tủ máy.
            </Text>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  container: {
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  stationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  stationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  stationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stationStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stationIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stationIdText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stationBattery: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  interlockCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  interlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  interlockTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  interlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  interlockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  interlockGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  interlockMetricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  interlockMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  interlockMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
  interlockFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interlockFooterLeft: {
    fontSize: 11,
    fontWeight: '700',
  },
  interlockFooterBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  smallParamBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallParamText: {
    fontSize: 11,
    fontWeight: '800',
  },
  hopperCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  hopperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedingSlotTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feedingSlotTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  feedingStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  feedingPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  feedingStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hopperInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  hopperLeft: {
    width: 100,
    alignItems: 'center',
    borderRightWidth: 1,
    paddingRight: 8,
  },
  hopperGraphicContainer: {
    width: 64,
    height: 70,
    alignItems: 'center',
    position: 'relative',
  },
  hopperTrapTop: {
    width: 56,
    height: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  hopperFeedFill: {
    width: 44,
    height: 38,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedPelletsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pellet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  hopperNozzle: {
    width: 14,
    height: 8,
    borderRadius: 2,
  },
  hopperDisc: {
    width: 32,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  hopperWeightText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  hopperCapacity: {
    fontSize: 9,
    fontWeight: '600',
  },
  hopperRight: {
    flex: 1,
    justifyContent: 'center',
  },
  counterTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  counterNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  counterBigNum: {
    fontSize: 32,
    fontWeight: '900',
  },
  counterTargetNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressSection: {
    marginTop: 6,
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressValText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 999,
  },
  progressNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  progressNote: {
    fontSize: 10,
    fontWeight: '600',
  },
  controlsGroup: {
    gap: 10,
  },
  btnMainFeed: {
    height: 58,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnMainFeedTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnMainFeedSub: {
    fontSize: 10,
  },
  btnPause: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPauseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: '900',
  },
  quickActionSub: {
    fontSize: 9,
    fontWeight: '600',
  },
  radiusCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  radiusSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  radiusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  radiusBtnLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  radiusBtnFreq: {
    fontSize: 10,
    fontWeight: '600',
  },
  emergencyStopBtn: {
    height: 60,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyStopTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emergencyStopSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  rtcNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  rtcNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
});
