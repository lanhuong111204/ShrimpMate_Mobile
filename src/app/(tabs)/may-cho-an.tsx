import React, { useState, useEffect } from 'react';
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
import { useFarm } from '@/context/farm-context';

export default function ScreenLiveFeeder() {
  const colors = useTheme();
  const {
    selectedPond,
    selectedFarm,
    farmInfo,
    dispensedKg,
    targetKg,
    feederPaused,
    feederRadius,
    setFeederRadius,
    hopperKg,
    isEmergencyStopped,
    toggleFeederPause,
    addFeederKg,
    triggerEmergencyStop,
    resetEmergencyStop,
  } = useFarm();

  const [testThrowTimer, setTestThrowTimer] = useState<number | null>(null);

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

  const handleStartTestThrow = () => {
    if (isEmergencyStopped) {
      Alert.alert('Cảnh Báo', 'Máy đang ở trạng thái Dừng Khẩn Cấp. Vui lòng khôi phục trước khi phun thử!');
      return;
    }
    setTestThrowTimer(10);
    Alert.alert('Đang Phun Thử', 'Bắt đầu chu kỳ phun thử 10 giây kiểm tra góc văng cám...');
  };

  const percent = Math.round((dispensedKg / targetKg) * 100);
  const hopperPercent = Math.round((hopperKg / 150) * 100);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Trạm Ăn Tự Động" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Safety Interlock Banner */}
          <View
            style={[
              styles.safetyBanner,
              {
                backgroundColor: isEmergencyStopped ? '#FFDAD6' : '#E8F5E9',
                borderColor: isEmergencyStopped ? '#BA1A1A' : '#7CF994',
              },
            ]}>
            <View style={styles.safetyHeader}>
              <MaterialIcons
                name={isEmergencyStopped ? 'dangerous' : 'verified-user'}
                size={22}
                color={isEmergencyStopped ? '#BA1A1A' : '#006E2D'}
              />
              <Text
                style={[
                  styles.safetyTitle,
                  { color: isEmergencyStopped ? '#93000A' : '#006E2D' },
                ]}>
                {isEmergencyStopped
                  ? 'TRẠNG THÁI: DỪNG KHẨN CẤP ĐÃ KÍCH HOẠT'
                  : `LIÊN ĐỘNG AN TOÀN (${selectedPond?.code || 'AO NUÔI'})`}
              </Text>
            </View>
            <Text
              style={[
                styles.safetyDesc,
                { color: isEmergencyStopped ? '#93000A' : '#005320' },
              ]}>
              {isEmergencyStopped
                ? 'Đã ngắt toàn bộ nguồn điện rơ-le máy rải cám qua sóng LoRa bờ ao.'
                : `✓ ${selectedPond?.name || farmInfo.selectedPond}: Oxy hòa tan 5.5 mg/L • Đạt chuẩn phun cám an toàn.`}
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
                    ? 'ĐÃ NGẮT NGUỒN'
                    : feederPaused
                    ? 'TẠM DỪNG PHUN'
                    : 'ĐANG PHUN CÁM (CỮ 2)'}
                </Text>
              </View>
              <Text style={styles.gaugeSub}>
                {selectedPond?.code ? `${selectedPond.code} • ` : ''}LoRa 433MHz • Bờ ao
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
                ? '⏸ Rơ-le cấp cám tạm ngắt để bà con kiểm tra sàng'
                : '⏱ Chu kỳ tự động: Phun 5 giây • Nghỉ 15 giây'}
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

          {/* Quick Actions Control Strip */}
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
                {feederPaused ? 'TIẾP TỤC PHUN' : 'TẠM DỪNG'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => addFeederKg(2)}
              disabled={isEmergencyStopped}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: '#EFF4FF',
                  borderColor: '#CCE5FF',
                  borderWidth: 1.5,
                  opacity: pressed || isEmergencyStopped ? 0.8 : 1,
                },
              ]}>
              <MaterialIcons name="add" size={20} color="#006398" />
              <Text style={[styles.actionBtnText, { color: '#006398' }]}>
                THÊM +2 KG
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

          {/* EMERGENCY STOP BUTTON */}
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
                ? 'KHÔI PHỤC NGUỒN MÁY ĂN'
                : 'DỪNG KHẨN CẤP TOÀN BỘ MÁY (EMERGENCY)'}
            </Text>
          </Pressable>
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
    fontSize: 13,
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
    marginTop: -4,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
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
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
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
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  hopperTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  hopperFill: {
    height: '100%',
    borderRadius: 3,
  },
  hopperPercentText: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  radiusBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusBtnSelected: {
    backgroundColor: '#FFDBCA',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  radiusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  radiusBtnTextSelected: {
    color: '#9D4300',
    fontWeight: '900',
  },
  radiusHint: {
    fontSize: 10,
    color: '#8C7164',
    marginTop: 2,
  },
  quickActionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  emergencyBtn: {
    height: 56,
    borderRadius: 16,
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
    letterSpacing: 0.5,
  },
});
