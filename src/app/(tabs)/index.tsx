import React, { useState, useEffect, useRef } from 'react';
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
import { SafetyBlockedModal } from '@/components/common/safety-blocked-modal';
import { useFarm } from '@/context/farm-context';
import { FeatureContribution, PredictFeedOverrideDto } from '@/types/ai';
import { EvaluateSafetyResponse } from '@/types/safety-rule';

const WHAT_IF_INITIAL = {
  doc: '',
  avgWeightG: '',
  doMin: '',
  deltaTan: '',
  morningRainMm: '',
  prevFeedAmountKg: '',
  waterChangeM3: '',
};

const WHAT_IF_FIELDS: { key: keyof typeof WHAT_IF_INITIAL; label: string; placeholder: string }[] = [
  { key: 'doc', label: 'DOC (ngày)', placeholder: '45' },
  { key: 'avgWeightG', label: 'ABW (g)', placeholder: '8.5' },
  { key: 'doMin', label: 'DO min', placeholder: '4.2' },
  { key: 'deltaTan', label: 'ΔTAN', placeholder: '0.02' },
  { key: 'morningRainMm', label: 'Mưa (mm)', placeholder: '0' },
  { key: 'prevFeedAmountKg', label: 'Cữ trước', placeholder: '12' },
  { key: 'waterChangeM3', label: 'Thay nước', placeholder: '0' },
];

export default function ScreenFeedingLog() {
  const colors = useTheme();
  const router = useRouter();
  const {
    farmInfo,
    ponds,
    selectedPond,
    latestTelemetry,
    latestAiRecommendation,
    predictedTrends,
    requestAiFeedPrediction,
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
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isPredictingAi, setIsPredictingAi] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfValues, setWhatIfValues] = useState(WHAT_IF_INITIAL);
  const [blockedModalInfo, setBlockedModalInfo] = useState<{
    visible: boolean;
    reasons: string[];
    telemetrySnapshot?: EvaluateSafetyResponse['telemetrySnapshot'] | null;
  }>({ visible: false, reasons: [], telemetrySnapshot: null });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const handlePullRefresh = async (refreshAction: () => Promise<void>) => {
    setIsManualRefreshing(true);
    try {
      await refreshAction();
    } finally {
      setIsManualRefreshing(false);
    }
  };

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

  // Tìm cữ gợi ý AI hoặc cữ chiều
  const aiMeal = feedMeals.find((m) => m.status === 'ai_suggested' || m.id === 'meal-3') || feedMeals[0];
  const aiPredictedKg =
    Number(
      latestAiRecommendation?.safeAllowedAmountKg ??
        latestAiRecommendation?.predictedFeedAmountKg ??
        aiMeal?.aiSuggestedKg ??
        0
    ) || 0;
  const aiBaseValueKg =
    latestAiRecommendation?.baseValueKg ?? latestAiRecommendation?.inputSnapshot?.baseValueKg;
  const aiContributions: FeatureContribution[] = Array.isArray(
    latestAiRecommendation?.featureContributions
  )
    ? latestAiRecommendation.featureContributions
    : Array.isArray(latestAiRecommendation?.inputSnapshot?.featureContributions)
    ? latestAiRecommendation.inputSnapshot.featureContributions
    : [];
  const trendsRecommendationText =
    typeof predictedTrends?.recommendation === 'string'
      ? predictedTrends.recommendation
      : predictedTrends?.recommendation?.explanation ||
        predictedTrends?.reasons?.[0] ||
        '';
  const aiSafetyDecision = latestAiRecommendation?.safetyDecision || 'allowed';
  const aiSafetyReason =
    latestAiRecommendation?.safetyReason ||
    (Array.isArray(latestAiRecommendation?.safetyReasons)
      ? latestAiRecommendation.safetyReasons.join('; ')
      : '');
  const aiBiomassKg =
    latestAiRecommendation?.biomassKg !== undefined && latestAiRecommendation?.biomassKg !== null
      ? Number(latestAiRecommendation.biomassKg)
      : undefined;
  const aiModelName = latestAiRecommendation?.modelName || 'XGBoost-Regressor';
  const aiModelVersion = latestAiRecommendation?.modelVersion || 'v2.0.0';
  const aiExplanation = latestAiRecommendation?.explanation || '';

  // Summary computations
  const totalTargetKg = feedMeals.reduce((acc, m) => acc + (Number(m.targetKg) || 0), 0);
  const totalDispensedKg = feedMeals.reduce((acc, m) => acc + (Number(m.dispensedKg) || 0), 0);
  const remainingKg = Math.max(0, totalTargetKg - totalDispensedKg);
  const overallPercent =
    totalTargetKg > 0 ? Math.round((totalDispensedKg / totalTargetKg) * 100) : 0;

  const handlePredictAi = async () => {
    if (isPredictingAi) return;
    setIsPredictingAi(true);
    try {
      const overrides: PredictFeedOverrideDto = {};
      WHAT_IF_FIELDS.forEach(({ key }) => {
        const raw = whatIfValues[key].trim();
        if (raw !== '') {
          const num = Number(raw);
          if (Number.isFinite(num)) {
            overrides[key] = num;
          }
        }
      });
      const res = await requestAiFeedPrediction(
        Object.keys(overrides).length > 0 ? overrides : undefined
      );
      if (!res) {
        Alert.alert('Không thể dự báo AI', 'Chưa thể kết nối máy chủ dự báo AI. Vui lòng thử lại sau.');
      }
    } finally {
      setIsPredictingAi(false);
    }
  };

  const handleAiAccept = async () => {
    const res = await triggerQuickFeed(aiPredictedKg, 'ai', aiMeal?.id, 'Áp dụng khuyến nghị AI');
    if (!res.success) {
      const isBlocked = res.isSafetyBlocked || res.evaluation.decision === 'blocked';
      if (isBlocked) {
        setBlockedModalInfo({
          visible: true,
          reasons:
            res.evaluation.reasons?.length > 0
              ? res.evaluation.reasons
              : res.errorMessage
              ? [res.errorMessage]
              : ['Cấm xả cám do vi phạm ngưỡng an toàn nước.'],
          telemetrySnapshot: res.evaluation.telemetrySnapshot || null,
        });
      } else {
        Alert.alert(
          '❌ Không Thể Kích Hoạt Cữ Ăn',
          res.errorMessage || 'Không thể gửi lệnh cho ăn tới máy chủ.'
        );
      }
      return;
    }
    if (aiMeal) {
      updateFeedMeal(aiMeal.id, {
        targetKg: aiPredictedKg,
        isAiAccepted: true,
        notes: `Đã áp dụng khuyến nghị AI (${aiPredictedKg}kg): ${aiExplanation}`,
      });
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
      `Đã lưu khẩu phần ${aiMeal?.targetKg ?? 25} kg theo quyết định của người nuôi.`
    );
  };

  const handleOpenQuickFeedModal = async () => {
    setShowExtraModal(true);
    const parsed = parseFloat(extraKg) || 5.0;
    setIsEvaluating(true);
    try {
      const ev = await evaluateSafetyBeforeFeed(parsed);
      setSafetyPreview(ev);
    } catch {
      setSafetyPreview(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleChangeExtraKg = (val: string) => {
    setExtraKg(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsEvaluating(true);
        try {
          const ev = await evaluateSafetyBeforeFeed(parsed);
          setSafetyPreview(ev);
        } catch {
          setSafetyPreview(null);
        } finally {
          setIsEvaluating(false);
        }
      }, 300);
    }
  };

  const handleSuggestAiForQuickFeed = async () => {
    if (isPredictingAi) return;
    setIsPredictingAi(true);
    try {
      const res = await requestAiFeedPrediction();
      if (!res) {
        Alert.alert('Không thể lấy gợi ý AI', 'Chưa thể kết nối máy chủ dự báo AI. Vui lòng thử lại sau.');
        return;
      }
      const suggested = Number(res.safeAllowedAmountKg ?? res.predictedFeedAmountKg ?? 0);
      if (suggested > 0) {
        const nextVal = suggested.toFixed(1);
        setExtraKg(nextVal);
        setIsEvaluating(true);
        try {
          const ev = await evaluateSafetyBeforeFeed(Number(nextVal));
          setSafetyPreview(ev);
        } finally {
          setIsEvaluating(false);
        }
      } else if (res.safetyDecision === 'blocked') {
        setShowExtraModal(false);
        setBlockedModalInfo({
          visible: true,
          reasons:
            res.safetyReasons?.length > 0
              ? res.safetyReasons
              : ['AI / Safety Rule Engine đang khóa cho ăn do môi trường nước chưa đạt chuẩn.'],
          telemetrySnapshot: null,
        });
      }
    } finally {
      setIsPredictingAi(false);
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
        const isBlocked = res.isSafetyBlocked || res.evaluation.decision === 'blocked';
        if (isBlocked) {
          setShowExtraModal(false);
          setBlockedModalInfo({
            visible: true,
            reasons:
              res.evaluation.reasons?.length > 0
                ? res.evaluation.reasons
                : res.errorMessage
                ? [res.errorMessage]
                : ['Chỉ số nước vượt ngưỡng nguy hiểm. Cấm xả cám!'],
            telemetrySnapshot: res.evaluation.telemetrySnapshot || null,
          });
        } else {
          Alert.alert(
            '❌ KHÔNG THỂ GỬI LỆNH CHO ĂN',
            res.errorMessage || 'Không thể gửi lệnh cho ăn tới máy chủ.'
          );
        }
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
    ? `${Number(selectedPond.areaM2).toLocaleString('vi-VN')} m² • ${
        selectedPond.status === 'maintenance' ? 'Đang bảo dưỡng' : 'Ao được phân công'
      }`
    : 'Tôm thẻ chân trắng • Ao được phân công';

  const rawWaterTemp = latestTelemetry?.temperatureC ?? farmInfo.waterTemp;
  const waterTemp =
    rawWaterTemp !== undefined && rawWaterTemp !== null && !isNaN(Number(rawWaterTemp))
      ? Number(rawWaterTemp)
      : undefined;
  const rawDoVal = latestTelemetry?.dissolvedOxygenMgL ?? farmInfo.dissolvedOxygen;
  const doVal =
    rawDoVal !== undefined && rawDoVal !== null && !isNaN(Number(rawDoVal))
      ? Number(rawDoVal)
      : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Lịch Cữ Nuôi Tôm" />

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
              <Text style={styles.weatherLabel}>
                DO: {doVal !== undefined ? doVal.toFixed(1) : '--'} mg/L
              </Text>
              <View style={styles.tempRow}>
                <MaterialIcons name="wb-sunny" size={16} color="#F97316" />
                <Text style={styles.tempVal}>
                  {waterTemp !== undefined ? waterTemp.toFixed(1) : '--'}°C
                </Text>
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
                  {`${feedMeals.length} Cữ ăn`}
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
                  {aiBiomassKg !== undefined
                    ? `Sinh khối ước tính: ${aiBiomassKg} kg`
                    : 'Sinh khối: Chưa có dữ liệu'}
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

          {/* Banner Dự báo Xu hướng DO 1-2h tới */}
          {predictedTrends && (
            <View
              style={[
                styles.trendsBanner,
                {
                  backgroundColor:
                    predictedTrends.riskLevel === 'CRITICAL'
                      ? '#FEF2F2'
                      : predictedTrends.riskLevel === 'WARNING'
                      ? '#FFFBEB'
                      : '#F0FDF4',
                  borderColor:
                    predictedTrends.riskLevel === 'CRITICAL'
                      ? '#FECACA'
                      : predictedTrends.riskLevel === 'WARNING'
                      ? '#FDE68A'
                      : '#86EFAC',
                },
              ]}>
              <View style={styles.trendsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <MaterialIcons
                    name={
                      predictedTrends.riskLevel === 'CRITICAL' ||
                      predictedTrends.riskLevel === 'WARNING'
                        ? 'warning-amber'
                        : 'insights'
                    }
                    size={18}
                    color={
                      predictedTrends.riskLevel === 'CRITICAL'
                        ? '#BA1A1A'
                        : predictedTrends.riskLevel === 'WARNING'
                        ? '#B45309'
                        : '#006E2D'
                    }
                  />
                  <Text style={styles.trendsTitle}>DỰ BÁO DO 1–2 GIỜ TỚI</Text>
                </View>
                <View style={styles.trendsBadge}>
                  <Text style={styles.trendsBadgeText}>
                    {predictedTrends.riskLevel || 'NORMAL'}
                  </Text>
                </View>
              </View>
              <View style={styles.trendsMetricsRow}>
                <Text style={styles.trendsMetric}>
                  Hiện tại: <Text style={{ fontWeight: '900' }}>{predictedTrends.currentDo ?? '--'} mg/L</Text>
                </Text>
                <Text style={styles.trendsMetric}>
                  +1h: <Text style={{ fontWeight: '900' }}>{predictedTrends.predictedDo1h ?? '--'}</Text>
                </Text>
                <Text style={styles.trendsMetric}>
                  +2h: <Text style={{ fontWeight: '900' }}>{predictedTrends.predictedDo2h ?? '--'}</Text>
                </Text>
              </View>
              {!!trendsRecommendationText && (
                <Text style={styles.trendsDesc}>{trendsRecommendationText}</Text>
              )}
            </View>
          )}

          {/* AI Recommendation Summary Card (UC014 + TreeSHAP XAI) */}
          {latestAiRecommendation ? (
            <View
              style={[
                styles.aiCard,
                {
                  backgroundColor:
                    aiSafetyDecision === 'blocked'
                      ? '#FEF2F2'
                      : aiMeal?.isAiAccepted === true
                      ? '#E8F5E9'
                      : aiMeal?.isAiAccepted === false
                      ? '#FFF3E0'
                      : '#FFF8F5',
                  borderColor:
                    aiSafetyDecision === 'blocked'
                      ? '#EF4444'
                      : aiMeal?.isAiAccepted === true
                      ? '#7CF994'
                      : '#F97316',
                },
              ]}>
              <View style={styles.aiHeader}>
                <View style={styles.aiBadgeGroup}>
                  <MaterialIcons name="auto-awesome" size={20} color="#F97316" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiBadgeTitle}>
                      KHUYẾN NGHỊ AI ({aiModelName.toUpperCase()})
                    </Text>
                    <Text style={styles.aiModelSub}>
                      {aiModelVersion} • TreeSHAP XAI
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.aiStatusBadge,
                    aiSafetyDecision === 'blocked' && { backgroundColor: '#FFDAD6' },
                    aiSafetyDecision === 'adjusted' && { backgroundColor: '#FEF3C7' },
                    aiSafetyDecision === 'allowed' && { backgroundColor: '#E8F5E9' },
                  ]}>
                  <Text
                    style={[
                      styles.aiStatusText,
                      aiSafetyDecision === 'blocked' && { color: '#BA1A1A' },
                      aiSafetyDecision === 'adjusted' && { color: '#92400E' },
                      aiSafetyDecision === 'allowed' && { color: '#006E2D' },
                    ]}>
                    {aiSafetyDecision === 'blocked'
                      ? 'ĐÃ KHÓA AN TOÀN'
                      : aiSafetyDecision === 'adjusted'
                      ? 'ĐÃ ĐIỀU CHỈNH'
                      : aiMeal?.isAiAccepted === true
                      ? '✓ ĐÃ ÁP DỤNG'
                      : 'TỐI ƯU'}
                  </Text>
                </View>
              </View>

              <View style={styles.aiAmountRow}>
                <Text style={styles.aiBigKg}>{aiPredictedKg.toFixed(2)}</Text>
                <Text style={styles.aiBigUnit}>kg / cữ</Text>
                {aiBaseValueKg !== undefined && aiBaseValueKg !== null && (
                  <Text style={styles.aiBaseNote}>
                    (Mốc cơ sở: {Number(aiBaseValueKg).toFixed(2)} kg)
                  </Text>
                )}
              </View>

              {!!aiExplanation && <Text style={styles.aiReasonText}>💡 {aiExplanation}</Text>}

              {aiSafetyDecision !== 'allowed' && !!aiSafetyReason && (
                <View style={styles.aiSafetyNote}>
                  <MaterialIcons name="shield" size={14} color="#BA1A1A" />
                  <Text style={styles.aiSafetyNoteText}>{aiSafetyReason}</Text>
                </View>
              )}

              {/* TreeSHAP Feature Contributions Pills */}
              {aiContributions.length > 0 && (
                <View style={styles.shapSection}>
                  <Text style={styles.shapHeading}>YẾU TỐ CHI PHỐI KHẨU PHẦN (TREESHAP):</Text>
                  <View style={styles.shapWrap}>
                    {aiContributions.map((item, idx) => {
                      const delta = Number(item.deltaKg || 0);
                      const isInc = item.impact === 'INCREASE';
                      const isDec = item.impact === 'DECREASE';
                      return (
                        <View
                          key={`${item.feature || item.name}-${idx}`}
                          style={[
                            styles.shapPill,
                            isInc
                              ? styles.shapPillInc
                              : isDec
                              ? styles.shapPillDec
                              : styles.shapPillNeu,
                          ]}>
                          <MaterialIcons
                            name={isInc ? 'trending-up' : isDec ? 'trending-down' : 'remove'}
                            size={12}
                            color={isInc ? '#006E2D' : isDec ? '#BA1A1A' : '#475569'}
                          />
                          <Text
                            style={[
                              styles.shapPillText,
                              { color: isInc ? '#006E2D' : isDec ? '#BA1A1A' : '#475569' },
                            ]}>
                            {item.name}: {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} kg
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* What-If 7 Feature Override Drawer */}
              <Pressable
                onPress={() => setShowWhatIf((v) => !v)}
                style={styles.whatIfToggle}>
                <MaterialIcons name="tune" size={15} color="#9D4300" />
                <Text style={styles.whatIfToggleText}>
                  Tùy chỉnh 7 thông số thử nghiệm (What-If)
                </Text>
                <MaterialIcons
                  name={showWhatIf ? 'expand-less' : 'expand-more'}
                  size={18}
                  color="#9D4300"
                />
              </Pressable>

              {showWhatIf && (
                <View style={styles.whatIfBox}>
                  <View style={styles.whatIfGrid}>
                    {WHAT_IF_FIELDS.map((f) => (
                      <View key={f.key} style={styles.whatIfField}>
                        <Text style={styles.whatIfLabel}>{f.label}</Text>
                        <TextInput
                          style={styles.whatIfInput}
                          keyboardType="decimal-pad"
                          placeholder={f.placeholder}
                          placeholderTextColor="#94A3B8"
                          value={whatIfValues[f.key]}
                          onChangeText={(txt) =>
                            setWhatIfValues((prev) => ({ ...prev, [f.key]: txt }))
                          }
                        />
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setWhatIfValues(WHAT_IF_INITIAL)}
                    style={styles.whatIfResetBtn}>
                    <Text style={styles.whatIfResetText}>Đặt lại mặc định</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.aiActionsRow}>
                <Pressable
                  onPress={handleAiAccept}
                  disabled={aiSafetyDecision === 'blocked'}
                  style={({ pressed }) => [
                    styles.btnAiAccept,
                    aiSafetyDecision === 'blocked' && { backgroundColor: '#9CA3AF' },
                    { opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.btnAiAcceptText}>
                    {aiSafetyDecision === 'blocked'
                      ? 'Đã khóa an toàn'
                      : `Xả theo AI (${aiPredictedKg.toFixed(1)} kg)`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePredictAi}
                  disabled={isPredictingAi}
                  style={({ pressed }) => [
                    styles.btnAiKeep,
                    { opacity: pressed || isPredictingAi ? 0.8 : 1 },
                  ]}>
                  {isPredictingAi ? (
                    <ActivityIndicator size="small" color="#9D4300" />
                  ) : (
                    <Text style={styles.btnAiKeepText}>Dự báo lại AI</Text>
                  )}
                </Pressable>
              </View>

              {aiMeal?.isAiAccepted === undefined && (
                <Pressable
                  onPress={handleAiKeep}
                  style={({ pressed }) => [
                    styles.btnAiKeepSecondary,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <Text style={styles.btnAiKeepText}>
                    Giữ nguyên định mức ({aiMeal?.targetKg ?? 25} kg)
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.aiCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant + '40',
                  alignItems: 'center',
                  paddingVertical: 18,
                },
              ]}>
              <MaterialIcons name="psychology" size={32} color={colors.outlineVariant} />
              <Text style={{ marginTop: 6, fontSize: 13, color: colors.onSurfaceVariant, fontWeight: '600' }}>
                Chưa có khuyến nghị AI cho ao này
              </Text>
              <Pressable
                onPress={handlePredictAi}
                disabled={isPredictingAi}
                style={({ pressed }) => [
                  styles.btnPredictEmpty,
                  { opacity: pressed || isPredictingAi ? 0.8 : 1 },
                ]}>
                {isPredictingAi ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="auto-awesome" size={16} color="#FFFFFF" />
                    <Text style={styles.btnPredictEmptyText}>Chạy dự báo AI (XGBoost)</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Meal Timeline List */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, flex: 1, marginRight: 8 }]}>
              LỊCH CHO ĂN & NHẬT KÝ CỮ ĂN
            </Text>
            <Pressable
              onPress={handleOpenQuickFeedModal}
              style={[styles.addMealBtn, { backgroundColor: '#FFDBCA', flexShrink: 0 }]}>
              <MaterialIcons name="bolt" size={16} color="#9D4300" />
              <Text style={styles.addMealText}>Cho Ăn Nhanh</Text>
            </Pressable>
          </View>

          <View style={styles.timelineList}>
            {feedMeals.length === 0 ? (
              <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                <MaterialIcons name="event-note" size={44} color={colors.outlineVariant} />
                <Text style={{ marginTop: 8, fontSize: 13, color: colors.onSurfaceVariant }}>
                  Chưa có dữ liệu lịch cho ăn được thiết lập cho ao này
                </Text>
              </View>
            ) : (
              feedMeals.map((meal) => {
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
            }))}
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
              <Pressable
                onPress={handleSuggestAiForQuickFeed}
                disabled={isPredictingAi}
                style={({ pressed }) => [
                  styles.aiSuggestBtn,
                  { opacity: pressed || isPredictingAi ? 0.75 : 1 },
                ]}>
                {isPredictingAi ? (
                  <ActivityIndicator size="small" color="#EA580C" />
                ) : (
                  <MaterialIcons name="auto-awesome" size={16} color="#EA580C" />
                )}
                <Text style={styles.aiSuggestBtnText}>
                  {isPredictingAi ? 'Đang chạy dự báo AI...' : 'Gợi ý lượng cám từ AI (XGBoost)'}
                </Text>
              </Pressable>
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

      <SafetyBlockedModal
        visible={blockedModalInfo.visible}
        onClose={() => setBlockedModalInfo((prev) => ({ ...prev, visible: false }))}
        pondName={pondDisplayName}
        reasons={blockedModalInfo.reasons}
        telemetrySnapshot={blockedModalInfo.telemetrySnapshot}
      />
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
  trendsBanner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trendsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B1C30',
    letterSpacing: 0.3,
  },
  trendsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  trendsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B1C30',
  },
  trendsMetricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  trendsMetric: {
    fontSize: 12,
    color: '#334155',
  },
  trendsDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  aiModelSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  aiAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  aiBigKg: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EA580C',
  },
  aiBigUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#584237',
  },
  aiBaseNote: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  aiSafetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 8,
  },
  aiSafetyNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  shapSection: {
    gap: 6,
    marginTop: 2,
  },
  shapHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  shapWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  shapPillInc: {
    backgroundColor: '#E8F5E9',
    borderColor: '#7CF994',
  },
  shapPillDec: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  shapPillNeu: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  shapPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnAiKeepSecondary: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPredictEmpty: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EA580C',
  },
  btnPredictEmptyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  aiSuggestBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  aiSuggestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9D4300',
  },
  whatIfToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  whatIfToggleText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#9D4300',
  },
  whatIfBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
  },
  whatIfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whatIfField: {
    width: '30%',
    flexGrow: 1,
    gap: 3,
  },
  whatIfLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  whatIfInput: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0B1C30',
  },
  whatIfResetBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  whatIfResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
});
