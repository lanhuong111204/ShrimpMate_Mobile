import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';

export default function ScreenSchedule() {
  const colors = useTheme();

  const [cu3Active, setCu3Active] = useState(true);
  const [cu4Active, setCu4Active] = useState(true);
  const [c3Amount, setC3Amount] = useState(28);
  const [c4Amount, setC4Amount] = useState(25);
  const [showToast, setShowToast] = useState(false);

  const totalFeedToday = 20 + 22 + (cu3Active ? c3Amount : 0) + (cu4Active ? c4Amount : 0);
  const percentDone = Math.round((38 / totalFeedToday) * 100);

  const handleRebalance = () => {
    setC3Amount(27);
    setC4Amount(27);
    Alert.alert(
      'Cân Bằng Khẩu Phần',
      'Đã tự động cân bằng chia đều khẩu phần các cữ chiều và tối: 27 kg mỗi cữ!'
    );
  };

  const handleSaveSchedule = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader title="Khu Nuôi Bạc Liêu A" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Pond Context & Sync Bar */}
          <View
            style={[
              styles.contextCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.contextHeader}>
              <View style={styles.contextTitleGroup}>
                <MaterialIcons name="inventory-2" size={22} color={colors.primary} />
                <Pressable
                  onPress={() => Alert.alert('Chọn Ao Nuôi', 'Chọn ao để cài đặt lịch cữ riêng:\n• Ao 1\n• Ao 2\n• Ao 3')}
                  style={styles.contextSelectorBtn}>
                  <Text style={[styles.contextPondName, { color: colors.onSurface }]}>
                    AO SỐ 2 — Tôm Thẻ
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>

              <View style={[styles.agePill, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.agePillText, { color: colors.onSurfaceVariant }]}>
                  42 ngày tuổi
                </Text>
              </View>
            </View>

            <View style={[styles.syncBar, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.syncBarLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.syncStatusText, { color: colors.secondary }]}>Máy online</Text>
                <Text style={{ color: colors.outline }}>•</Text>
                <Text style={[styles.syncDesc, { color: colors.onSurfaceVariant }]}>
                  Đồng bộ lịch RTC tủ máy
                </Text>
              </View>
              <MaterialIcons name="sync" size={18} color={colors.primary} />
            </View>
          </View>

          {/* Daily Target Summary Bento */}
          <View
            style={[
              styles.targetBento,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoTitleGroup}>
                <MaterialIcons name="restaurant" size={18} color={colors.primary} />
                <Text style={[styles.bentoTitle, { color: colors.onSurface }]}>
                  KHẨU PHẦN HÔM NAY
                </Text>
              </View>
              <View style={[styles.schedulePill, { backgroundColor: colors.primaryFixed }]}>
                <Text style={[styles.schedulePillText, { color: colors.onPrimaryFixed }]}>
                  4 Cữ Theo Lịch
                </Text>
              </View>
            </View>

            <View style={styles.bentoGrid}>
              <View style={[styles.bentoBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.bentoBoxTag, { color: colors.onSurfaceVariant }]}>
                  KẾ HOẠCH CẢ NGÀY
                </Text>
                <View style={styles.numRow}>
                  <Text style={[styles.bentoBoxNum, { color: colors.onSurface }]}>
                    {totalFeedToday}
                  </Text>
                  <Text style={[styles.bentoBoxUnit, { color: colors.onSurfaceVariant }]}>kg</Text>
                </View>
                <Text style={[styles.bentoBoxSub, { color: colors.outline }]}>
                  ~{(totalFeedToday / 25).toFixed(1)} bao (loại 25kg)
                </Text>
              </View>

              <View style={[styles.bentoBox, { backgroundColor: colors.secondaryContainer + '50' }]}>
                <Text style={[styles.bentoBoxTag, { color: colors.onSecondaryContainer }]}>
                  ĐÃ RẢI VÀO AO
                </Text>
                <View style={styles.numRow}>
                  <Text style={[styles.bentoBoxNum, { color: colors.secondary }]}>38</Text>
                  <Text style={[styles.bentoBoxUnit, { color: colors.secondary }]}>
                    / {totalFeedToday} kg
                  </Text>
                </View>
                <View style={styles.bentoProgressRow}>
                  <Text style={[styles.bentoProgressText, { color: colors.secondary }]}>Tiến độ</Text>
                  <Text style={[styles.bentoProgressVal, { color: colors.secondary }]}>
                    {percentDone}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainer }]}>
              <View
                style={[
                  styles.progressIndicator,
                  { width: `${percentDone}%`, backgroundColor: colors.secondary },
                ]}
              />
            </View>

            {/* AI Weather Prompt Pill */}
            <View style={[styles.aiPill, { backgroundColor: colors.primaryFixed + '50' }]}>
              <View style={[styles.aiIconBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="auto-awesome" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: colors.onSurface }]}>
                  Đề xuất thích ứng thời tiết
                </Text>
                <Text style={[styles.aiDesc, { color: colors.onSurfaceVariant }]}>
                  Nắng tốt, nước <Text style={{ fontWeight: '800', color: colors.onSurface }}>29.5°C</Text>, tôm quẫy ăn sung. Máy đã tự động cộng{' '}
                  <Text style={{ fontWeight: '800', color: colors.primary }}>+5 kg</Text> vào cữ trưa & chiều.
                </Text>
              </View>
            </View>

            {/* Rebalance Button */}
            <Pressable
              onPress={handleRebalance}
              style={({ pressed }) => [
                styles.rebalanceBtn,
                { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="balance" size={18} color={colors.primary} />
              <Text style={[styles.rebalanceBtnText, { color: colors.primary }]}>
                Tự động chia đều cho các cữ
              </Text>
            </Pressable>
          </View>

          {/* Sessions Heading */}
          <View style={styles.sessionsHeadingRow}>
            <View style={styles.sessionsHeadingLeft}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={[styles.sessionsHeadingTitle, { color: colors.onSurface }]}>
                Các Cữ Ăn Trong Ngày
              </Text>
            </View>
            <Text style={[styles.sessionsHeadingSub, { color: colors.onSurfaceVariant }]}>
              4 cữ thiết lập
            </Text>
          </View>

          {/* CỮ 1: COMPLETE */}
          <View
            style={[
              styles.sessionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={[styles.sessionIconBox, { backgroundColor: colors.secondary }]}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.sessionName, { color: colors.onSurface }]}>Cữ 1 • 07:00</Text>
                  <Text style={[styles.sessionSub, { color: colors.outline }]}>Buổi sáng</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: colors.secondaryContainer }]}>
                <MaterialIcons name="task-alt" size={13} color={colors.onSecondaryContainer} />
                <Text style={[styles.statusBadgeText, { color: colors.onSecondaryContainer }]}>
                  HOÀN THÀNH 100%
                </Text>
              </View>
            </View>

            <View style={[styles.sessionInfoGrid, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionMetaLabel, { color: colors.outline }]}>Lượng rải</Text>
                <Text style={[styles.sessionMetaVal, { color: colors.onSurface }]}>
                  20 kg <Text style={{ fontWeight: '500', color: colors.onSurfaceVariant }}>/ 25 phút</Text>
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionMetaLabel, { color: colors.outline }]}>Nhịp phun</Text>
                <Text style={[styles.sessionMetaVal, { color: colors.onSurface }]}>
                  4s phun <Text style={{ fontWeight: '500', color: colors.onSurfaceVariant }}>/ 25s nghỉ</Text>
                </Text>
              </View>
            </View>

            <View style={styles.sessionNoteRow}>
              <MaterialIcons name="verified" size={15} color={colors.secondary} />
              <Text style={[styles.sessionNoteText, { color: colors.secondary }]}>
                Đã rải xong lúc 07:25 • Nhá tôm ăn hết 100%
              </Text>
            </View>
          </View>

          {/* CỮ 2: RUNNING */}
          <View
            style={[
              styles.sessionCard,
              styles.runningBorder,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.primary,
              },
            ]}>
            <View style={[styles.runningTopStrip, { backgroundColor: colors.primary }]} />
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={[styles.sessionIconBox, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="cyclone" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.sessionName, { color: colors.onSurface }]}>Cữ 2 • 10:30</Text>
                  <Text style={[styles.sessionSub, { color: colors.primary }]}>
                    Đang quay rải cám...
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: colors.primaryFixed }]}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.statusBadgeText, { color: colors.onPrimaryFixed }]}>
                  ĐANG RẢI CÁM
                </Text>
              </View>
            </View>

            <View style={[styles.runningDetailBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.runningProgressHeader}>
                <Text style={[styles.runningProgressLabel, { color: colors.onSurfaceVariant }]}>
                  Tiến độ cữ này
                </Text>
                <Text style={[styles.runningProgressVal, { color: colors.primary }]}>
                  18 <Text style={{ fontSize: 12, color: colors.onSurface }}>/ 22 kg</Text>
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainer }]}>
                <View style={[styles.progressIndicator, { width: '82%', backgroundColor: colors.primary }]} />
              </View>

              <View style={styles.runningTimeRow}>
                <Text style={[styles.runningTimeText, { color: colors.onSurfaceVariant }]}>
                  Thời gian còn lại: ~4 phút
                </Text>
                <Text style={[styles.runningTimeText, { color: colors.onSurfaceVariant }]}>
                  Phun 5s / Nghỉ 20s
                </Text>
              </View>
            </View>

            <View style={styles.runningActionRow}>
              <Pressable
                onPress={() => Alert.alert('Tạm Dừng', 'Đã gửi lệnh tạm dừng Cữ 2 tới máy')}
                style={({ pressed }) => [
                  styles.btnHalfAction,
                  { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.85 : 1 },
                ]}>
                <MaterialIcons name="pause-circle" size={18} color={colors.primary} />
                <Text style={[styles.btnHalfText, { color: colors.primary }]}>Tạm Dừng Cữ</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert('Dừng Khẩn Cấp', 'Đã ngắt dừng khẩn cấp Cữ 2')}
                style={({ pressed }) => [
                  styles.btnHalfAction,
                  { backgroundColor: colors.errorContainer, opacity: pressed ? 0.85 : 1 },
                ]}>
                <MaterialIcons name="stop-circle" size={18} color={colors.onErrorContainer} />
                <Text style={[styles.btnHalfText, { color: colors.onErrorContainer }]}>
                  Dừng Khẩn Cấp
                </Text>
              </Pressable>
            </View>
          </View>

          {/* CỮ 3: INTERACTIVE STEPPER */}
          <View
            style={[
              styles.sessionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={[styles.sessionIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <MaterialIcons name="alarm" size={18} color={colors.onSurface} />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.sessionName, { color: colors.onSurface }]}>
                      Cữ 3 • 14:30
                    </Text>
                    <Pressable onPress={() => Alert.alert('Đổi Giờ', 'Chọn giờ cữ ăn: Từ 13:00 đến 16:00')}>
                      <MaterialIcons name="edit-calendar" size={15} color={colors.outline} />
                    </Pressable>
                  </View>
                  <Text style={[styles.sessionSub, { color: colors.onSurfaceVariant }]}>
                    Cữ chiều sung tôm
                  </Text>
                </View>
              </View>

              <Switch
                value={cu3Active}
                onValueChange={setCu3Active}
                trackColor={{ false: colors.outlineVariant, true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {cu3Active && (
              <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.stepperHeader}>
                  <Text style={[styles.stepperHeaderTag, { color: colors.onSurfaceVariant }]}>
                    ĐIỀU CHỈNH KHẨU PHẦN CỮ 3
                  </Text>
                  <View style={[styles.tipPill, { backgroundColor: colors.tertiaryFixed }]}>
                    <Text style={[styles.tipPillText, { color: colors.onTertiaryFixed }]}>
                      Gợi ý: +3 kg
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => setC3Amount((a) => Math.max(4, a - 2))}
                    style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>- 2kg</Text>
                  </Pressable>

                  <View style={styles.stepNumCol}>
                    <View style={styles.numRow}>
                      <Text style={[styles.stepBigNum, { color: colors.primary }]}>{c3Amount}</Text>
                      <Text style={[styles.stepBigUnit, { color: colors.onSurfaceVariant }]}>kg</Text>
                    </View>
                    <Text style={[styles.stepDuration, { color: colors.outline }]}>
                      Rải trong 32 phút
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setC3Amount((a) => Math.min(60, a + 2))}
                    style={[styles.stepBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.stepBtnText, { color: '#FFFFFF' }]}>+ 2kg</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.tempoRow}>
              <View style={styles.tempoLeft}>
                <MaterialIcons name="timer" size={15} color={colors.onSurfaceVariant} />
                <Text style={[styles.tempoText, { color: colors.onSurfaceVariant }]}>
                  Phun 5s / Nghỉ 20s
                </Text>
              </View>
              <Pressable onPress={() => Alert.alert('Nhịp Phun', 'Cài đặt nhịp phun: 5s phun / 20s nghỉ')}>
                <Text style={[styles.tempoBtnText, { color: colors.primary }]}>Sửa nhịp phun</Text>
              </Pressable>
            </View>
          </View>

          {/* CỮ 4: NIGHT SCHEDULE WITH SAFETY INTERLOCK */}
          <View
            style={[
              styles.sessionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={[styles.sessionIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <MaterialIcons name="dark-mode" size={18} color={colors.onSurface} />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.sessionName, { color: colors.onSurface }]}>
                      Cữ 4 • 18:00
                    </Text>
                    <Pressable onPress={() => Alert.alert('Đổi Giờ', 'Chọn giờ cữ tối')}>
                      <MaterialIcons name="edit-calendar" size={15} color={colors.outline} />
                    </Pressable>
                  </View>
                  <Text style={[styles.sessionSub, { color: colors.onSurfaceVariant }]}>
                    Cữ chập tối
                  </Text>
                </View>
              </View>

              <Switch
                value={cu4Active}
                onValueChange={setCu4Active}
                trackColor={{ false: colors.outlineVariant, true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {cu4Active && (
              <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.stepperHeader}>
                  <Text style={[styles.stepperHeaderTag, { color: colors.onSurfaceVariant }]}>
                    LƯỢNG CÁM CỮ TỐI
                  </Text>
                  <Text style={[styles.tipPillText, { color: colors.secondary }]}>Ổn định</Text>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => setC4Amount((a) => Math.max(4, a - 2))}
                    style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>- 2kg</Text>
                  </Pressable>

                  <View style={styles.stepNumCol}>
                    <View style={styles.numRow}>
                      <Text style={[styles.stepBigNum, { color: colors.onSurface }]}>{c4Amount}</Text>
                      <Text style={[styles.stepBigUnit, { color: colors.onSurfaceVariant }]}>kg</Text>
                    </View>
                    <Text style={[styles.stepDuration, { color: colors.outline }]}>
                      Rải trong 30 phút
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setC4Amount((a) => Math.min(60, a + 2))}
                    style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>+ 2kg</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={[styles.interlockAlert, { backgroundColor: colors.errorContainer + '40' }]}>
              <MaterialIcons name="lock" size={18} color={colors.error} />
              <Text style={[styles.interlockAlertText, { color: colors.onErrorContainer }]}>
                Điều kiện an toàn: Tự động khóa không rải nếu Oxy hòa tan lúc 18:00 thấp hơn 4.0 mg/L.
              </Text>
            </View>
          </View>

          {/* Add Extra Feeding Session */}
          <Pressable
            onPress={() => Alert.alert('Thêm Cữ Mới', 'Có thể tạo thêm cữ khuya 22:00 hoặc cữ xế 16:30')}
            style={({ pressed }) => [
              styles.addSessionBtn,
              { backgroundColor: colors.surfaceContainerLowest, opacity: pressed ? 0.85 : 1 },
            ]}>
            <View style={[styles.addCircle, { backgroundColor: colors.primaryFixed }]}>
              <MaterialIcons name="add" size={18} color={colors.onPrimaryFixed} />
            </View>
            <Text style={[styles.addSessionText, { color: colors.primary }]}>
              + THÊM CỮ ĂN MỚI TRONG NGÀY
            </Text>
          </Pressable>

          {/* Pond Safety Interlock Card */}
          <View style={[styles.safetyCard, { backgroundColor: colors.tertiaryFixed + '40' }]}>
            <View style={styles.safetyHeader}>
              <MaterialIcons name="health-and-safety" size={22} color={colors.tertiary} />
              <Text style={[styles.safetyTitle, { color: colors.onTertiaryFixed }]}>
                KHÓA BẢO VỆ ĐÁY AO & ĐƯỜNG RUỘT TÔM
              </Text>
            </View>
            <Text style={[styles.safetyDesc, { color: colors.onTertiaryFixedVariant }]}>
              Hệ thống ShrimpMate sẽ <Text style={{ fontWeight: '800' }}>tự động tạm hoãn</Text> bất
              kỳ cữ rải cám nào nếu cảm biến đo được:
            </Text>

            <View style={styles.safetyGrid}>
              <View style={[styles.safetyBox, { backgroundColor: colors.surfaceContainerLowest + 'D0' }]}>
                <MaterialIcons name="air" size={18} color={colors.error} />
                <View>
                  <Text style={[styles.safetyBoxLabel, { color: colors.outline }]}>Oxy hòa tan</Text>
                  <Text style={[styles.safetyBoxVal, { color: colors.error }]}>&lt; 3.5 mg/L</Text>
                </View>
              </View>

              <View style={[styles.safetyBox, { backgroundColor: colors.surfaceContainerLowest + 'D0' }]}>
                <MaterialIcons name="device-thermostat" size={18} color={colors.tertiary} />
                <View>
                  <Text style={[styles.safetyBoxLabel, { color: colors.outline }]}>Nhiệt độ nước</Text>
                  <Text style={[styles.safetyBoxVal, { color: colors.tertiary }]}>&gt; 33.0 °C</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Big Sticky Action Save */}
          <View style={styles.saveSection}>
            <Pressable
              onPress={handleSaveSchedule}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialIcons name="save" size={22} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>LƯU & GỬI LỊCH VÀO TỦ MÁY</Text>
            </Pressable>

            <View style={styles.rtcSubRow}>
              <MaterialIcons name="offline-bolt" size={16} color={colors.secondary} />
              <Text style={[styles.rtcSubText, { color: colors.onSurfaceVariant }]}>
                Tủ máy có chip RTC độc lập: Mất sóng 4G/WiFi vẫn tự rải cám chính xác tuyệt đối.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <View style={[styles.toastContainer, { backgroundColor: colors.inverseSurface }]}>
          <MaterialIcons name="check-circle" size={24} color={colors.secondaryFixed} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>Đã gửi lịch thành công!</Text>
            <Text style={[styles.toastSub, { color: colors.surfaceVariant }]}>
              Tủ máy Ao 2 đã nhận và cập nhật thời gian RTC.
            </Text>
          </View>
        </View>
      )}
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
  contextCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contextSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  contextPondName: {
    fontSize: 15,
    fontWeight: '800',
  },
  agePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  agePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncDesc: {
    fontSize: 11,
    fontWeight: '600',
  },
  targetBento: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  schedulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  schedulePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  bentoBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  bentoBoxTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  bentoBoxNum: {
    fontSize: 28,
    fontWeight: '900',
  },
  bentoBoxUnit: {
    fontSize: 12,
    fontWeight: '800',
  },
  bentoBoxSub: {
    fontSize: 9,
    fontWeight: '600',
  },
  bentoProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bentoProgressText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bentoProgressVal: {
    fontSize: 10,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 999,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  aiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  aiDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rebalanceBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rebalanceBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sessionsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sessionsHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionsHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sessionsHeadingSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  runningBorder: {
    borderWidth: 1.5,
  },
  runningTopStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '800',
  },
  sessionSub: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  sessionInfoGrid: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
  },
  sessionMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  sessionMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  sessionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionNoteText: {
    fontSize: 11,
    fontWeight: '700',
  },
  runningDetailBox: {
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  runningProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  runningProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  runningProgressVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  runningTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runningTimeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  runningActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnHalfAction: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnHalfText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepperContainer: {
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperHeaderTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  tipPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepBtn: {
    width: 60,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '900',
  },
  stepNumCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stepBigNum: {
    fontSize: 28,
    fontWeight: '900',
  },
  stepBigUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepDuration: {
    fontSize: 10,
    fontWeight: '600',
  },
  tempoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tempoBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  interlockAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  interlockAlertText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  addSessionBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(2,132,199,0.4)',
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSessionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  safetyCard: {
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  safetyDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  safetyGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  safetyBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  safetyBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  safetyBoxVal: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  saveSection: {
    gap: 6,
    paddingTop: 4,
  },
  saveBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rtcSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  rtcSubText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  toastSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
