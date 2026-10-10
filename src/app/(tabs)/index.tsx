import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { useFarm } from '@/context/farm-context';

export default function ScreenFeedingLog() {
  const colors = useTheme();
  const router = useRouter();
  const { farmInfo, selectedPond, selectedFarm, feedMeals, updateFeedMeal, addExtraMeal } = useFarm();

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraKg, setExtraKg] = useState('5');
  const [extraNote, setExtraNote] = useState('Cữ chiều bổ sung men tiêu hóa');

  // Meal 3 (Chiều)
  const meal3 = feedMeals.find((m) => m.id === 'meal-3');

  // Summary computations
  const totalTargetKg = feedMeals.reduce((acc, m) => acc + m.targetKg, 0);
  const totalDispensedKg = feedMeals.reduce((acc, m) => acc + m.dispensedKg, 0);
  const remainingKg = Math.max(0, totalTargetKg - totalDispensedKg);
  const overallPercent = totalTargetKg > 0 ? Math.round((totalDispensedKg / totalTargetKg) * 100) : 0;

  const handleAiAccept = () => {
    updateFeedMeal('meal-3', {
      targetKg: 22.0,
      isAiAccepted: true,
      notes: 'Đã áp dụng khuyến nghị AI: giảm xuống 22kg để bảo vệ đáy ao',
    });
    Alert.alert('Đã Áp Dụng Đề Xuất AI', 'Cữ chiều đã giảm xuống 22 kg để bảo vệ đáy ao.');
  };

  const handleAiKeep = () => {
    updateFeedMeal('meal-3', {
      targetKg: 25.0,
      isAiAccepted: false,
      notes: 'Đã giữ nguyên 25kg theo ý định của chủ đầm',
    });
    Alert.alert('Giữ Nguyên Khẩu Phần', 'Đã lưu khẩu phần 25 kg theo quyết định của chủ đầm.');
  };

  const handleSaveExtraMeal = () => {
    const parsedKg = parseFloat(extraKg);
    if (isNaN(parsedKg) || parsedKg <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số kg hợp lệ');
      return;
    }
    addExtraMeal(parsedKg, extraNote);
    setShowExtraModal(false);
  };

  const pondDisplayName = selectedPond?.name || selectedPond?.code || farmInfo.selectedPond;
  const pondAreaDesc = selectedPond?.areaM2
    ? `${selectedPond.areaM2.toLocaleString('vi-VN')} m² • ${selectedPond.status === 'maintenance' ? 'Đang bảo dưỡng' : 'Ao đang vận hành'}`
    : 'Tôm thẻ chân trắng • 42 ngày tuổi';

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Lịch Cữ Nuôi Tôm" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Pond Quick Status Strip */}
          <Pressable
            onPress={() => router.push('/(tabs)/may-cho-an')}
            style={[
              styles.pondStrip,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.pondStripLeft}>
              <View style={[styles.pondIconBox, { backgroundColor: '#FFDBCA' }]}>
                <MaterialIcons name="water" size={22} color="#9D4300" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.pondNameRow}>
                  <Text style={[styles.pondNameText, { color: colors.onSurface }]}>
                    {pondDisplayName}
                  </Text>
                  <MaterialIcons name="arrow-forward-ios" size={13} color={colors.onSurfaceVariant} />
                </View>
                <Text style={[styles.pondSubText, { color: colors.secondary }]}>
                  {pondAreaDesc}
                </Text>
              </View>
            </View>

            <View style={styles.weatherBox}>
              <Text style={styles.weatherLabel}>Nhiệt độ nước</Text>
              <View style={styles.tempRow}>
                <MaterialIcons name="wb-sunny" size={16} color="#F97316" />
                <Text style={styles.tempVal}>{farmInfo.waterTemp}°C</Text>
              </View>
            </View>
          </Pressable>

          {/* Hero Card: Khẩu phần hôm nay */}
          <View
            style={[
              styles.heroCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleRow}>
                <MaterialIcons name="analytics" size={22} color="#F97316" />
                <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
                  Khẩu Phần Hôm Nay
                </Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.secondaryContainer }]}>
                <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.badgeText, { color: colors.onSecondaryContainer }]}>
                  4 Cữ Chuẩn
                </Text>
              </View>
            </View>

            {/* Metric 3-Column Split */}
            <View style={[styles.metricGrid, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={styles.colLabel}>Tổng lượng</Text>
                <Text style={styles.colVal}>{totalTargetKg}</Text>
                <Text style={styles.colUnit}>kg cám</Text>
              </View>
              <View style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[styles.colLabel, { color: colors.secondary }]}>Đã rải</Text>
                <Text style={[styles.colVal, { color: colors.secondary }]}>
                  {totalDispensedKg.toFixed(1)}
                </Text>
                <Text style={styles.colUnit}>kg cám</Text>
              </View>
              <View style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[styles.colLabel, { color: '#F97316' }]}>Còn lại</Text>
                <Text style={[styles.colVal, { color: '#F97316' }]}>
                  {remainingKg.toFixed(1)}
                </Text>
                <Text style={styles.colUnit}>kg cám</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressPercentText}>{overallPercent}% khẩu phần</Text>
                <Text style={styles.progressSubText}>
                  Còn {feedMeals.filter((m) => m.status === 'pending' || m.status === 'ai_suggested').length} cữ nữa
                </Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, overallPercent)}%`, backgroundColor: colors.secondary },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Gemini AI Adaptive Recommendation Card */}
          {meal3 && (
            <View
              style={[
                styles.aiCard,
                {
                  backgroundColor:
                    meal3.isAiAccepted === true
                      ? '#E8F5E9'
                      : meal3.isAiAccepted === false
                      ? '#FFF3E0'
                      : '#FFF8F5',
                  borderColor: meal3.isAiAccepted === true ? '#7CF994' : '#F97316',
                },
              ]}>
              <View style={styles.aiHeader}>
                <View style={styles.aiBadgeGroup}>
                  <MaterialIcons name="auto-awesome" size={20} color="#F97316" />
                  <Text style={styles.aiBadgeTitle}>GỢI Ý GEMINI AI TỐI ƯU CỮ CHIỀU</Text>
                </View>
                <View style={styles.aiStatusBadge}>
                  <Text style={styles.aiStatusText}>
                    {meal3.isAiAccepted === true
                      ? '✓ ĐÃ ÁP DỤNG'
                      : meal3.isAiAccepted === false
                      ? 'GIỮ NGUYÊN 25KG'
                      : 'ĐỀ XUẤT MỚI'}
                  </Text>
                </View>
              </View>

              <Text style={styles.aiBodyText}>
                Cắt giảm <Text style={{ fontWeight: '900', color: '#9D4300' }}>-3.0 kg</Text> (từ 25kg xuống còn{' '}
                <Text style={{ fontWeight: '900', color: '#006E2D' }}>22.0 kg</Text>).
              </Text>
              <Text style={styles.aiReasonText}>
                💡 Lý do: Đỉnh nắng 32°C trưa nay làm oxy hòa tan tầng đáy giảm còn 4.8 mg/L. Giảm lượng cám giúp tôm ăn sạch nhá, không bị đọng đáy gây khí độc NH3.
              </Text>

              {meal3.isAiAccepted === undefined && (
                <View style={styles.aiActionsRow}>
                  <Pressable
                    onPress={handleAiAccept}
                    style={({ pressed }) => [
                      styles.btnAiAccept,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}>
                    <MaterialIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.btnAiAcceptText}>Áp dụng (22 kg)</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleAiKeep}
                    style={({ pressed }) => [
                      styles.btnAiKeep,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}>
                    <Text style={styles.btnAiKeepText}>Giữ nguyên 25 kg</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Meal Timeline List */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              DANH SÁCH CỮ ĂN HÔM NAY
            </Text>
            <Pressable
              onPress={() => setShowExtraModal(true)}
              style={[styles.addMealBtn, { backgroundColor: '#FFDBCA' }]}>
              <MaterialIcons name="add" size={16} color="#9D4300" />
              <Text style={styles.addMealText}>Thêm Cữ Phụ</Text>
            </Pressable>
          </View>

          <View style={styles.timelineList}>
            {feedMeals.map((meal) => {
              const isCompleted = meal.status === 'completed';
              const isActive = meal.status === 'active';
              const isAi = meal.status === 'ai_suggested';

              return (
                <View
                  key={meal.id}
                  style={[
                    styles.mealCard,
                    {
                      backgroundColor: colors.surfaceContainerLowest,
                      borderColor: isActive
                        ? '#F97316'
                        : isCompleted
                        ? '#7CF994'
                        : colors.outlineVariant + '40',
                      borderLeftWidth: 5,
                      borderLeftColor: isActive
                        ? '#F97316'
                        : isCompleted
                        ? '#006E2D'
                        : isAi
                        ? '#F97316'
                        : colors.outlineVariant,
                    },
                  ]}>
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealTitleGroup}>
                      <Text style={[styles.mealName, { color: colors.onSurface }]}>
                        {meal.name}
                      </Text>
                      <Text style={[styles.mealTime, { color: colors.onSurfaceVariant }]}>
                        • {meal.time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isCompleted
                            ? '#E8F5E9'
                            : isActive
                            ? '#FFF3E0'
                            : '#EFF4FF',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isCompleted
                              ? '#006E2D'
                              : isActive
                              ? '#9D4300'
                              : '#584237',
                          },
                        ]}>
                        {isCompleted ? '✓ Hoàn thành' : isActive ? '⚡ Đang phun' : '⏳ Chờ đến giờ'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealMetaRow}>
                    <Text style={styles.mealFeedType}>{meal.feedType}</Text>
                    <Text style={[styles.mealKg, { color: colors.onSurface }]}>
                      {meal.dispensedKg > 0 ? `${meal.dispensedKg} / ` : ''}
                      <Text style={{ fontWeight: '900', color: '#9D4300' }}>
                        {meal.targetKg} kg
                      </Text>
                    </Text>
                  </View>

                  {meal.notes && (
                    <Text style={styles.mealNotes}>📝 {meal.notes}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal: Thêm Cữ Ăn Phụ */}
      <Modal
        visible={showExtraModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtraModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowExtraModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>THÊM CỮ ĂN PHỤ / TRỘN THUỐC</Text>
            <Text style={styles.modalSub}>
              Nhập số lượng cám bổ sung và ghi chú dinh dưỡng cho ao
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Khẩu phần (kg cám):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={extraKg}
                onChangeText={setExtraKg}
                placeholder="Ví dụ: 5"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú / Loại men thuốc:</Text>
              <TextInput
                style={styles.textInput}
                value={extraNote}
                onChangeText={setExtraNote}
                placeholder="Ví dụ: Men tỏi đường ruột, khoáng tạt"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowExtraModal(false)}
                style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveExtraMeal}
                style={styles.btnConfirm}>
                <Text style={styles.btnConfirmText}>Lưu Cữ Ăn</Text>
              </Pressable>
            </View>
          </View>
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
  pondStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  pondStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pondIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pondNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pondNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pondSubText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  weatherBox: {
    alignItems: 'flex-end',
  },
  weatherLabel: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tempVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F97316',
  },
  heroCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 14,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 1,
  },
  colLabel: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  colVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0B1C30',
    marginTop: 2,
  },
  colUnit: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  progressSection: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006E2D',
  },
  progressSubText: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  aiBadgeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9D4300',
    letterSpacing: 0.3,
  },
  aiStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FFDBCA',
  },
  aiStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9D4300',
  },
  aiBodyText: {
    fontSize: 14,
    color: '#0B1C30',
    fontWeight: '600',
  },
  aiReasonText: {
    fontSize: 12,
    color: '#584237',
    lineHeight: 18,
  },
  aiActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnAiAccept: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#006E2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnAiAcceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnAiKeep: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#E0C0B1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAiKeepText: {
    color: '#584237',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMealText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9D4300',
  },
  timelineList: {
    gap: 10,
  },
  mealCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mealMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealFeedType: {
    fontSize: 12,
    color: '#584237',
  },
  mealKg: {
    fontSize: 13,
    fontWeight: '600',
  },
  mealNotes: {
    fontSize: 11,
    color: '#707881',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B1C30',
  },
  modalSub: {
    fontSize: 12,
    color: '#584237',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B1C30',
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E0C0B1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#EFF4FF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#584237',
  },
  btnConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
