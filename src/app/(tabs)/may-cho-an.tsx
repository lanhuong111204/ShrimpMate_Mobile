import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { NoAssignedPondState } from '@/components/common/no-assigned-pond';
import { useFarm } from '@/context/farm-context';
import { EvaluateSafetyResponse } from '@/types/safety-rule';

export default function ScreenLiveFeeder() {
  const colors = useTheme();
  const {
    ponds,
    selectedPond,
    farmInfo,
    latestTelemetry,
    feederDevice,
    lastSafetyEvaluation,
    evaluateSafetyBeforeFeed,
    triggerQuickFeed,
    dispensedKg,
    targetKg,
    feederPaused,
    feederRadius,
    setFeederRadius,
    hopperKg,
    isEmergencyStopped,
    toggleFeederPause,
    triggerEmergencyStop,
    resetEmergencyStop,
    isRefreshingPondData,
    refreshPondOperationalData,
    refreshFarmsAndPonds,
  } = useFarm();

  const [testThrowTimer, setTestThrowTimer] = useState<number | null>(null);

  // Quick Feed Modal State (UC012 + UC018 Safety Rule Engine)
  const [showQuickFeedModal, setShowQuickFeedModal] = useState(false);
  const [quickFeedKg, setQuickFeedKg] = useState('5.0');
  const [safetyPreview, setSafetyPreview] = useState<EvaluateSafetyResponse | null>(null);
  const [isEvaluatingSafety, setIsEvaluatingSafety] = useState(false);
  const [isTriggeringFeed, setIsTriggeringFeed] = useState(false);

  const hasAssignedPond = Boolean(selectedPond && ponds.length > 0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (testThrowTimer !== null && testThrowTimer > 0) {
      interval = setInterval(() => {
        setTestThrowTimer((t) => (t !== null && t > 0 ? t - 1 : null));
      }, 1000);
    } else if (testThrowTimer === 0) {
      setTestThrowTimer(null);
      Alert.alert('Hoàn Tất Phun Thử', 'Đã hoàn tất phun thử 10 giây. Mâm xoay ly tâm hoạt động trơn tru!');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testThrowTimer]);

  if (!hasAssignedPond) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.surface }]}>
        <AppHeader subtitle="Trạm Ăn Tự Động" />
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

  const handleOpenQuickFeedModal = async (defaultKg = '5.0') => {
    setQuickFeedKg(defaultKg);
    setShowQuickFeedModal(true);
    const numKg = parseFloat(defaultKg) || 5.0;
    setIsEvaluatingSafety(true);
    try {
      const res = await evaluateSafetyBeforeFeed(numKg);
      setSafetyPreview(res);
    } finally {
      setIsEvaluatingSafety(false);
    }
  };

  const handleReEvaluateSafety = async (textVal: string) => {
    setQuickFeedKg(textVal);
    const numKg = parseFloat(textVal);
    if (!isNaN(numKg) && numKg > 0) {
      setIsEvaluatingSafety(true);
      try {
        const res = await evaluateSafetyBeforeFeed(numKg);
        setSafetyPreview(res);
      } finally {
        setIsEvaluatingSafety(false);
      }
    }
  };

  const handleConfirmQuickFeed = async () => {
    const numKg = parseFloat(quickFeedKg);
    if (isNaN(numKg) || numKg <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập khối lượng thức ăn hợp lệ (> 0 kg)');
      return;
    }

    setIsTriggeringFeed(true);
    try {
      const result = await triggerQuickFeed(numKg, 'manual');
      setSafetyPreview(result.evaluation);

      if (!result.success || result.evaluation.decision === 'blocked') {
        Alert.alert(
          '⛔ BỊ CHẶN BỞI SAFETY RULE ENGINE',
          result.evaluation.reasons.join('\n') ||
            'Chỉ số nước hiện tại không an toàn để xả thức ăn.'
        );
        return;
      }

      setShowQuickFeedModal(false);
      if (result.evaluation.decision === 'adjusted') {
        Alert.alert(
          '⚠️ ĐÃ ĐIỀU CHỈNH KHẨU PHẦN AN TOÀN',
          `${result.evaluation.reasons.join('\n')}\n\nMáy cho ăn đang rải ${result.evaluation.allowedAmountKg} kg qua MQTT.`
        );
      } else {
        Alert.alert(
          '✓ Đã Phát Lệnh Xả Cám',
          `Đã kiểm duyệt an toàn (Allowed) và kích hoạt máy cho ăn xả ${numKg} kg cám!`
        );
      }
    } finally {
      setIsTriggeringFeed(false);
    }
  };

  const handleStartTestThrow = () => {
    if (isEmergencyStopped) {
      Alert.alert('Cảnh Báo', 'Máy đang ở trạng thái Dừng Khẩn Cấp. Vui lòng khôi phục trước khi phun thử!');
      return;
    }
    setTestThrowTimer(10);
    Alert.alert('Đang Phun Thử', 'Bắt đầu chu kỳ phun thử 10 giây kiểm tra góc văng cám...');
  };

  const percent = targetKg > 0 ? Math.min(100, Math.round((dispensedKg / targetKg) * 100)) : 0;
  const hopperPercent = Math.round((hopperKg / 150) * 100);

  const currentDecision = safetyPreview?.decision || lastSafetyEvaluation?.decision || 'allowed';
  const isFeedBlocked = isEmergencyStopped || currentDecision === 'blocked';
  const doVal = latestTelemetry?.dissolvedOxygenMgL ?? farmInfo.dissolvedOxygen;
  const phVal = latestTelemetry?.ph ?? farmInfo.ph;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Trạm Ăn Tự Động" />

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
          {/* Safety Rule Engine Interlock Banner (Quy tắc 2) */}
          <View
            style={[
              styles.safetyBanner,
              {
                backgroundColor: isEmergencyStopped || currentDecision === 'blocked'
                  ? '#FFDAD6'
                  : currentDecision === 'adjusted'
                  ? '#FEF3C7'
                  : '#E8F5E9',
                borderColor: isEmergencyStopped || currentDecision === 'blocked'
                  ? '#BA1A1A'
                  : currentDecision === 'adjusted'
                  ? '#F59E0B'
                  : '#7CF994',
              },
            ]}>
            <View style={styles.safetyHeader}>
              <MaterialIcons
                name={
                  isEmergencyStopped || currentDecision === 'blocked'
                    ? 'dangerous'
                    : currentDecision === 'adjusted'
                    ? 'warning-amber'
                    : 'verified-user'
                }
                size={22}
                color={
                  isEmergencyStopped || currentDecision === 'blocked'
                    ? '#BA1A1A'
                    : currentDecision === 'adjusted'
                    ? '#B45309'
                    : '#006E2D'
                }
              />
              <Text
                style={[
                  styles.safetyTitle,
                  {
                    color:
                      isEmergencyStopped || currentDecision === 'blocked'
                        ? '#93000A'
                        : currentDecision === 'adjusted'
                        ? '#92400E'
                        : '#006E2D',
                  },
                ]}>
                {isEmergencyStopped
                  ? 'TRẠNG THÁI: DỪNG KHẨN CẤP (EMERGENCY STOP)'
                  : currentDecision === 'blocked'
                  ? 'SAFETY RULE ENGINE: KHÓA XẢ CÁM (BLOCKED)'
                  : currentDecision === 'adjusted'
                  ? 'SAFETY RULE ENGINE: ĐIỀU CHỈNH AN TOÀN (ADJUSTED)'
                  : `SAFETY RULE ENGINE: AN TOÀN (${selectedPond?.code || 'AO-01'})`}
              </Text>
            </View>
            <Text
              style={[
                styles.safetyDesc,
                {
                  color:
                    isEmergencyStopped || currentDecision === 'blocked'
                      ? '#93000A'
                      : currentDecision === 'adjusted'
                      ? '#92400E'
                      : '#005320',
                },
              ]}>
              {isEmergencyStopped
                ? `Đã ngắt động cơ máy cho ăn (${feederDevice?.deviceUid || 'ESP32_FEEDER_01'}) qua MQTT.`
                : lastSafetyEvaluation?.reasons?.[0] ||
                  `✓ ${selectedPond?.name || farmInfo.selectedPond}: DO = ${doVal} mg/L, pH = ${phVal} • Đạt chuẩn xả cám an toàn.`}
            </Text>
          </View>

          {/* Main Feeder Circular Gauge Card */}
          <View
            style={[
              styles.gaugeCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.gaugeHeaderRow}>
              <View style={styles.gaugeStatusDotGroup}>
                <View
                  style={[
                    styles.pulseDot,
                    {
                      backgroundColor: isEmergencyStopped
                        ? '#BA1A1A'
                        : feederPaused
                        ? '#F97316'
                        : '#006E2D',
                    },
                  ]}
                />
                <Text style={[styles.gaugeStatusText, { color: colors.onSurface }]}>
                  {isEmergencyStopped
                    ? 'ĐÃ NGẮT NGUỒN (E-STOP)'
                    : feederPaused
                    ? 'CHẾ ĐỘ THỦ CÔNG (MANUAL)'
                    : 'CHẾ ĐỘ TỰ ĐỘNG (AUTOMATIC)'}
                </Text>
              </View>
              <Text style={styles.gaugeSub}>
                {feederDevice?.deviceUid || 'ESP32_FEEDER_01'} • MQTT
              </Text>
            </View>

            {/* Big Circular Progress Indicator */}
            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.outerCircle,
                  {
                    borderColor: isEmergencyStopped
                      ? '#FFDAD6'
                      : feederPaused
                      ? '#FFDBCA'
                      : '#7CF994',
                  },
                ]}>
                <View
                  style={[
                    styles.innerCircle,
                    {
                      backgroundColor: isEmergencyStopped
                        ? '#FFF8F8'
                        : feederPaused
                        ? '#FFF8F5'
                        : '#F0FDF4',
                    },
                  ]}>
                  <Text style={[styles.progressKgText, { color: colors.onSurface }]}>
                    {dispensedKg.toFixed(1)}
                  </Text>
                  <Text style={styles.progressTotalText}>/ {targetKg} kg</Text>
                  <View style={[styles.percentBadge, { backgroundColor: '#FFDBCA' }]}>
                    <Text style={styles.percentBadgeText}>{percent}% ĐÃ RẢI</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={[styles.cycleNote, { color: colors.onSurfaceVariant }]}>
              {feederPaused
                ? '⏸ Đang ở chế độ Thủ công • Tạm ngắt lịch tự động'
                : '⏱ Chu kỳ MQTT: Tốc độ rải 1.5 kg/phút • Kiểm duyệt Safety Rule'}
            </Text>
          </View>

          {/* Hopper (Thùng chứa cám) & Radius Selector */}
          <View style={styles.twoColumnGrid}>
            {/* Hopper Card */}
            <View
              style={[
                styles.smallCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant + '40',
                },
              ]}>
              <View style={styles.smallCardHeader}>
                <MaterialIcons name="inventory" size={18} color="#F97316" />
                <Text style={[styles.smallCardTitle, { color: colors.onSurface }]}>
                  Thùng Cám
                </Text>
              </View>
              <Text style={[styles.hopperKgVal, { color: colors.onSurface }]}>
                {hopperKg} <Text style={{ fontSize: 13, fontWeight: '600' }}>/ 150 kg</Text>
              </Text>
              <View style={[styles.hopperTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View
                  style={[
                    styles.hopperFill,
                    {
                      width: `${hopperPercent}%`,
                      backgroundColor: hopperKg < 30 ? '#BA1A1A' : '#F97316',
                    },
                  ]}
                />
              </View>
              <Text style={styles.hopperPercentText}>{hopperPercent}% dung tích</Text>
            </View>

            {/* Radius Selector Card */}
            <View
              style={[
                styles.smallCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant + '40',
                },
              ]}>
              <View style={styles.smallCardHeader}>
                <MaterialIcons name="radar" size={18} color="#9D4300" />
                <Text style={[styles.smallCardTitle, { color: colors.onSurface }]}>
                  Góc Văng Cám
                </Text>
              </View>
              <View style={styles.radiusButtonGroup}>
                {(['3m', '6m', '9m'] as const).map((r) => {
                  const isSelected = feederRadius === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setFeederRadius(r)}
                      style={[
                        styles.radiusBtn,
                        isSelected && styles.radiusBtnSelected,
                      ]}>
                      <Text
                        style={[
                          styles.radiusBtnText,
                          isSelected && styles.radiusBtnTextSelected,
                        ]}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.radiusHint}>Mâm xoay ly tâm 2800 RPM</Text>
            </View>
          </View>

          {/* Quick Actions Control Strip (1-Tap Control - UC012) */}
          <View style={styles.quickActionGrid}>
            <Pressable
              onPress={toggleFeederPause}
              disabled={isEmergencyStopped}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: feederPaused ? '#006E2D' : '#FFDBCA',
                  opacity: pressed || isEmergencyStopped ? 0.8 : 1,
                },
              ]}>
              <MaterialIcons
                name={feederPaused ? 'play-arrow' : 'pause'}
                size={22}
                color={feederPaused ? '#FFFFFF' : '#9D4300'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: feederPaused ? '#FFFFFF' : '#9D4300' },
                ]}>
                {feederPaused ? 'BẬT TỰ ĐỘNG' : 'TẠM DỪNG'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleOpenQuickFeedModal('5.0')}
              disabled={isFeedBlocked}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: isFeedBlocked ? '#E5E7EB' : '#EFF4FF',
                  borderColor: isFeedBlocked ? '#9CA3AF' : '#006398',
                  borderWidth: 1.5,
                  opacity: pressed || isFeedBlocked ? 0.6 : 1,
                },
              ]}>
              <MaterialIcons
                name={isFeedBlocked ? 'block' : 'bolt'}
                size={20}
                color={isFeedBlocked ? '#6B7280' : '#006398'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isFeedBlocked ? '#6B7280' : '#006398' },
                ]}>
                {isFeedBlocked ? 'KHÓA XẢ CÁM' : 'CHO ĂN NHANH'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleStartTestThrow}
              disabled={isEmergencyStopped || testThrowTimer !== null}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: '#EFF4FF',
                  borderColor: '#E0C0B1',
                  borderWidth: 1.5,
                  opacity: pressed || isEmergencyStopped ? 0.8 : 1,
                },
              ]}>
              <MaterialIcons name="speed" size={20} color="#584237" />
              <Text style={[styles.actionBtnText, { color: '#584237' }]}>
                {testThrowTimer !== null ? `THỬ (${testThrowTimer}s)` : 'PHUN THỬ 10s'}
              </Text>
            </Pressable>
          </View>

          {/* 1-TAP EMERGENCY STOP BUTTON (POST /devices/:id/emergency-stop) */}
          <Pressable
            onPress={isEmergencyStopped ? resetEmergencyStop : triggerEmergencyStop}
            style={({ pressed }) => [
              styles.emergencyBtn,
              {
                backgroundColor: isEmergencyStopped ? '#006E2D' : '#BA1A1A',
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <MaterialIcons
              name={isEmergencyStopped ? 'restart-alt' : 'power-settings-new'}
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.emergencyBtnText}>
              {isEmergencyStopped
                ? 'KHÔI PHỤC NGUỒN MÁY ĂN (AUTOMATIC)'
                : 'DỪNG KHẨN CẤP 1 CHẠM (EMERGENCY STOP)'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* MODAL: CHO ĂN NHANH (QUICK FEED) CÓ ĐÁNH GIÁ SAFETY RULE ENGINE */}
      <Modal
        visible={showQuickFeedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickFeedModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowQuickFeedModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <MaterialIcons name="bolt" size={24} color="#EA580C" />
              <Text style={styles.modalHeading}>CHO ĂN NHANH (QUICK FEED)</Text>
            </View>
            <Text style={styles.modalSub}>
              Lệnh xả thức ăn sẽ được kiểm duyệt tự động qua Safety Rule Engine trước khi phát tới máy cho ăn.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KHỐI LƯỢNG CÁM YÊU CẦU (KG):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={quickFeedKg}
                onChangeText={handleReEvaluateSafety}
                placeholder="Nhập số kg (ví dụ: 5.0)"
              />
            </View>

            {/* Safety Evaluation Result Box */}
            <View
              style={[
                styles.evalBox,
                {
                  backgroundColor:
                    safetyPreview?.decision === 'blocked'
                      ? '#FFDAD6'
                      : safetyPreview?.decision === 'adjusted'
                      ? '#FEF3C7'
                      : '#E8F5E9',
                  borderColor:
                    safetyPreview?.decision === 'blocked'
                      ? '#BA1A1A'
                      : safetyPreview?.decision === 'adjusted'
                      ? '#F59E0B'
                      : '#7CF994',
                },
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isEvaluatingSafety ? (
                  <ActivityIndicator size="small" color="#EA580C" />
                ) : (
                  <MaterialIcons
                    name={
                      safetyPreview?.decision === 'blocked'
                        ? 'gpp-bad'
                        : safetyPreview?.decision === 'adjusted'
                        ? 'gpp-maybe'
                        : 'gpp-good'
                    }
                    size={20}
                    color={
                      safetyPreview?.decision === 'blocked'
                        ? '#BA1A1A'
                        : safetyPreview?.decision === 'adjusted'
                        ? '#B45309'
                        : '#006E2D'
                    }
                  />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '900',
                    color:
                      safetyPreview?.decision === 'blocked'
                        ? '#93000A'
                        : safetyPreview?.decision === 'adjusted'
                        ? '#92400E'
                        : '#006E2D',
                  }}>
                  {safetyPreview?.decision === 'blocked'
                    ? 'KẾT QUẢ: CẤM XẢ CÁM (BLOCKED)'
                    : safetyPreview?.decision === 'adjusted'
                    ? `KẾT QUẢ: ĐIỀU CHỈNH XUỐNG ${safetyPreview.allowedAmountKg} KG`
                    : `KẾT QUẢ: CHO PHÉP XẢ ${safetyPreview?.allowedAmountKg ?? quickFeedKg} KG`}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: '#0B1C30',
                  lineHeight: 18,
                  marginTop: 4,
                }}>
                {safetyPreview?.reasons?.[0] ||
                  `DO = ${doVal} mg/L, pH = ${phVal} • Đủ điều kiện an toàn sinh học.`}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowQuickFeedModal(false)}
                style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>HỦY</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmQuickFeed}
                disabled={isTriggeringFeed || safetyPreview?.decision === 'blocked'}
                style={[
                  styles.btnConfirm,
                  (safetyPreview?.decision === 'blocked' || isTriggeringFeed) && {
                    backgroundColor: '#9CA3AF',
                  },
                ]}>
                {isTriggeringFeed ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnConfirmText}>
                    {safetyPreview?.decision === 'blocked'
                      ? 'ĐÃ KHÓA XẢ CÁM'
                      : safetyPreview?.decision === 'adjusted'
                      ? `XẢ ${safetyPreview.allowedAmountKg} KG`
                      : 'XÁC NHẬN XẢ CÁM'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  safetyBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    flex: 1,
  },
  safetyDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  gaugeCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  gaugeHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeStatusDotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gaugeStatusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  gaugeSub: {
    fontSize: 11,
    color: '#8C7164',
    fontWeight: '600',
  },
  circleContainer: {
    paddingVertical: 10,
  },
  outerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 174,
    height: 174,
    borderRadius: 87,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressKgText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  progressTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#584237',
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9D4300',
  },
  cycleNote: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  hopperKgVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  hopperTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  hopperFill: {
    height: '100%',
    borderRadius: 999,
  },
  hopperPercentText: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusBtnSelected: {
    backgroundColor: '#F97316',
  },
  radiusBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#584237',
  },
  radiusBtnTextSelected: {
    color: '#FFFFFF',
  },
  radiusHint: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  quickActionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  emergencyBtn: {
    height: 62,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1C30',
  },
  modalSub: {
    fontSize: 12,
    color: '#584237',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B1C30',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4E3FF',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#0B1C30',
    backgroundColor: '#EFF4FF',
  },
  evalBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#584237',
  },
  btnConfirm: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
