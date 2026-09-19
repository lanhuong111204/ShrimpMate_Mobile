import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useFarm } from '@/context/farm-context';

interface LocationInfo {
  label: string;
  station: string;
  salinity: number;
  tide: string;
}

const LOCATION_DATA: Record<string, LocationInfo> = {
  'ben-tre-ba-tri': {
    label: 'Bến Tre - Huyện Ba Tri',
    station: 'Trạm Ba Tri',
    salinity: 18,
    tide: 'Hôm nay: 16:30 (+1.8m) • Lấy nước tốt',
  },
  'tra-vinh-duyen-hai': {
    label: 'Trà Vinh - TX. Duyên Hải',
    station: 'Trạm Duyên Hải',
    salinity: 22,
    tide: 'Hôm nay: 17:15 (+1.9m) • Lấy nước tốt',
  },
  'soc-trang-tran-de': {
    label: 'Sóc Trăng - Huyện Trần Đề',
    station: 'Trạm Trần Đề',
    salinity: 16,
    tide: 'Hôm nay: 16:45 (+1.7m) • Lấy nước đạt',
  },
  'bac-lieu-gia-rai': {
    label: 'Bạc Liêu - TX. Giá Rai',
    station: 'Trạm Giá Rai',
    salinity: 20,
    tide: 'Hôm nay: 18:00 (+1.6m) • Nước ròng',
  },
  'ca-mau-dam-doi': {
    label: 'Cà Mau - Huyện Đầm Dơi',
    station: 'Trạm Đầm Dơi',
    salinity: 24,
    tide: 'Hôm nay: 17:50 (+1.85m) • Lấy nước tốt',
  },
};

export default function ScreenFarmSetup() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();
  const { farmInfo, updateFarmInfo } = useFarm();

  const [farmerName, setFarmerName] = useState(farmInfo.farmerName || 'Nguyễn Văn Ba');
  const [farmName, setFarmName] = useState(farmInfo.farmName || 'Trại Tôm Ba Đầm (Ao 02)');
  const [locationKey, setLocationKey] = useState<string>('ben-tre-ba-tri');
  const [scale, setScale] = useState<'1-3' | '4-8' | '8+'>(farmInfo.pondScale || '1-3');

  const currentLocation = LOCATION_DATA[locationKey] || LOCATION_DATA['ben-tre-ba-tri'];

  const handleSaveAndStart = () => {
    if (!farmerName.trim() || !farmName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chủ vuông và tên đầm tôm');
      return;
    }

    updateFarmInfo({
      farmerName: farmerName.trim(),
      farmName: farmName.trim(),
      location: currentLocation.label,
      salinity: currentLocation.salinity,
      tideInfo: currentLocation.tide,
      pondScale: scale,
    });

    Alert.alert(
      'Khởi Tạo Thành Công',
      `Đã lưu dữ liệu hồ sơ trại nuôi chuẩn VietGAP cho ${farmName}.\nBắt đầu giám sát và quản lý lịch cữ!`,
      [
        {
          text: 'VÀO BỜ AO NGAY',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      {/* Curved Header */}
      <View
        style={[
          styles.curvedHeader,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: '#EA580C',
          },
        ]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.stepBadge}>
            <MaterialIcons name="fact-check" size={14} color="#FFFFFF" />
            <Text style={styles.stepBadgeText}>BƯỚC 2/2: HỒ SƠ TRẠI</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.headerTitle}>Thiết Lập Trang Trại</Text>
        <Text style={styles.headerSub}>
          Đồng bộ trạm quan trắc thủy văn và lịch con nước ĐBSCL
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Card 1: Farmer & Farm Name */}
          <View
            style={[
              styles.cardSection,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="badge" size={20} color="#F97316" />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                THÔNG TIN CHỦ VUÔNG & TRẠI
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ tên chủ vuông / người quản lý:</Text>
              <TextInput
                style={[styles.textInput, { color: colors.onSurface }]}
                value={farmerName}
                onChangeText={setFarmerName}
                placeholder="Ví dụ: Nguyễn Văn Ba"
                placeholderTextColor="#8C7164"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên đầm tôm / khu nuôi:</Text>
              <TextInput
                style={[styles.textInput, { color: colors.onSurface }]}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="Ví dụ: Trại Tôm Ba Đầm (Ao 02)"
                placeholderTextColor="#8C7164"
              />
            </View>
          </View>

          {/* Card 2: Region & Monitoring Station */}
          <View
            style={[
              styles.cardSection,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="location-on" size={20} color="#006398" />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                TRẠM QUAN TRẮC ĐỊA PHƯƠNG
              </Text>
            </View>
            <Text style={styles.hintText}>
              Chọn khu vực để tự động lấy độ mặn và lịch con nước thủy triều:
            </Text>

            <View style={styles.locationsGrid}>
              {Object.entries(LOCATION_DATA).map(([key, loc]) => {
                const isSelected = locationKey === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setLocationKey(key)}
                    style={[
                      styles.locItem,
                      isSelected && styles.locItemSelected,
                    ]}>
                    <Text
                      style={[
                        styles.locItemText,
                        isSelected && styles.locItemTextSelected,
                      ]}>
                      {loc.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={16} color="#9D4300" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Live Station Data Box */}
            <View style={styles.stationDataBox}>
              <View style={styles.stationTopRow}>
                <View style={styles.dotPulse} />
                <Text style={styles.stationName}>
                  Dữ liệu trực tiếp: {currentLocation.station}
                </Text>
              </View>
              <View style={styles.stationMetricsRow}>
                <View style={styles.stationMetricItem}>
                  <Text style={styles.stationMetricLabel}>Độ mặn trạm:</Text>
                  <Text style={styles.stationMetricVal}>{currentLocation.salinity}‰</Text>
                </View>
                <View style={styles.stationMetricItem}>
                  <Text style={styles.stationMetricLabel}>Thủy triều:</Text>
                  <Text style={styles.stationMetricValSmall}>{currentLocation.tide}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 3: Scale */}
          <View
            style={[
              styles.cardSection,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' },
            ]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="grid-view" size={20} color="#006E2D" />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                QUY MÔ VUÔNG NUÔI
              </Text>
            </View>

            <View style={styles.scaleButtonsRow}>
              {(['1-3', '4-8', '8+'] as const).map((s) => {
                const isSelected = scale === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setScale(s)}
                    style={[
                      styles.scaleBtn,
                      isSelected && styles.scaleBtnSelected,
                    ]}>
                    <Text
                      style={[
                        styles.scaleBtnText,
                        isSelected && styles.scaleBtnTextSelected,
                      ]}>
                      {s} Ao Nuôi
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save & Start Button */}
          <Pressable
            onPress={handleSaveAndStart}
            style={({ pressed }) => [
              styles.btnStart,
              { opacity: pressed ? 0.9 : 1 },
            ]}>
            <MaterialIcons name="rocket-launch" size={22} color="#FFFFFF" />
            <Text style={styles.btnStartText}>LƯU & BẮT ĐẦU VỤ NUÔI</Text>
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
  curvedHeader: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 16,
    paddingBottom: 22,
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  container: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  cardSection: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  hintText: {
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
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0C0B1',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: '#EFF4FF',
  },
  locationsGrid: {
    gap: 6,
  },
  locItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
  },
  locItemSelected: {
    backgroundColor: '#FFDBCA',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  locItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B1C30',
  },
  locItemTextSelected: {
    color: '#9D4300',
    fontWeight: '900',
  },
  stationDataBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E5EEFF',
    gap: 6,
    marginTop: 4,
  },
  stationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006E2D',
  },
  stationName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006E2D',
  },
  stationMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationMetricItem: {
    flex: 1,
  },
  stationMetricLabel: {
    fontSize: 10,
    color: '#584237',
  },
  stationMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#006398',
  },
  stationMetricValSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B1C30',
  },
  scaleButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleBtnSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#006E2D',
  },
  scaleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#584237',
  },
  scaleBtnTextSelected: {
    color: '#006E2D',
    fontWeight: '900',
  },
  btnStart: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  btnStartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
