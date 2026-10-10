import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useFarm } from '@/context/farm-context';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ subtitle = 'Hệ Thống Bờ Ao' }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isOfflineMode, logout } = useAuth();
  const {
    farms,
    selectedFarm,
    ponds,
    selectedPond,
    selectFarm,
    selectPond,
    isLoadingPonds,
    refreshFarmsAndPonds,
    farmInfo,
  } = useFarm();

  const [showPondModal, setShowPondModal] = useState(false);
  const [showNotiModal, setShowNotiModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSelectPond = (pondId: string) => {
    selectPond(pondId);
    setShowPondModal(false);
  };

  const handleLogout = async () => {
    setShowProfileModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  // Tên hiển thị trên nút Pill ao nuôi
  const displayPondName =
    selectedPond?.name ||
    selectedPond?.code ||
    farmInfo.selectedPond ||
    'Chọn Ao Nuôi';

  return (
    <View
      style={[
        styles.headerOuter,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: '#EA580C',
        },
      ]}>
      <View style={styles.headerInner}>
        {/* Left: Brand Logo & Title */}
        <View style={styles.brandGroup}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="water-drop" size={20} color="#EA580C" />
          </View>
          <View>
            <Text style={styles.brandTitle}>ShrimpMate</Text>
            <Text numberOfLines={1} style={styles.brandSubtitle}>
              {selectedFarm?.name ? `${selectedFarm.name} • ${subtitle}` : subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightActions}>
          {/* Pond Selector Pill */}
          <Pressable
            onPress={() => setShowPondModal(true)}
            style={({ pressed }) => [
              styles.pondPill,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <View style={styles.onlineDot} />
            <Text numberOfLines={1} style={styles.pondPillText}>
              {displayPondName}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#FFFFFF" />
          </Pressable>

          {/* Notification Bell */}
          <Pressable
            onPress={() => setShowNotiModal(true)}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
            <View style={styles.notiBadge} />
          </Pressable>

          {/* User Profile Avatar */}
          <Pressable
            onPress={() => setShowProfileModal(true)}
            style={({ pressed }) => [
              styles.avatarBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <MaterialIcons name="person" size={20} color="#EA580C" />
          </Pressable>
        </View>
      </View>

      {/* MODAL 1: POND SELECTOR ĐỘNG */}
      <Modal
        visible={showPondModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPondModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPondModal(false)}>
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialIcons name="waves" size={22} color="#EA580C" />
                <Text style={styles.modalTitle}>CHỌN AO NUÔI QUẢN LÝ</Text>
              </View>
              <Pressable
                onPress={() => refreshFarmsAndPonds()}
                style={{ padding: 4, marginRight: 4 }}>
                <MaterialIcons name="refresh" size={20} color="#8C7164" />
              </Pressable>
              <Pressable
                onPress={() => setShowPondModal(false)}
                style={{ padding: 4 }}>
                <MaterialIcons name="close" size={20} color="#8C7164" />
              </Pressable>
            </View>

            {/* Farm Selector Tabs (nếu người nuôi có nhiều hơn 1 trang trại) */}
            {farms.length > 1 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionSubtitle}>TRANG TRẠI NUÔI</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {farms.map((f) => {
                    const isFarmSelected = selectedFarm?.id === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => selectFarm(f.id)}
                        style={[
                          styles.farmTab,
                          isFarmSelected && styles.farmTabActive,
                        ]}>
                        <MaterialIcons
                          name="location-on"
                          size={14}
                          color={isFarmSelected ? '#FFFFFF' : '#8C7164'}
                        />
                        <Text
                          style={[
                            styles.farmTabText,
                            isFarmSelected && styles.farmTabTextActive,
                          ]}>
                          {f.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Current Farm Info Banner */}
            {selectedFarm && (
              <View style={styles.currentFarmBanner}>
                <MaterialIcons name="home-work" size={16} color="#EA580C" />
                <Text numberOfLines={1} style={styles.currentFarmText}>
                  {selectedFarm.name} {selectedFarm.address ? `• ${selectedFarm.address}` : ''}
                </Text>
              </View>
            )}

            {/* Ponds List */}
            {isLoadingPonds ? (
              <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="hourglass-empty" size={24} color="#EA580C" />
                <Text style={{ fontSize: 13, color: '#584237', fontWeight: '600' }}>
                  Đang nạp danh sách ao nuôi...
                </Text>
              </View>
            ) : ponds.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="info-outline" size={26} color="#8C7164" />
                <Text style={{ fontSize: 13, color: '#584237', fontWeight: '700' }}>
                  Trang trại chưa có ao nuôi nào
                </Text>
                <Text style={{ fontSize: 11, color: '#8C7164' }}>
                  Vui lòng thêm ao nuôi mới trên hệ thống
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalList}>
                  {ponds.map((p) => {
                    const isSelected = selectedPond?.id === p.id;
                    const isMaintenance = p.status === 'maintenance';
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => handleSelectPond(p.id)}
                        style={[
                          styles.pondItem,
                          isSelected && styles.pondItemSelected,
                        ]}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.pondCodeBadge, isSelected && styles.pondCodeBadgeSelected]}>
                              <Text style={[styles.pondCodeBadgeText, isSelected && styles.pondCodeBadgeTextSelected]}>
                                {p.code}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.pondItemText,
                                isSelected && styles.pondItemTextSelected,
                              ]}>
                              {p.name}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            {!!p.areaM2 && (
                              <Text style={styles.pondAreaText}>
                                {p.areaM2.toLocaleString('vi-VN')} m²
                              </Text>
                            )}
                            <View
                              style={[
                                styles.statusPill,
                                isMaintenance ? styles.statusPillWarning : styles.statusPillActive,
                              ]}>
                              <View
                                style={[
                                  styles.statusDot,
                                  isMaintenance
                                    ? { backgroundColor: '#F97316' }
                                    : { backgroundColor: '#006E2D' },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusPillText,
                                  isMaintenance ? { color: '#9D4300' } : { color: '#006E2D' },
                                ]}>
                                {isMaintenance ? 'Bảo dưỡng' : 'Đang nuôi'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {isSelected && (
                          <View style={styles.selectedCheckCircle}>
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* MODAL 2: NOTIFICATIONS */}
      <Modal
        visible={showNotiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotiModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowNotiModal(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="notifications-active" size={22} color="#EA580C" />
              <Text style={styles.modalTitle}>THÔNG BÁO BỜ AO</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.notiCardAlert}>
                <MaterialIcons name="warning" size={20} color="#BA1A1A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notiAlertTitle}>Cảnh Báo Cám Sắp Hết</Text>
                  <Text style={styles.notiAlertBody}>
                    Ao 03: Thùng chứa Hopper chỉ còn dưới 15 kg cám. Vui lòng nạp thêm bao cám mới!
                  </Text>
                </View>
              </View>

              <View style={styles.notiCardInfo}>
                <MaterialIcons name="psychology" size={20} color="#F97316" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notiInfoTitle}>Khuyến Nghị Gemini AI</Text>
                  <Text style={styles.notiInfoBody}>
                    Đỉnh nắng trưa 32°C: Đề xuất tự động giảm 3kg cữ chiều để bảo vệ chất lượng đáy ao.
                  </Text>
                </View>
              </View>

              <View style={styles.notiCardSuccess}>
                <MaterialIcons name="check-circle" size={20} color="#006E2D" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notiSuccessTitle}>Trạm Quan Trắc Ba Tri</Text>
                  <Text style={styles.notiSuccessBody}>
                    Độ mặn 18‰ • Con nước lúc 16:30 (+1.8m) lấy nước vào vuông rất thuận lợi.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* MODAL 3: FARMER PROFILE */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowProfileModal(false)}>
          <View style={styles.modalCard}>
            <View style={styles.profileHead}>
              <View style={styles.profileAvatarBox}>
                <MaterialIcons name="person" size={32} color="#EA580C" />
              </View>
              <Text style={styles.farmerName}>{user?.fullName || farmInfo.farmerName}</Text>
              <Text style={styles.farmTitle}>
                {user?.email || user?.phoneNumber || farmInfo.farmName}
              </Text>
              <View style={styles.vietgapBadge}>
                <MaterialIcons name="verified" size={16} color="#006E2D" />
                <Text style={styles.vietgapText}>
                  {user?.role === 'admin'
                    ? 'Quản trị viên hệ thống'
                    : user?.role === 'farmer'
                    ? 'Chủ đầm / Người nuôi tôm'
                    : 'Chứng nhận VietGAP 2026'}
                </Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trang trại nuôi:</Text>
                <Text style={styles.detailVal}>{selectedFarm?.name || farmInfo.farmName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vị trí khu nuôi:</Text>
                <Text style={styles.detailVal}>{selectedFarm?.address || farmInfo.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Độ mặn trạm:</Text>
                <Text style={styles.detailVal}>{farmInfo.salinity}‰</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lịch con nước:</Text>
                <Text style={styles.detailVal}>{farmInfo.tideInfo}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trạng thái sóng:</Text>
                <Text
                  style={[
                    styles.detailVal,
                    { color: isOfflineMode ? '#8C7164' : '#006E2D' },
                  ]}>
                  {isOfflineMode ? 'Bờ ao ngoại tuyến' : 'Trực tuyến 4G/LoRa'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="logout" size={20} color="#BA1A1A" />
              <Text style={styles.logoutBtnText}>ĐĂNG XUẤT</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 50,
  },
  headerInner: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pondPill: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 140,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7FFC97',
  },
  pondPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BA1A1A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B1C30',
    letterSpacing: 0.5,
  },
  modalList: {
    gap: 8,
  },
  pondItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
  },
  pondItemSelected: {
    backgroundColor: '#FFDBCA',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  pondItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
  },
  pondItemTextSelected: {
    color: '#9D4300',
    fontWeight: '900',
  },
  notiCardAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
    marginBottom: 10,
  },
  notiAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#93000A',
  },
  notiAlertBody: {
    fontSize: 12,
    color: '#93000A',
    marginTop: 2,
  },
  notiCardInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFDBCA',
    marginBottom: 10,
  },
  notiInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9D4300',
  },
  notiInfoBody: {
    fontSize: 12,
    color: '#7A3200',
    marginTop: 2,
  },
  notiCardSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    marginBottom: 10,
  },
  notiSuccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006E2D',
  },
  notiSuccessBody: {
    fontSize: 12,
    color: '#005320',
    marginTop: 2,
  },
  profileHead: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF4FF',
  },
  profileAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFDBCA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1C30',
  },
  farmTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#584237',
    marginTop: 2,
  },
  vietgapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  vietgapText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006E2D',
  },
  profileDetails: {
    paddingVertical: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#584237',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B1C30',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#BA1A1A',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7164',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  farmTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#D4E3FF',
  },
  farmTabActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  farmTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  farmTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  currentFarmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 10,
  },
  currentFarmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
    flex: 1,
  },
  pondCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E0E7FF',
  },
  pondCodeBadgeSelected: {
    backgroundColor: '#EA580C',
  },
  pondCodeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3730A3',
  },
  pondCodeBadgeTextSelected: {
    color: '#FFFFFF',
  },
  pondAreaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#E8F5E9',
  },
  statusPillWarning: {
    backgroundColor: '#FFEDD5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  selectedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#006E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
