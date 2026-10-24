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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { NoAssignedPondState } from '@/components/common/no-assigned-pond';
import { useFarm } from '@/context/farm-context';
import { EvaluateSafetyResponse } from '@/types/safety-rule';

export default function ScreenFeedingLog() {
  const colors = useTheme();
  const router = useRouter();
  const {
    farmInfo,
    ponds,
    selectedPond,
    latestTelemetry,
    latestAiRecommendation,
    latestFis,
    feedMeals,
    updateFeedMeal,
    evaluateSafetyBeforeFeed,
    triggerQuickFeed,
    isRefreshingPondData,
    refreshPondOperationalData,
    refreshFarmsAndPonds,
  } = useFarm();

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraKg, setExtraKg] = useState('5.0');
  const [extraNote, setExtraNote] = useState('Cữ bổ sung nhanh tại bờ ao');
  const [safetyPreview, setSafetyPreview] = useState<EvaluateSafetyResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);

  const hasAssignedPond = Boolean(selectedPond && ponds.length > 0);
  if (!hasAssignedPond) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.surface }]}>
        <AppHeader subtitle="Lịch Cữ Nuôi Tôm" />
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

  // Tìm cữ gợi ý AI hoặc cữ chiều
  const aiMeal = feedMeals.find((m) => m.status === 'ai_suggested' || m.id === 'meal-3') || feedMeals[0];
  const aiPredictedKg =
    latestAiRecommendation?.predictedFeedAmountKg ?? aiMeal?.aiSuggestedKg ?? 22.0;
  const aiBiomassKg = latestAiRecommendation?.biomassKg ?? 780.0;
  const aiModelName = latestAiRecommendation?.modelName || 'ShrimpMate-FeedOpt-v2';
  const aiExplanation =
    latestAiRecommendation?.explanation ||
    'Tôm bắt mồi mạnh (FIS cao), DO và nhiệt độ nằm trong ngưỡng tối ưu.';

  // Summary computations
  const totalTargetKg = feedMeals.reduce((acc, m) => acc + m.targetKg, 0);
  const totalDispensedKg = feedMeals.reduce((acc, m) => acc + m.dispensedKg, 0);
  const remainingKg = Math.max(0, totalTargetKg - totalDispensedKg);
  const overallPercent =
    totalTargetKg > 0 ? Math.round((totalDispensedKg / totalTargetKg) * 100) : 0;

  const handleAiAccept = async () => {
    if (aiMeal) {
      updateFeedMeal(aiMeal.id, {
        targetKg: aiPredictedKg,
        isAiAccepted: true,
        notes: `Đã áp dụng khuyến nghị AI (${aiPredictedKg}kg): ${aiExplanation}`,
      });
    }
    const res = await triggerQuickFeed(aiPredictedKg, 'ai', aiMeal?.id, 'Áp dụng khuyến nghị AI');
    if (!res.success) {
      Alert.alert(
        '⛔ Khóa An Toàn Sinh Học',
        res.evaluation.reasons.join('\n') || 'Cấm xả cám do vi phạm ngưỡng an toàn nước.'
      );
      return;
    }
    Alert.alert(
      'Đã Áp Dụng Khuyến Nghị AI',
      `Đã kích hoạt cữ ăn theo đề xuất AI (${res.evaluation.allowedAmountKg} kg).`
    );
  };

  const handleAiKeep = () => {
    if (aiMeal) {
      updateFeedMeal(aiMeal.id, {
        isAiAccepted: false,
        notes: `Giữ nguyên định mức ${aiMeal.targetKg}kg theo quyết định tại bờ ao`,
      });
    }
    Alert.alert(
      'Giữ Nguyên Khẩu Phần',
      `Đã lưu khẩu phần ${aiMeal?.targetKg ?? 25} kg theo quyết định của kỹ thuật viên.`
    );
  };

  const handleOpenQuickFeedModal = async () => {
    setShowExtraModal(true);
    const parsed = parseFloat(extraKg) || 5.0;
    setIsEvaluating(true);
    try {
      const ev = await evaluateSafetyBeforeFeed(parsed);
      setSafetyPreview(ev);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleChangeExtraKg = async (val: string) => {
    setExtraKg(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setIsEvaluating(true);
      try {
        const ev = await evaluateSafetyBeforeFeed(parsed);
        setSafetyPreview(ev);
      } finally {
        setIsEvaluating(false);
      }
    }
  };

  const handleSaveExtraMeal = async () => {
    const parsedKg = parseFloat(extraKg);
    if (isNaN(parsedKg) || parsedKg <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số kg hợp lệ');
      return;
    }
    setIsSubmittingExtra(true);
    try {
      const res = await triggerQuickFeed(parsedKg, 'manual', undefined, extraNote);
      setSafetyPreview(res.evaluation);
      if (!res.success || res.evaluation.decision === 'blocked') {
        Alert.alert(
          '⛔ KHÓA AN TOÀN SINH HỌC (BLOCKED)',
          res.evaluation.reasons.join('\n') ||
            'Chỉ số nước vượt ngưỡng nguy hiểm. Cấm xả cám!'
        );
        return;
      }
      setShowExtraModal(false);
      if (res.evaluation.decision === 'adjusted') {
        Alert.alert(
          '⚠️ ĐÃ ĐIỀU CHỈNH KHẨU PHẦN AN TOÀN',
          `${res.evaluation.reasons.join('\n')}\n\nĐã phát lệnh xả ${res.evaluation.allowedAmountKg} kg cám.`
        );
      } else {
        Alert.alert(
          'Cho Ăn Nhanh Thành Công',
          `Đã kiểm duyệt Safety Rule Engine và phát lệnh xả ${parsedKg} kg cám!`
        );
      }
    } finally {
      setIsSubmittingExtra(false);
    }
  };

  const pondDisplayName = selectedPond?.name || selectedPond?.code || farmInfo.selectedPond;
  const pondAreaDesc = selectedPond?.areaM2
    ? `${selectedPond.areaM2.toLocaleString('vi-VN')} m² • ${
        selectedPond.status === 'maintenance' ? 'Đang bảo dưỡng' : 'Ao được phân công'
      }`
    : 'Tôm thẻ chân trắng • Ao được phân công';

  const waterTemp = latestTelemetry?.temperatureC ?? farmInfo.waterTemp;
  const doVal = latestTelemetry?.dissolvedOxygenMgL ?? farmInfo.dissolvedOxygen;
  const fisLevel = latestFis?.status?.appetiteLevel ?? 3;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Lịch Cữ Nuôi Tôm" />

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
          {/* Pond Quick Status Strip */}
          <Pressable
            onPress={() => router.push('/(tabs)/quan-ly-ao')}
            style={[
              styles.pondStrip,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
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
                  <MaterialIcons
                    name="arrow-forward-ios"
                    size={13}
                    color={colors.onSurfaceVariant}
                  />
                </View>
                <Text style={[styles.pondSubText, { color: colors.secondary }]}>
                  {pondAreaDesc}
                </Text>
              </View>
            </View>

            <View style={styles.weatherBox}>
              <Text style={styles.weatherLabel}>DO: {doVal} mg/L</Text>
              <View style={styles.tempRow}>
                <MaterialIcons name="wb-sunny" size={16} color="#F97316" />
                <Text style={styles.tempVal}>{waterTemp}°C</Text>
              </View>
            </View>
          </Pressable>

          {/* Hero Card: Khẩu phần hôm nay */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
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
                  {feedMeals.length} Cữ • FIS Mức {fisLevel}
                </Text>
              </View>
            </View>

            {/* Metric 3-Column Split */}
            <View style={[styles.metricGrid, { backgroundColor: colors.surfaceContainerLow }]}>
              <View
                style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={styles.colLabel}>Tổng định mức</Text>
                <Text style={styles.colVal}>{totalTargetKg.toFixed(1)}</Text>
                <Text style={styles.colUnit}>kg cám</Text>
              </View>
              <View
                style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[styles.colLabel, { color: colors.secondary }]}>Đã rải</Text>
                <Text style={[styles.colVal, { color: colors.secondary }]}>
                  {totalDispensedKg.toFixed(1)}
                </Text>
                <Text style={styles.colUnit}>kg cám</Text>
              </View>
              <View
                style={[styles.metricCol, { backgroundColor: colors.surfaceContainerLowest }]}>
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
                  Sinh khối ước tính: {aiBiomassKg} kg
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, overallPercent)}%`,
                      backgroundColor: colors.secondary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* AI Recommendation Summary Card (UC014 - GET /ponds/:pondId/ai/recommendations/latest) */}
          <View
            style={[
              styles.aiCard,
              {
                backgroundColor:
                  aiMeal?.isAiAccepted === true
                    ? '#E8F5E9'
                    : aiMeal?.isAiAccepted === false
                    ? '#FFF3E0'
                    : '#FFF8F5',
                borderColor: aiMeal?.isAiAccepted === true ? '#7CF994' : '#F97316',
              },
            ]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiBadgeGroup}>
                <MaterialIcons name="auto-awesome" size={20} color="#F97316" />
                <Text style={styles.aiBadgeTitle}>
                  KHUYẾN NGHỊ AI ({aiModelName.toUpperCase()})
                </Text>
              </View>
              <View style={styles.aiStatusBadge}>
                <Text style={styles.aiStatusText}>
                  {aiMeal?.isAiAccepted === true
                    ? '✓ ĐÃ ÁP DỤNG'
                    : aiMeal?.isAiAccepted === false
                    ? 'GIỮ ĐỊNH MỨC'
                    : `TIN CẬY ${Math.round((latestAiRecommendation?.confidence ?? 0.94) * 100)}%`}
                </Text>
              </View>
            </View>

            <Text style={styles.aiBodyText}>
              Khuyến nghị cữ hiện tại:{' '}
              <Text style={{ fontWeight: '900', color: '#006E2D' }}>
                {aiPredictedKg.toFixed(1)} kg
              </Text>{' '}
              • Tốc độ rải:{' '}
              <Text style={{ fontWeight: '900', color: '#9D4300' }}>
                {latestAiRecommendation?.spreadRateKgPerMinute ?? 1.5} kg/phút
              </Text>
            </Text>
            <Text style={styles.aiReasonText}>💡 {aiExplanation}</Text>

            {aiMeal?.isAiAccepted === undefined && (
              <View style={styles.aiActionsRow}>
                <Pressable
                  onPress={handleAiAccept}
                  style={({ pressed }) => [
                    styles.btnAiAccept,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.btnAiAcceptText}>
                    Xả theo AI ({aiPredictedKg.toFixed(1)} kg)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAiKeep}
                  style={({ pressed }) => [
                    styles.btnAiKeep,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <Text style={styles.btnAiKeepText}>
                    Giữ nguyên {aiMeal?.targetKg ?? 25} kg
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Meal Timeline List */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              LỊCH CHO ĂN & NHẬT KÝ CỮ ĂN
            </Text>
            <Pressable
              onPress={handleOpenQuickFeedModal}
              style={[styles.addMealBtn, { backgroundColor: '#FFDBCA' }]}>
              <MaterialIcons name="bolt" size={16} color="#9D4300" />
              <Text style={styles.addMealText}>Cho Ăn Nhanh (Quick Feed)</Text>
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
                        {isCompleted
                          ? '✓ Hoàn thành'
                          : isActive
                          ? '⚡ Đang rải'
                          : '⏳ Theo lịch'}
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

                  {meal.notes && <Text style={styles.mealNotes}>📝 {meal.notes}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal: Cho ăn nhanh (Quick Feed) có kiểm duyệt Safety Rule Engine */}
      <Modal
        visible={showExtraModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtraModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowExtraModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalHeading}>CHO ĂN NHANH (QUICK FEED)</Text>
            <Text style={styles.modalSub}>
              Kiểm tra tự động qua POST /ponds/:pondId/safety-rules/evaluate trước khi xả
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Khẩu phần yêu cầu (kg cám):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={extraKg}
                onChangeText={handleChangeExtraKg}
                placeholder="Ví dụ: 5.0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú cữ ăn:</Text>
              <TextInput
                style={styles.textInput}
                value={extraNote}
                onChangeText={setExtraNote}
                placeholder="Ví dụ: Bổ sung cữ chiều tại bờ ao"
              />
            </View>

            {/* Safety Evaluation Box */}
            <View
              style={[
                styles.safetyEvalCard,
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
                {isEvaluating ? (
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
                    size={18}
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
                    ? 'KHÓA AN TOÀN: CẤM XẢ CÁM'
                    : safetyPreview?.decision === 'adjusted'
                    ? `ĐIỀU CHỈNH AN TOÀN: ${safetyPreview.allowedAmountKg} KG`
                    : `AN TOÀN: CHO PHÉP XẢ ${safetyPreview?.allowedAmountKg ?? extraKg} KG`}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#0B1C30', marginTop: 4 }}>
                {safetyPreview?.reasons?.[0] ||
                  `DO = ${doVal} mg/L • Đủ điều kiện xả thức ăn an toàn.`}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowExtraModal(false)}
                style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveExtraMeal}
                disabled={isSubmittingExtra || safetyPreview?.decision === 'blocked'}
                style={[
                  styles.btnConfirm,
                  (safetyPreview?.decision === 'blocked' || isSubmittingExtra) && {
                    backgroundColor: '#9CA3AF',
                  },
                ]}>
                {isSubmittingExtra ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnConfirmText}>
                    {safetyPreview?.decision === 'blocked'
                      ? 'Bị Chặn'
                      : safetyPreview?.decision === 'adjusted'
                      ? `Xả ${safetyPreview.allowedAmountKg} kg`
                      : 'Xác Nhận Xả'}
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
    color: '#006E2D',
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontSize: 11,
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
    fontSize: 13,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 11,
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
    maxWidth: 390,
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
  safetyEvalCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
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
    flex: 1.2,
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
