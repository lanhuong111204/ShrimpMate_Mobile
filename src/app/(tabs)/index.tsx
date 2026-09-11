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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';

export default function ScreenHome() {
  const colors = useTheme();
  const router = useRouter();

  const [ao2Running, setAo2Running] = useState(true);
  const [ao3Refilled, setAo3Refilled] = useState(false);

  const handleEmergencyStopAll = () => {
    Alert.alert(
      'CẢNH BÁO KHẨN CẤP',
      'Bạn có chắc chắn muốn ngắt điện toàn bộ 5 máy cho ăn ngay lập tức không? Tôm sẽ dừng rải cám ngay.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'NGẮT ĐIỆN NGAY',
          style: 'destructive',
          onPress: () => {
            setAo2Running(false);
            Alert.alert(
              'ĐÃ NGẮT NGUỒN AN TOÀN',
              'Đã ngắt nguồn toàn bộ máy cho ăn. Đèn hiệu bờ ao đã chuyển sang màu đỏ an toàn.'
            );
          },
        },
      ]
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Thông Báo Hệ Thống',
      '• Ao 2: Máy đang phun cữ trưa (tiến độ 72%)\n• Ao 3: Cảnh báo mực cám sắp hết (< 5 kg)\n• Trại Bạc Liêu: Cảm biến hoạt động ổn định'
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader title="Khu Nuôi Bạc Liêu A" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Status & Context Header Card */}
          <View
            style={[
              styles.contextCard,
              { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant + '30' },
            ]}>
            <View style={styles.contextLeft}>
              <View style={styles.contextTitleRow}>
                <MaterialIcons name="water" size={20} color={colors.primary} />
                <Text style={[styles.contextTitle, { color: colors.onSurface }]}>
                  Trại Tôm Ba Đầm
                </Text>
              </View>

              <View style={styles.contextMetaRow}>
                <View style={[styles.activePondsPill, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={[styles.activePondsText, { color: colors.primary }]}>5 Ao đang nuôi</Text>
                </View>
                <Text style={{ color: colors.outline }}>•</Text>
                <View style={styles.weatherItem}>
                  <MaterialIcons name="wb-sunny" size={14} color={colors.tertiaryContainer} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>Nắng ráo 31°C</Text>
                </View>
                <Text style={{ color: colors.outline }}>•</Text>
                <View style={styles.weatherItem}>
                  <MaterialIcons name="water-drop" size={14} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>Nước lớn 15:30</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleNotificationPress}
              style={({ pressed }) => [
                styles.notiBtn,
                { backgroundColor: colors.surfaceContainerLowest, opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="notifications" size={24} color={colors.onSurface} />
              <View style={[styles.notiDot, { backgroundColor: colors.error }]} />
            </Pressable>
          </View>

          {/* Hero Visual Photo */}
          <View style={[styles.heroCard, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ4bJfsx2Lj8XZy0-Twf_LEI2rfiJvzG4_HPHHN1QCUalsalkZkhHPqIpUEZT96vrJhPQRdqTZ9paZFZI3MGOrOb8cv_HlxoUWq7BBS1B5Y0u71EzwxzGEb_m5T1hDx_LGEOwlgmIi6WHibR528tIULEDLb7o5tUz5cYAlTI1xqhUBSprFMMMKAEAEQikJgFK_XTkCu_46jU-iv8sOV8nGb3EqrRrvaGrGYywW15sfLIo4BXJjGuOGGA',
              }}
              style={styles.heroImg}
              contentFit="cover"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroOverlayContent}>
                <View style={styles.heroStatus}>
                  <View style={[styles.heroDot, { backgroundColor: colors.secondaryFixed }]} />
                  <Text numberOfLines={1} style={styles.heroText}>
                    Cảm biến tầng nước & Máy phun tự động hoạt động
                  </Text>
                </View>
                <View style={[styles.iotBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.iotBadgeText}>IoT v4.2</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Today Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTitleGroup}>
                <View style={styles.summaryIconBox}>
                  <MaterialIcons name="insights" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.summaryTitle}>Tổng Quan Hôm Nay</Text>
                  <Text style={styles.summarySub}>Cập nhật theo thời gian thực</Text>
                </View>
              </View>

              <View style={[styles.liveBadge, { backgroundColor: colors.secondaryContainer }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.liveText, { color: colors.onSecondaryContainer }]}>TRỰC TIẾP</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Tổng cám đã rải</Text>
                <View style={styles.summaryNumRow}>
                  <Text style={styles.summaryItemVal}>320</Text>
                  <Text style={styles.summaryItemUnit}>kg</Text>
                </View>
                <View style={styles.summaryItemTag}>
                  <Text style={styles.summaryItemTagText}>~13 bao cám</Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Tình trạng máy</Text>
                <View style={styles.summaryNumRow}>
                  <Text style={[styles.summaryItemVal, { color: colors.secondaryFixed }]}>
                    {ao2Running ? '4' : '3'}
                    <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }}>/5</Text>
                  </Text>
                  <Text style={[styles.summaryItemUnit, { color: colors.secondaryFixed }]}>Máy</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={[styles.liveDot, { backgroundColor: colors.secondaryFixed }]} />
                  <Text style={[styles.summaryItemTagText, { color: colors.secondaryFixed }]}>
                    Đang chạy cữ
                  </Text>
                </View>
              </View>
            </View>

            {!ao3Refilled && (
              <View style={[styles.warningBanner, { backgroundColor: colors.tertiaryContainer }]}>
                <View style={styles.warningBannerLeft}>
                  <MaterialIcons name="warning" size={20} color="#FFFFFF" />
                  <Text numberOfLines={1} style={styles.warningBannerText}>
                    <Text style={{ color: colors.tertiaryFixed, fontWeight: '800' }}>Ao 3:</Text> Cần nạp cám gấp (&lt; 5 kg)
                  </Text>
                </View>
                <View style={[styles.warningBannerTime, { backgroundColor: colors.tertiary }]}>
                  <Text style={styles.warningBannerTimeText}>TRƯỚC 14:00</Text>
                </View>
              </View>
            )}
          </View>

          {/* Pond Section Title */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <MaterialIcons name="grid-view" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Danh Sách Ao Nuôi
              </Text>
            </View>
            <View style={[styles.pondCountPill, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[styles.pondCountText, { color: colors.onSurfaceVariant }]}>
                4 / 5 Đang chạy
              </Text>
            </View>
          </View>

          {/* Pond Cards List */}
          <View style={styles.pondsList}>
            {/* AO 1 */}
            <View
              style={[
                styles.pondCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderLeftColor: colors.secondary,
                },
              ]}>
              <View style={styles.pondCardHeader}>
                <View>
                  <View style={styles.pondTitleGroup}>
                    <Text style={[styles.pondName, { color: colors.onSurface }]}>AO 1</Text>
                    <View style={[styles.statusPill, { backgroundColor: colors.secondaryContainer }]}>
                      <MaterialIcons name="check-circle" size={13} color={colors.onSecondaryContainer} />
                      <Text style={[styles.statusPillText, { color: colors.onSecondaryContainer }]}>TỐT</Text>
                    </View>
                  </View>
                  <Text style={[styles.pondSub, { color: colors.onSurfaceVariant }]}>
                    Tôm thẻ • 55 ngày tuổi
                  </Text>
                </View>

                <View style={[styles.feedStatBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.feedStatLabel, { color: colors.outline }]}>Đã ăn hôm nay</Text>
                  <Text style={[styles.feedStatVal, { color: colors.primary }]}>
                    85 <Text style={styles.feedStatUnit}>kg</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.primaryFixed }]}>
                      <MaterialIcons name="air" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Oxy (DO)</Text>
                      <Text style={[styles.metricNumber, { color: colors.secondary }]}>
                        5.2 <Text style={styles.metricSubUnit}>mg/L</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.secondaryContainer }]}>
                      <MaterialIcons name="science" size={16} color={colors.secondary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Độ pH</Text>
                      <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                        7.8 <Text style={styles.metricSubUnit}>pH</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>
              </View>

              <View style={[styles.pondStatusFooter, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.pondStatusLeft}>
                  <MaterialIcons name="pause-circle" size={18} color={colors.outline} />
                  <Text style={[styles.pondStatusText, { color: colors.onSurface }]}>
                    Máy Cho Ăn: Đang nghỉ
                  </Text>
                </View>
                <View style={[styles.nextFeedBadge, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.nextFeedText, { color: colors.onSurfaceVariant }]}>
                    Cữ kế: 14:00
                  </Text>
                </View>
              </View>
            </View>

            {/* AO 2 (Interactive Link to Detail) */}
            <View
              style={[
                styles.pondCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderLeftColor: colors.primary,
                },
              ]}>
              <View style={styles.pondCardHeader}>
                <View>
                  <View style={styles.pondTitleGroup}>
                    <Pressable
                      onPress={() => router.push('/(tabs)/quan-ly-ao')}
                      style={styles.clickablePondTitle}>
                      <Text style={[styles.pondName, { color: colors.primary }]}>AO 2</Text>
                      <MaterialIcons name="open-in-new" size={16} color={colors.primary} />
                    </Pressable>
                    <View style={[styles.statusPill, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="rotate-right" size={13} color="#FFFFFF" />
                      <Text style={[styles.statusPillText, { color: '#FFFFFF' }]}>
                        {ao2Running ? 'ĐANG PHUN CỮ TRƯA' : 'TẠM DỪNG'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.pondSub, { color: colors.onSurfaceVariant }]}>
                    Tôm thẻ • 42 ngày tuổi
                  </Text>
                </View>

                <View style={[styles.feedStatBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.feedStatLabel, { color: colors.outline }]}>Tiến độ cữ</Text>
                  <Text style={[styles.feedStatVal, { color: colors.secondary }]}>
                    16 <Text style={{ fontSize: 11, color: colors.outline }}>/ 22 kg</Text>
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View style={[styles.progressBarFill, { width: '72%', backgroundColor: colors.primary }]} />
              </View>

              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.primaryFixed }]}>
                      <MaterialIcons name="air" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Oxy (DO)</Text>
                      <Text style={[styles.metricNumber, { color: colors.secondary }]}>
                        5.5 <Text style={styles.metricSubUnit}>mg/L</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.secondaryContainer }]}>
                      <MaterialIcons name="science" size={16} color={colors.secondary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Độ pH</Text>
                      <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                        7.8 <Text style={styles.metricSubUnit}>pH</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>
              </View>

              {/* Feeder status box + Toggle action */}
              <View style={[styles.feederBanner, { backgroundColor: colors.primaryFixed + '50' }]}>
                <View style={styles.feederBannerLeft}>
                  <MaterialIcons name="cyclone" size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.feederTextBold, { color: colors.onPrimaryFixed }]}>
                      Máy phun quay 45 Hz
                    </Text>
                    <Text numberOfLines={1} style={[styles.feederTextSub, { color: colors.onPrimaryFixedVariant }]}>
                      Bán kính rải 8 mét
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setAo2Running(!ao2Running)}
                  style={({ pressed }) => [
                    styles.feederToggleBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <Text style={styles.feederToggleText}>
                    {ao2Running ? 'TẠM DỪNG' : 'TIẾP TỤC'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* AO 3 */}
            <View
              style={[
                styles.pondCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderLeftColor: colors.tertiaryContainer,
                },
              ]}>
              <View style={styles.pondCardHeader}>
                <View>
                  <View style={styles.pondTitleGroup}>
                    <Text style={[styles.pondName, { color: colors.onSurface }]}>AO 3</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: ao3Refilled ? colors.secondary : colors.tertiaryContainer },
                      ]}>
                      <MaterialIcons
                        name={ao3Refilled ? 'check-circle' : 'warning'}
                        size={13}
                        color="#FFFFFF"
                      />
                      <Text style={[styles.statusPillText, { color: '#FFFFFF' }]}>
                        {ao3Refilled ? 'ĐÃ NẠP CÁM' : 'HẾT CÁM'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.pondSub, { color: colors.onSurfaceVariant }]}>
                    Tôm sú giống • 25 ngày tuổi
                  </Text>
                </View>

                <View style={[styles.feedStatBox, { backgroundColor: colors.tertiaryFixed + '40' }]}>
                  <Text style={[styles.feedStatLabel, { color: colors.tertiary }]}>Trong phễu</Text>
                  <Text style={[styles.feedStatVal, { color: colors.tertiaryContainer }]}>
                    {ao3Refilled ? '30' : '< 5'} <Text style={styles.feedStatUnit}>kg</Text>
                  </Text>
                </View>
              </View>

              <View style={[styles.refillBanner, { backgroundColor: colors.tertiaryFixed + '40' }]}>
                <View style={styles.refillBannerLeft}>
                  <MaterialIcons name="inventory-2" size={22} color={colors.tertiaryContainer} />
                  <View>
                    <Text style={[styles.refillTitle, { color: colors.onTertiaryFixed }]}>
                      {ao3Refilled ? 'Đã nạp đủ cám' : 'Cần nạp 1 bao (25kg)'}
                    </Text>
                    <Text style={[styles.refillSub, { color: colors.onTertiaryFixedVariant }]}>
                      Phễu tự ngắt an toàn
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    setAo3Refilled(true);
                    Alert.alert('Nạp cám thành công', 'Đã ghi nhận nạp 1 bao cám (25kg) vào phễu Ao 3!');
                  }}
                  style={({ pressed }) => [
                    styles.refillBtn,
                    { backgroundColor: colors.tertiary, opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <MaterialIcons name="add-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.refillBtnText}>Đã Nạp Cám</Text>
                </Pressable>
              </View>
            </View>

            {/* AO 4 */}
            <View
              style={[
                styles.pondCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderLeftColor: colors.secondary,
                },
              ]}>
              <View style={styles.pondCardHeader}>
                <View>
                  <View style={styles.pondTitleGroup}>
                    <Text style={[styles.pondName, { color: colors.onSurface }]}>AO 4</Text>
                    <View style={[styles.statusPill, { backgroundColor: colors.secondaryContainer }]}>
                      <MaterialIcons name="verified" size={13} color={colors.onSecondaryContainer} />
                      <Text style={[styles.statusPillText, { color: colors.onSecondaryContainer }]}>
                        NƯỚC TỐT
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.pondSub, { color: colors.onSurfaceVariant }]}>
                    Tôm thẻ • 18 ngày tuổi (Ương vèo)
                  </Text>
                </View>

                <View style={[styles.feedStatBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.feedStatLabel, { color: colors.outline }]}>Đã rải hôm nay</Text>
                  <Text style={[styles.feedStatVal, { color: colors.primary }]}>
                    40 <Text style={styles.feedStatUnit}>kg</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.secondaryContainer }]}>
                      <MaterialIcons name="air" size={16} color={colors.secondary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Oxy (DO)</Text>
                      <Text style={[styles.metricNumber, { color: colors.secondary }]}>
                        6.0 <Text style={styles.metricSubUnit}>mg/L</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.metricBoxLeft}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.primaryFixed }]}>
                      <MaterialIcons name="water-drop" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Độ mặn</Text>
                      <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                        15 <Text style={styles.metricSubUnit}>‰</Text>
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="check" size={18} color={colors.secondary} />
                </View>
              </View>
            </View>
          </View>

          {/* Machinery Showcase Banner */}
          <View style={[styles.machineryCard, { backgroundColor: colors.surfaceContainer }]}>
            <View style={[styles.machineryImgBox, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxKFOZkARYkOKF79ksjv8Q3ZLsyIuHVrkMHFqkvAdxKAZDOn5CwF5iSTc4rRKywVkdsPiCVpBYw0TcWbSKiefrUJQY4RIiXoMge0Wzt00mmAXFxTchPht7oFsCN2j0VYCZbEuChWPCIb9Iu4QvzdlW7XhwHAm3RVEDtwSEAlWD5lnYu1ILhSTz5CR8KG0RjxYexgA4X5Yxvn17BBh5iHHsfZlT5SxJbdEBlCiDSLqRzWKGPZPITZgXMQ',
                }}
                style={styles.machineryImg}
                contentFit="cover"
              />
            </View>
            <View style={styles.machineryContent}>
              <View style={styles.machineryTag}>
                <MaterialIcons name="verified" size={14} color={colors.secondary} />
                <Text style={[styles.machineryTagText, { color: colors.secondary }]}>
                  Động cơ biến tần chống ẩm
                </Text>
              </View>
              <Text style={[styles.machineryTitle, { color: colors.onSurface }]}>
                5 Máy Cho Ăn ShrimpMate
              </Text>
              <Text style={[styles.machinerySub, { color: colors.onSurfaceVariant }]}>
                Hiệu chuẩn định kỳ lúc 06:00 sáng. Pin mặt trời nạp đầy 100%.
              </Text>
            </View>
          </View>

          {/* Big Red Emergency Stop Button */}
          <Pressable
            onPress={handleEmergencyStopAll}
            style={({ pressed }) => [
              styles.emergencyBtn,
              { backgroundColor: colors.error, opacity: pressed ? 0.9 : 1 },
            ]}>
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIconBox}>
                <MaterialIcons name="gpp-bad" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>NGẮT ĐIỆN TẤT CẢ MÁY CHO ĂN</Text>
                <Text style={styles.emergencySub}>Dùng khi có giông sét hoặc sự cố khẩn cấp</Text>
              </View>
            </View>
            <MaterialIcons name="power-settings-new" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Connectivity Banner */}
          <View
            style={[
              styles.connectivityCard,
              { backgroundColor: colors.surfaceContainerLow },
            ]}>
            <View style={styles.connectivityLeft}>
              <View style={[styles.connDot, { backgroundColor: colors.secondary }]} />
              <Text numberOfLines={1} style={[styles.connText, { color: colors.onSurfaceVariant }]}>
                Đang kết nối 4G ổn định • Có dự phòng Bluetooth bờ ao
              </Text>
            </View>
            <MaterialIcons name="bluetooth-connected" size={20} color={colors.secondary} />
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
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  contextLeft: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  contextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  contextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  activePondsPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activePondsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  notiDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroCard: {
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
  heroOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  iotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  iotBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryCard: {
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  summarySub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  summaryItemLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  summaryItemVal: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  summaryItemUnit: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryItemTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  summaryItemTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
  },
  warningBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  warningBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  warningBannerTime: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningBannerTimeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pondCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pondCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pondsList: {
    gap: 12,
  },
  pondCard: {
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 6,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pondCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pondTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clickablePondTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pondName: {
    fontSize: 20,
    fontWeight: '900',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pondSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  feedStatBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  feedStatLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  feedStatVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  feedStatUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
  },
  metricBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricSubUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  pondStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pondStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pondStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextFeedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nextFeedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  feederBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  feederBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  feederTextBold: {
    fontSize: 11,
    fontWeight: '800',
  },
  feederTextSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  feederToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  feederToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  refillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  refillBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refillTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  refillSub: {
    fontSize: 10,
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  machineryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  machineryImgBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
  },
  machineryImg: {
    width: '100%',
    height: '100%',
  },
  machineryContent: {
    flex: 1,
    gap: 2,
  },
  machineryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  machineryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  machineryTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  machinerySub: {
    fontSize: 10,
    lineHeight: 14,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  emergencyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emergencySub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  connectivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  connectivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  connText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
