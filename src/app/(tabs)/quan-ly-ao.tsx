import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';

export default function ScreenPondDetail() {
  const colors = useTheme();

  const [shrimpSize, setShrimpSize] = useState(65);
  const [bags, setBags] = useState(28);
  const [cumulativeBags, setCumulativeBags] = useState(102);
  const [feederHopperWeight, setFeederHopperWeight] = useState(50);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [modalInputSize, setModalInputSize] = useState(64);
  const [toastMessage, setToastMessage] = useState<{ msg: string; sub: string } | null>(null);

  const triggerToast = (msg: string, sub: string) => {
    setToastMessage({ msg, sub });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickPourFeed = () => {
    if (bags > 0) {
      setBags((b) => b - 1);
      setCumulativeBags((cb) => cb + 1);
      setFeederHopperWeight((hw) => hw + 25);
      triggerToast('Đã ghi nhận 1 bao cám!', `+25 kg vào máy • Còn ${bags - 1} bao ở kho bờ ao`);
    } else {
      Alert.alert('Kho đã hết cám', 'Kho tại bờ ao đã hết cám! Cần xuất kho tổng thêm.');
    }
  };

  const handleSaveSample = () => {
    setShrimpSize(modalInputSize);
    setShowSampleModal(false);
    triggerToast('Đã lưu cỡ chài mới!', `Cỡ tôm đạt: ${modalInputSize} con/kg`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader title="Khu Nuôi Bạc Liêu A" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Selector Banner */}
          <View
            style={[
              styles.selectorCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.selectorLeft}>
              <View style={[styles.selectorIconBox, { backgroundColor: colors.primaryFixed }]}>
                <MaterialIcons name="waves" size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.selectorTagRow}>
                  <Text style={[styles.selectorTag, { color: colors.primary }]}>AO NUÔI THAO TÁC</Text>
                  <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
                </View>
                <Text numberOfLines={1} style={[styles.selectorTitle, { color: colors.onSurface }]}>
                  AO 2 — Tôm Thẻ Chân Trắng
                </Text>
                <Text style={[styles.selectorSub, { color: colors.onSurfaceVariant }]}>
                  42 ngày tuổi • Vụ Thu Đông
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert('Đổi Ao Nuôi', 'Chọn chuyển đổi sang:\n• Ao 1 (Ao nuôi chính)\n• Ao 3 (Ao giống)\n• Ao 4 (Ương vèo)')}
              style={({ pressed }) => [
                styles.swapBtn,
                { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="swap-horiz" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Hero Photo Banner */}
          <View style={[styles.heroBanner, { backgroundColor: colors.surfaceContainer }]}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuGoxBwi3HEWNj5sAv4S0fZVQTBfNA0fOYSNGSTELHjZnixdDflJ_GR8OX8m-RsVNwAe-rZmeokAljLcUN4Mb166KG_SauPA3G-_xeAocqzXgvpvX-JjE0TB7XJOi0VKs_N2fmLLZbgVwA3xYepflZGJQezLyedm2KQ9ptSaKUyW5nTSriq5T_xUCEewnxZn1pFgboa2dkuIiEHGqtVM5kieY1rgLILYf02CfRM-OiZ1gWFtiZUFPBcw',
              }}
              style={styles.heroImg}
              contentFit="cover"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroOverlayRow}>
                <View>
                  <View style={styles.growthBadge}>
                    <MaterialIcons name="verified" size={14} color={colors.secondaryFixed} />
                    <Text style={[styles.growthBadgeText, { color: colors.secondaryFixed }]}>
                      Tăng Trưởng Ổn Định
                    </Text>
                  </View>
                  <Text style={styles.growthSub}>Tốc độ tăng trưởng: +1.8 g/tuần</Text>
                </View>

                <View style={styles.densityBox}>
                  <Text style={styles.densityLabel}>Mật độ thả</Text>
                  <Text style={styles.densityVal}>110 con/m²</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Khối 1: Thông Tin Con Tôm & Nhật Ký Chài Tôm */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="set-meal" size={22} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Nhật Ký Chài Tôm
                </Text>
              </View>
              <View style={[styles.infoPill, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.infoPillText, { color: colors.primary }]}>Ngày thả: 15/07</Text>
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.statBoxLabel, { color: colors.onSurfaceVariant }]}>Tuổi tôm</Text>
                <View style={styles.numRow}>
                  <Text style={[styles.statBoxNum, { color: colors.primary }]}>42</Text>
                  <Text style={[styles.statBoxUnit, { color: colors.onSurface }]}>ngày</Text>
                </View>
                <View style={styles.stageTag}>
                  <MaterialIcons name="arrow-upward" size={13} color={colors.secondary} />
                  <Text style={[styles.stageTagText, { color: colors.secondary }]}>Giai đoạn về đích</Text>
                </View>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.statBoxLabel, { color: colors.onSurfaceVariant }]}>Cỡ tôm chài</Text>
                  <MaterialIcons name="history" size={16} color={colors.onSurfaceVariant} />
                </View>
                <View style={styles.numRow}>
                  <Text style={[styles.statBoxNum, { color: colors.onSurface }]}>{shrimpSize}</Text>
                  <Text style={[styles.statBoxUnit, { color: colors.onSurfaceVariant }]}>con/kg</Text>
                </View>
                <Text style={[styles.historyText, { color: colors.outline }]}>Hôm qua lúc 16:00</Text>
              </View>
            </View>

            {/* Button Open Sample Modal */}
            <Pressable
              onPress={() => setShowSampleModal(true)}
              style={({ pressed }) => [
                styles.btnOutline,
                { backgroundColor: colors.surfaceContainerHigh, opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="add-circle" size={20} color={colors.primary} />
              <Text style={[styles.btnOutlineText, { color: colors.primary }]}>
                + Ghi nhật ký chài tôm mới
              </Text>
            </Pressable>
          </View>

          {/* Khối 2: Sổ Kho Cám Tại Cầu Ao */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="inventory-2" size={22} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Kho Cám Bờ Ao
                </Text>
              </View>
              <View style={[styles.syncPill, { backgroundColor: colors.secondaryContainer }]}>
                <MaterialIcons name="check-circle" size={13} color={colors.onSecondaryContainer} />
                <Text style={[styles.syncPillText, { color: colors.onSecondaryContainer }]}>
                  Đồng bộ máy ăn
                </Text>
              </View>
            </View>

            <View style={[styles.feedTypeBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.feedTypeLeft}>
                <View style={[styles.feedIconBox, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialIcons name="scale" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.feedTypeTag, { color: colors.outline }]}>LOẠI CÁM HIỆN TẠI</Text>
                  <Text style={[styles.feedTypeName, { color: colors.onSurface }]}>
                    Cám số 2 (Độ đạm 40%)
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.feedWeightTag, { color: colors.outline }]}>Quy cách</Text>
                <Text style={[styles.feedWeightVal, { color: colors.onSurface }]}>25 kg/bao</Text>
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.statBoxLabel, { color: colors.onSurfaceVariant }]}>Tồn bờ ao</Text>
                <View style={styles.numRow}>
                  <Text style={[styles.statBoxNum, { color: colors.primary }]}>{bags}</Text>
                  <Text style={[styles.statBoxUnit, { color: colors.onSurface }]}>bao</Text>
                </View>
                <Text style={[styles.historyText, { color: colors.outline }]}>
                  ~{bags * 25} kg còn lại
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.statBoxLabel, { color: colors.onSurfaceVariant }]}>Phễu máy ăn</Text>
                <View style={styles.numRow}>
                  <Text style={[styles.statBoxNum, { color: colors.secondary }]}>
                    {feederHopperWeight}
                  </Text>
                  <Text style={[styles.statBoxUnit, { color: colors.onSurface }]}>kg</Text>
                </View>
                <View style={styles.feedRunningTag}>
                  <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.feedRunningText, { color: colors.secondary }]}>
                    Đang phun 1.2 kg/h
                  </Text>
                </View>
              </View>
            </View>

            {/* 1-Touch Pour Feed Button */}
            <Pressable
              onPress={handleQuickPourFeed}
              style={({ pressed }) => [
                styles.pourFeedBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialIcons name="move-to-inbox" size={24} color="#FFFFFF" />
              <Text style={styles.pourFeedText}>[ + ĐÃ ĐỔ 1 BAO VÀO MÁY (25KG) ]</Text>
            </Pressable>
            <Text style={[styles.pourFeedHint, { color: colors.outline }]}>
              Chạm 1 lần: Tự cộng 25 kg vào máy & trừ 1 bao trong kho ngay lập tức
            </Text>
          </View>

          {/* Khối 3: Nhật Ký Nước Ao */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="water-drop" size={22} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Chất Lượng Nước Thực Tế
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.onlineSensorText, { color: colors.secondary }]}>
                  Cảm biến trực tuyến
                </Text>
              </View>
            </View>

            <View style={styles.waterGrid}>
              {/* DO */}
              <View style={[styles.waterBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.waterBoxHeader}>
                  <Text style={[styles.waterBoxLabel, { color: colors.onSurfaceVariant }]}>
                    Oxy hòa tan (DO)
                  </Text>
                  <View style={[styles.goodPill, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.goodPillText, { color: colors.onSecondaryContainer }]}>Tốt</Text>
                  </View>
                </View>
                <View style={styles.numRow}>
                  <Text style={[styles.waterBoxVal, { color: colors.primary }]}>5.4</Text>
                  <Text style={[styles.waterBoxUnit, { color: colors.onSurfaceVariant }]}>mg/L</Text>
                </View>
                <Text style={[styles.waterNote, { color: colors.onSurfaceVariant }]}>
                  Bật quạt lúc 11:00
                </Text>
              </View>

              {/* Temp */}
              <View style={[styles.waterBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.waterBoxHeader}>
                  <Text style={[styles.waterBoxLabel, { color: colors.onSurfaceVariant }]}>
                    Nhiệt độ nước
                  </Text>
                  <View style={[styles.goodPill, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.goodPillText, { color: colors.onSecondaryContainer }]}>Ổn định</Text>
                  </View>
                </View>
                <View style={styles.numRow}>
                  <Text style={[styles.waterBoxVal, { color: colors.onSurface }]}>30.5</Text>
                  <Text style={[styles.waterBoxUnit, { color: colors.onSurfaceVariant }]}>°C</Text>
                </View>
                <Text style={[styles.waterNote, { color: colors.outline }]}>Đỉnh trưa: 31.2 °C</Text>
              </View>

              {/* Salinity */}
              <View style={[styles.waterBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.waterBoxHeader}>
                  <Text style={[styles.waterBoxLabel, { color: colors.onSurfaceVariant }]}>
                    Độ mặn ao
                  </Text>
                  <MaterialIcons name="tune" size={16} color={colors.outline} />
                </View>
                <View style={styles.numRow}>
                  <Text style={[styles.waterBoxVal, { color: colors.onSurface }]}>16</Text>
                  <Text style={[styles.waterBoxUnit, { color: colors.onSurfaceVariant }]}>‰</Text>
                </View>
                <Text style={[styles.waterNote, { color: colors.secondary, fontWeight: '700' }]}>
                  Phù hợp thẻ chân trắng
                </Text>
              </View>

              {/* Alkalinity */}
              <View style={[styles.waterBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.waterBoxHeader}>
                  <Text style={[styles.waterBoxLabel, { color: colors.onSurfaceVariant }]}>
                    Độ kiềm
                  </Text>
                  <View style={[styles.goodPill, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.goodPillText, { color: colors.onSecondaryContainer }]}>Chuẩn</Text>
                  </View>
                </View>
                <View style={styles.numRow}>
                  <Text style={[styles.waterBoxVal, { color: colors.onSurface }]}>120</Text>
                  <Text style={[styles.waterBoxUnit, { color: colors.onSurfaceVariant }]}>mg/L</Text>
                </View>
                <Text style={[styles.waterNote, { color: colors.secondary, fontWeight: '700' }]}>
                  Sechii 30cm
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert('Test Kit Thủ Công', 'Khí độc NO2: 0.05 mg/L\nKhí độc NH3: 0.01 mg/L\npH: 7.8 (Đo lúc 08:00)')}
              style={({ pressed }) => [
                styles.btnTestKit,
                { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="biotech" size={18} color={colors.primary} />
              <Text style={[styles.btnTestKitText, { color: colors.onSurface }]}>
                Nhập kết quả test kit thủ công (pH, NO2, NH3)
              </Text>
            </Pressable>
          </View>

          {/* Khối 4: Chi Phí Tiền Cám Tạm Tính Tháng Này */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="payments" size={22} color={colors.tertiary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Hạch Toán Cám Tháng Này
                </Text>
              </View>
              <View style={[styles.monthPill, { backgroundColor: colors.tertiaryFixed }]}>
                <Text style={[styles.monthPillText, { color: colors.onTertiaryFixed }]}>
                  Tháng 10/2026
                </Text>
              </View>
            </View>

            <View style={[styles.calcBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.onSurfaceVariant }]}>Lượng cám đã nạp:</Text>
                <Text style={[styles.calcVal, { color: colors.onSurface }]}>
                  {cumulativeBags} bao (~{(cumulativeBags * 25).toLocaleString()} kg)
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.surfaceVariant }]} />

              <View style={styles.calcTotalRow}>
                <Text style={[styles.calcTotalLabel, { color: colors.onSurface }]}>
                  Tạm tính thành tiền:
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.calcTotalAmount, { color: colors.tertiary }]}>
                    ~{(cumulativeBags * 450000).toLocaleString('vi-VN')} đ
                  </Text>
                  <Text style={[styles.calcPriceNote, { color: colors.outline }]}>
                    Đơn giá: ~450.000 đ/bao
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.fcrRow}>
              <MaterialIcons name="info" size={15} color={colors.secondary} />
              <Text style={[styles.fcrText, { color: colors.onSurfaceVariant }]}>
                FCR dự kiến hiện tại: 1.18 (Tối ưu lợi nhuận cho hộ nuôi)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: colors.inverseSurface }]}>
          <View style={styles.toastLeft}>
            <View style={[styles.toastCheck, { backgroundColor: colors.secondary }]}>
              <MaterialIcons name="check" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.toastMsg, { color: colors.inverseOnSurface }]}>
                {toastMessage.msg}
              </Text>
              <Text numberOfLines={1} style={[styles.toastSub, { color: colors.inverseOnSurface + 'C0' }]}>
                {toastMessage.sub}
              </Text>
            </View>
          </View>
          <Text style={[styles.toastAction, { color: colors.secondaryFixed }]}>Hoàn tất</Text>
        </View>
      )}

      {/* Modal Chài Tôm */}
      <Modal visible={showSampleModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialIcons name="calculate" size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Nhật Ký Chài Tôm Mới
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSampleModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceContainer }]}>
                <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.modalHint, { color: colors.onSurfaceVariant }]}>
              Chài mẫu tại 3 góc ao và cân trọng lượng trung bình để tính số con trên mỗi kg.
            </Text>

            <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.stepperLabel, { color: colors.onSurface }]}>
                Kích cỡ tôm đo được (con / 1 kg)
              </Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setModalInputSize((s) => Math.max(15, s - 1))}
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Text style={[styles.stepperBtnText, { color: colors.onSurface }]}>-</Text>
                </Pressable>

                <View style={[styles.stepperDisplay, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <Text style={[styles.stepperDisplayText, { color: colors.primary }]}>
                    {modalInputSize}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setModalInputSize((s) => Math.min(250, s + 1))}
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Text style={[styles.stepperBtnText, { color: colors.onSurface }]}>+</Text>
                </Pressable>
              </View>

              <View style={styles.stepperMetaRow}>
                <Text style={[styles.stepperMetaSub, { color: colors.outline }]}>
                  Tôm lớn dần số sẽ giảm
                </Text>
                <Text style={[styles.stepperMetaGrams, { color: colors.secondary }]}>
                  Dự kiến ~{(1000 / modalInputSize).toFixed(1)} g/con
                </Text>
              </View>
            </View>

            <View style={[styles.healthCheckCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.healthCheckLabel, { color: colors.onSurfaceVariant }]}>
                Ghi chú đường ruột & gan tụy
              </Text>
              <View style={styles.healthCheckRow}>
                <View style={[styles.healthCheckBtn, { backgroundColor: colors.secondaryContainer }]}>
                  <MaterialIcons name="check" size={14} color={colors.onSecondaryContainer} />
                  <Text style={[styles.healthCheckBtnText, { color: colors.onSecondaryContainer }]}>
                    Ruột đầy
                  </Text>
                </View>
                <View style={[styles.healthCheckBtn, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.healthCheckBtnText, { color: colors.onSurface }]}>
                    Gan đen sẫm
                  </Text>
                </View>
                <View style={[styles.healthCheckBtn, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.healthCheckBtnText, { color: colors.onSurface }]}>
                    Vỏ cứng bóng
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setShowSampleModal(false)}
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.modalCancelBtnText, { color: colors.onSurface }]}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveSample}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.modalSaveBtnText}>Lưu Nhật Ký</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  container: {
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectorTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectorTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  selectorSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 26, 40, 0.65)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  heroOverlayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  growthSub: {
    color: '#EEF0FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  densityBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  densityLabel: {
    color: '#EEF0FF',
    fontSize: 10,
  },
  densityVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  grid2: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statBoxNum: {
    fontSize: 28,
    fontWeight: '900',
  },
  statBoxUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  stageTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  btnOutline: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  syncPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  feedTypeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  feedTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTypeTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feedTypeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedWeightTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  feedWeightVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  feedRunningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  feedRunningText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pourFeedBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pourFeedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pourFeedHint: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  onlineSensorText: {
    fontSize: 11,
    fontWeight: '800',
  },
  waterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waterBox: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  waterBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  goodPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goodPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  waterBoxVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  waterBoxUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  waterNote: {
    fontSize: 10,
  },
  btnTestKit: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnTestKitText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  calcBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  calcTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  calcTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  calcPriceNote: {
    fontSize: 9,
    fontWeight: '700',
  },
  fcrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  fcrText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  toastCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastMsg: {
    fontSize: 13,
    fontWeight: '800',
  },
  toastSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  toastAction: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepperContainer: {
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 24,
    fontWeight: '900',
  },
  stepperDisplay: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplayText: {
    fontSize: 30,
    fontWeight: '900',
  },
  stepperMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperMetaSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperMetaGrams: {
    fontSize: 11,
    fontWeight: '800',
  },
  healthCheckCard: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  healthCheckLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  healthCheckRow: {
    flexDirection: 'row',
    gap: 8,
  },
  healthCheckBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  healthCheckBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  modalCancelBtn: {
    width: '32%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
