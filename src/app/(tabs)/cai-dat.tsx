import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { AppHeader } from '@/components/common/app-header';
import { useFarm, InventoryItem } from '@/context/farm-context';
import { useAuth } from '@/context/auth-context';

export default function ScreenSettings() {
  const colors = useTheme();
  const router = useRouter();
  const { user, refreshUserProfile, changePassword, updateProfile, logout } = useAuth();
  const { farmInfo, inventory, dispenseFeedBag, addInventoryItem, hopperKg } = useFarm();

  // Active segment: 'account' (Tài khoản & Bảo mật) | 'supplies' (Kho vật tư)
  const [activeSegment, setActiveSegment] = useState<'account' | 'supplies'>('account');
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  // Edit profile modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password modal state
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Auto-refresh user profile on mount
  useEffect(() => {
    refreshUserProfile();
  }, []);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên hệ thống';
      case 'farmer':
        return 'Chủ đầm / Người nuôi tôm';
      case 'operator':
      case 'technician':
        return 'Chủ đầm / Người nuôi tôm';
      case 'guest_offline':
        return 'Bà con xem ngoại tuyến';
      default:
        return 'Chủ đầm / Người nuôi tôm';
    }
  };

  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true);
    try {
      await refreshUserProfile();
    } catch (err: any) {
      console.warn('Lỗi đồng bộ hồ sơ người dùng:', err?.message);
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditFullName(user?.fullName || farmInfo.farmerName || '');
    setEditPhoneNumber(user?.phoneNumber || user?.phone || '');
    setEditProfileError(null);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setEditProfileError(null);
    const trimmedName = editFullName.trim();
    const trimmedPhone = editPhoneNumber.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setEditProfileError('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }
    if (trimmedName.length > 150) {
      setEditProfileError('Họ và tên tối đa 150 ký tự');
      return;
    }

    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)[0-9]{9}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setEditProfileError('Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0912345678)');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: trimmedName,
        phoneNumber: trimmedPhone || undefined,
      });
      setShowEditProfileModal(false);
      Alert.alert('Thành Công! 🎉', 'Đã cập nhật thông tin tài khoản thành công.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể cập nhật hồ sơ lúc này';
      setEditProfileError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setChangePassError(null);
    if (!currentPassword) {
      setChangePassError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setChangePassError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePassError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (currentPassword === newPassword) {
      setChangePassError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    setIsChangingPass(true);
    try {
      const resMsg = await changePassword({
        currentPassword,
        newPassword,
      });
      setShowChangePassModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert(
        'Đổi Mật Khẩu Thành Công! 🔐',
        resMsg || 'Đổi mật khẩu thành công, vui lòng đăng nhập lại để đảm bảo an toàn.',
        [
          {
            text: 'Đăng Nhập Lại',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (err: any) {
      setChangePassError(
        err?.message || 'Mật khẩu hiện tại không đúng hoặc máy chủ không phản hồi'
      );
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất Tài Khoản',
      'Bà con có chắc chắn muốn đăng xuất tài khoản kỹ sư khỏi thiết bị này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // Supplies inventory states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState('Bao 25kg');
  const [newSubtitle, setNewSubtitle] = useState('Thức ăn nuôi tôm');
  const [newCount, setNewCount] = useState('20');
  const [newCategory, setNewCategory] = useState<InventoryItem['category']>('feed');

  const mainFeed = inventory.find((i) => i.id === 'feed-1');

  const filteredItems = inventory.filter((item) => {
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.spec.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleQuickDispense = () => {
    if (!mainFeed || mainFeed.stockCount <= 0) {
      Alert.alert('Cảnh Báo', 'Hết cám số 2 trong kho! Vui lòng nhập thêm bao cám mới.');
      return;
    }
    dispenseFeedBag('feed-1', 25);
  };

  const handleAddNewItem = () => {
    const countNum = parseInt(newCount, 10);
    if (!newName.trim() || isNaN(countNum) || countNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng điền tên vật tư và số lượng hợp lệ');
      return;
    }

    addInventoryItem({
      name: newName.trim(),
      category: newCategory,
      spec: newSpec,
      subtitle: newSubtitle,
      stockCount: countNum,
      unit: newCategory === 'feed' || newCategory === 'water' ? 'bao' : 'can',
      totalKgOrL: countNum * 25,
      stockStatus: countNum > 10 ? 'good' : 'low',
    });

    setNewName('');
    setShowAddModal(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <AppHeader subtitle="Cài Đặt & Tài Khoản" />

      {/* Segmented Tab Switcher */}
      <View style={styles.segmentWrapper}>
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceContainerLow }]}>
          <Pressable
            onPress={() => setActiveSegment('account')}
            style={[
              styles.segmentBtn,
              activeSegment === 'account' && styles.segmentBtnActive,
            ]}>
            <MaterialIcons
              name="person"
              size={18}
              color={activeSegment === 'account' ? '#EA580C' : '#8C7164'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'account' && styles.segmentBtnTextActive,
              ]}>
              Tài Khoản & Bảo Mật
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('supplies')}
            style={[
              styles.segmentBtn,
              activeSegment === 'supplies' && styles.segmentBtnActive,
            ]}>
            <MaterialIcons
              name="inventory-2"
              size={18}
              color={activeSegment === 'supplies' ? '#EA580C' : '#8C7164'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'supplies' && styles.segmentBtnTextActive,
              ]}>
              Kho Vật Tư Bờ Ao
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProfile}
            onRefresh={handleRefreshProfile}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }>
        <View style={styles.container}>
          {activeSegment === 'account' ? (
            /* ==================================================== */
            /* SEGMENT 1: TÀI KHOẢN & BẢO MẬT                        */
            /* ==================================================== */
            <View style={styles.accountSection}>
              {/* Profile Card */}
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderColor: colors.outlineVariant + '40',
                  },
                ]}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatarBox}>
                    <MaterialIcons name="agriculture" size={36} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, { color: colors.onSurface }]}>
                      {user?.fullName || farmInfo.farmerName}
                    </Text>
                    <View style={styles.roleBadge}>
                      <MaterialIcons name="badge" size={14} color="#006E2D" />
                      <Text style={styles.roleBadgeText}>{getRoleLabel(user?.role)}</Text>
                    </View>
                  </View>
                  {/* Subtle Sync Icon Button */}
                  <Pressable
                    onPress={handleRefreshProfile}
                    disabled={isRefreshingProfile}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.btnIconSync,
                      { opacity: pressed || isRefreshingProfile ? 0.6 : 1 },
                    ]}>
                    {isRefreshingProfile ? (
                      <ActivityIndicator size="small" color="#EA580C" />
                    ) : (
                      <MaterialIcons name="sync" size={20} color="#8C7164" />
                    )}
                  </Pressable>
                </View>

                {/* Profile Details Grid */}
                <View style={[styles.profileGrid, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelGroup}>
                      <MaterialIcons name="phone" size={16} color="#8C7164" />
                      <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>
                      {user?.phoneNumber || user?.phone || 'Chưa cập nhật'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelGroup}>
                      <MaterialIcons name="mail" size={16} color="#8C7164" />
                      <Text style={styles.detailLabel}>Địa chỉ Email:</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>
                      {user?.email || 'Chưa cập nhật'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelGroup}>
                      <MaterialIcons name="check-circle" size={16} color="#006E2D" />
                      <Text style={styles.detailLabel}>Trạng thái:</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusPillText}>
                        {user?.isActive !== false ? 'Đang hoạt động' : 'Tạm khóa'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Edit Profile Action Button */}
                <Pressable
                  onPress={handleOpenEditProfile}
                  style={({ pressed }) => [
                    styles.btnEditProfile,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <MaterialIcons name="edit" size={16} color="#EA580C" />
                  <Text style={styles.btnEditProfileText}>CHỈNH SỬA THÔNG TIN CÁ NHÂN</Text>
                </Pressable>
              </View>

              {/* Security & Change Password Card */}
              <View
                style={[
                  styles.securityCard,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderColor: colors.outlineVariant + '40',
                  },
                ]}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="lock-reset" size={22} color="#EA580C" />
                  <Text style={[styles.cardTitleText, { color: colors.onSurface }]}>
                    BẢO MẬT & ĐỔI MẬT KHẨU
                  </Text>
                </View>
                <Text style={styles.cardDescText}>
                  Đổi mật khẩu định kỳ giúp bảo vệ quyền điều khiển thiết bị máy ăn, cảm biến ao nuôi và an toàn dữ liệu vụ nuôi.
                </Text>

                <Pressable
                  onPress={() => {
                    setChangePassError(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setShowChangePassModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.btnOpenChangePass,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <MaterialIcons name="password" size={20} color="#FFFFFF" />
                  <Text style={styles.btnOpenChangePassText}>ĐỔI MẬT KHẨU KỸ SƯ</Text>
                </Pressable>
              </View>

              {/* Farm Context & Station Information */}
              <View
                style={[
                  styles.farmInfoCard,
                  {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderColor: colors.outlineVariant + '40',
                  },
                ]}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="water" size={22} color="#006398" />
                  <Text style={[styles.cardTitleText, { color: colors.onSurface }]}>
                    THÔNG TIN TRANG TRẠI LIÊN KẾT
                  </Text>
                </View>
                <View style={styles.farmDetailsGrid}>
                  <View style={styles.farmRow}>
                    <Text style={styles.farmLabel}>Trang trại:</Text>
                    <Text style={styles.farmVal}>{farmInfo.farmName}</Text>
                  </View>
                  <View style={styles.farmRow}>
                    <Text style={styles.farmLabel}>Khu vực nuôi:</Text>
                    <Text style={styles.farmVal}>{farmInfo.location}</Text>
                  </View>
                  <View style={styles.farmRow}>
                    <Text style={styles.farmLabel}>Độ mặn trạm:</Text>
                    <Text style={[styles.farmVal, { color: '#006E2D', fontWeight: '900' }]}>
                      {farmInfo.salinity}‰ (Đạt chuẩn)
                    </Text>
                  </View>
                  <View style={styles.farmRow}>
                    <Text style={styles.farmLabel}>Lịch con nước:</Text>
                    <Text style={styles.farmVal}>{farmInfo.tideInfo}</Text>
                  </View>
                  <View style={styles.farmRow}>
                    <Text style={styles.farmLabel}>Chứng nhận:</Text>
                    <Text style={[styles.farmVal, { color: '#006E2D', fontWeight: '800' }]}>
                      VietGAP Aquaculture 2026
                    </Text>
                  </View>
                </View>
              </View>

              {/* Logout Button */}
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.btnLogout,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <MaterialIcons name="logout" size={22} color="#BA1A1A" />
                <Text style={styles.btnLogoutText}>ĐĂNG XUẤT KHỎI HỆ THỐNG</Text>
              </Pressable>

              <Text style={styles.versionText}>ShrimpMate Mobile v1.0.0 • Expo SDK 57</Text>
            </View>
          ) : (
            /* ==================================================== */
            /* SEGMENT 2: KHO HÀNG VẬT TƯ (Feed, Probiotics, Minerals) */
            /* ==================================================== */
            <View style={styles.suppliesSection}>
              {/* Top Filter Chips & Add Button */}
              <View style={styles.filterTopRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}>
              <Pressable
                onPress={() => setSelectedCategory('all')}
                style={[
                  styles.filterChip,
                  selectedCategory === 'all' && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === 'all' && styles.filterChipTextActive,
                  ]}>
                  Tất Cả
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedCategory('feed')}
                style={[
                  styles.filterChip,
                  selectedCategory === 'feed' && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === 'feed' && styles.filterChipTextActive,
                  ]}>
                  Cám Cho Ăn
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedCategory('probiotics')}
                style={[
                  styles.filterChip,
                  selectedCategory === 'probiotics' && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === 'probiotics' && styles.filterChipTextActive,
                  ]}>
                  Men Vi Sinh
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedCategory('water')}
                style={[
                  styles.filterChip,
                  selectedCategory === 'water' && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === 'water' && styles.filterChipTextActive,
                  ]}>
                  Khoáng Tạt
                </Text>
              </Pressable>
            </ScrollView>

            <Pressable
              onPress={() => setShowAddModal(true)}
              style={({ pressed }) => [
                styles.btnAddSupply,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* High-visibility Sunlight Search Bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <MaterialIcons name="search" size={22} color="#8C7164" />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder="Tìm kiếm bao cám, vi sinh BZT, khoáng..."
              placeholderTextColor="#8C7164"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {!!searchTerm && (
              <Pressable onPress={() => setSearchTerm('')}>
                <MaterialIcons name="cancel" size={18} color="#8C7164" />
              </Pressable>
            )}
          </View>

          {/* Hero Action: Quick Feed Dispense into Hopper */}
          {mainFeed && (
            <View
              style={[
                styles.dispenseCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: '#F97316',
                },
              ]}>
              <View style={styles.dispenseHeader}>
                <View style={styles.dispenseBadge}>
                  <MaterialIcons name="bolt" size={16} color="#9D4300" />
                  <Text style={styles.dispenseBadgeText}>NẠP NHANH BỜ AO</Text>
                </View>
                <Text style={styles.hopperStatusText}>
                  Thùng máy hiện có: <Text style={{ fontWeight: '900', color: '#F97316' }}>{hopperKg} kg</Text>
                </Text>
              </View>

              <View style={styles.dispenseBody}>
                <View style={styles.feedIconSquare}>
                  <MaterialIcons name="inventory-2" size={24} color="#9D4300" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dispenseTitle, { color: colors.onSurface }]}>
                    {mainFeed.name}
                  </Text>
                  <Text style={styles.dispenseSub}>{mainFeed.spec}</Text>
                  <Text style={styles.dispenseStock}>
                    Kho còn:{' '}
                    <Text style={{ fontWeight: '900', color: '#006E2D' }}>
                      {mainFeed.stockCount} {mainFeed.unit}
                    </Text>{' '}
                    ({mainFeed.totalKgOrL} kg)
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleQuickDispense}
                style={({ pressed }) => [
                  styles.btnQuickDispense,
                  { opacity: pressed ? 0.9 : 1 },
                ]}>
                <MaterialIcons name="file-upload" size={22} color="#FFFFFF" />
                <Text style={styles.btnQuickDispenseText}>
                  XUẤT 1 BAO VÀO MÁY ĂN (NẠP 25KG)
                </Text>
              </Pressable>
            </View>
          )}

          {/* Inventory Items List */}
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              DANH MỤC VẬT TƯ TRANG TRẠI ({filteredItems.length})
            </Text>
          </View>

          <View style={styles.inventoryList}>
            {filteredItems.map((item) => {
              const isLow = item.stockStatus === 'low';
              const isFeed = item.category === 'feed';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.surfaceContainerLowest,
                      borderColor: isLow ? '#FFDAD6' : colors.outlineVariant + '40',
                    },
                  ]}>
                  <View style={styles.itemCardLeft}>
                    <View
                      style={[
                        styles.categoryIconCircle,
                        {
                          backgroundColor: isFeed
                            ? '#FFDBCA'
                            : item.category === 'water'
                            ? '#CCE5FF'
                            : '#E8F5E9',
                        },
                      ]}>
                      <MaterialIcons
                        name={
                          isFeed
                            ? 'inventory-2'
                            : item.category === 'water'
                            ? 'science'
                            : 'medication'
                        }
                        size={20}
                        color={
                          isFeed
                            ? '#9D4300'
                            : item.category === 'water'
                            ? '#006398'
                            : '#006E2D'
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.onSurface }]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemSpec}>{item.spec}</Text>
                      <Text style={styles.itemSub}>{item.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.itemCardRight}>
                    <View
                      style={[
                        styles.stockBadge,
                        { backgroundColor: isLow ? '#FFDAD6' : '#E8F5E9' },
                      ]}>
                      <Text
                        style={[
                          styles.stockBadgeText,
                          { color: isLow ? '#BA1A1A' : '#006E2D' },
                        ]}>
                        {isLow ? 'SẮP HẾT' : 'ĐỦ DÙNG'}
                      </Text>
                    </View>
                    <Text style={[styles.stockCountVal, { color: colors.onSurface }]}>
                      {item.stockCount}{' '}
                      <Text style={{ fontSize: 11, fontWeight: '600' }}>{item.unit}</Text>
                    </Text>
                    {item.totalKgOrL !== undefined && (
                      <Text style={styles.stockTotalVal}>{item.totalKgOrL} kg</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
        </View>
      </ScrollView>

      {/* ==================================================== */}
      {/* MODAL: CHỈNH SỬA HỒ SƠ (PATCH /auth/profile)          */}
      {/* ==================================================== */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowEditProfileModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialIcons name="person" size={24} color="#EA580C" />
                <Text style={styles.modalHeading}>CẬP NHẬT THÔNG TIN CÁ NHÂN</Text>
              </View>
              <Pressable
                onPress={() => setShowEditProfileModal(false)}
                style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#8C7164" />
              </Pressable>
            </View>

            {/* Input 1: Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HỌ VÀ TÊN *</Text>
              <TextInput
                style={styles.textInput}
                value={editFullName}
                onChangeText={(val) => {
                  setEditFullName(val);
                  setEditProfileError(null);
                }}
                placeholder="Nhập họ và tên..."
                placeholderTextColor="#8C7164"
              />
            </View>

            {/* Input 2: Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI LIÊN HỆ *</Text>
              <TextInput
                style={styles.textInput}
                value={editPhoneNumber}
                onChangeText={(val) => {
                  setEditPhoneNumber(val);
                  setEditProfileError(null);
                }}
                keyboardType="phone-pad"
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor="#8C7164"
              />
            </View>

            {/* Field 3: Email (Readonly / Fixed) */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL</Text>
                <View style={styles.lockedBadge}>
                  <MaterialIcons name="lock" size={12} color="#8C7164" />
                  <Text style={styles.lockedBadgeText}>Cố định</Text>
                </View>
              </View>
              <View style={styles.disabledInputRow}>
                <MaterialIcons name="mail-outline" size={18} color="#8C7164" />
                <Text style={styles.disabledInputText}>{user?.email || 'Chưa cập nhật'}</Text>
              </View>
              <Text style={styles.fieldNoteText}>
                * Email dùng làm định danh đăng nhập & nhận mã OTP bảo mật.
              </Text>
            </View>

            {/* Field 4: Role (Readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VAI TRÒ TRANG TRẠI</Text>
              <View style={styles.disabledInputRow}>
                <MaterialIcons name="badge" size={18} color="#006E2D" />
                <Text style={[styles.disabledInputText, { color: '#006E2D', fontWeight: '800' }]}>
                  {getRoleLabel(user?.role)}
                </Text>
              </View>
            </View>

            {/* Error Message */}
            {editProfileError && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={16} color="#BA1A1A" />
                <Text style={styles.errorText}>{editProfileError}</Text>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.btnCancel}
                onPress={() => setShowEditProfileModal(false)}>
                <Text style={styles.btnCancelText}>HỦY</Text>
              </Pressable>
              <Pressable
                style={[styles.btnConfirmChange, isSavingProfile && { opacity: 0.7 }]}
                disabled={isSavingProfile}
                onPress={handleSaveProfile}>
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnConfirmChangeText}>LƯU THAY ĐỔI</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: ĐỔI MẬT KHẨU (PATCH /auth/change-password)     */}
      {/* ==================================================== */}
      <Modal
        visible={showChangePassModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePassModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowChangePassModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialIcons name="lock" size={24} color="#EA580C" />
                <Text style={styles.modalHeading}>ĐỔI MẬT KHẨU KỸ SƯ</Text>
              </View>
              <Pressable
                onPress={() => setShowChangePassModal(false)}
                style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#8C7164" />
              </Pressable>
            </View>

            {/* Input 1: Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU HIỆN TẠI *</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInputField}
                  value={currentPassword}
                  onChangeText={(val) => {
                    setCurrentPassword(val);
                    setChangePassError(null);
                  }}
                  secureTextEntry={!showCurrentPass}
                  placeholder="Nhập mật khẩu đang dùng..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowCurrentPass(!showCurrentPass)}
                  style={{ padding: 6 }}>
                  <MaterialIcons
                    name={showCurrentPass ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Input 2: New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU MỚI (TỐI THIỂU 8 KÝ TỰ) *</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInputField}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    setChangePassError(null);
                  }}
                  secureTextEntry={!showNewPass}
                  placeholder="Nhập mật khẩu mới..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowNewPass(!showNewPass)}
                  style={{ padding: 6 }}>
                  <MaterialIcons
                    name={showNewPass ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Input 3: Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU MỚI *</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInputField}
                  value={confirmNewPassword}
                  onChangeText={(val) => {
                    setConfirmNewPassword(val);
                    setChangePassError(null);
                  }}
                  secureTextEntry={!showConfirmNewPass}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowConfirmNewPass(!showConfirmNewPass)}
                  style={{ padding: 6 }}>
                  <MaterialIcons
                    name={showConfirmNewPass ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Banner */}
            {changePassError && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={18} color="#BA1A1A" />
                <Text style={styles.errorText}>{changePassError}</Text>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowChangePassModal(false)}
                style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleChangePassword}
                disabled={isChangingPass}
                style={({ pressed }) => [
                  styles.btnConfirmChange,
                  { opacity: pressed || isChangingPass ? 0.85 : 1 },
                ]}>
                {isChangingPass ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnConfirmChangeText}>CẬP NHẬT</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Thêm Vật Tư Mới */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowAddModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>NHẬP VẬT TƯ MỚI VÀO KHO</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên vật tư / nhãn hiệu:</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Ví dụ: Cám số 3 Grobest"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quy cách đóng gói:</Text>
              <TextInput
                style={styles.textInput}
                value={newSpec}
                onChangeText={setNewSpec}
                placeholder="Ví dụ: Bao 25kg"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số lượng nhập kho:</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={newCount}
                onChangeText={setNewCount}
                placeholder="Ví dụ: 20"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNewItem}
                style={styles.btnConfirm}>
                <Text style={styles.btnConfirmText}>Lưu Kho</Text>
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
  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFF4FF',
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#FFDBCA',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  filterChipTextActive: {
    color: '#9D4300',
    fontWeight: '900',
  },
  btnAddSupply: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  searchBar: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  dispenseCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dispenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFDBCA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dispenseBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9D4300',
  },
  hopperStatusText: {
    fontSize: 11,
    color: '#584237',
    fontWeight: '600',
  },
  dispenseBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedIconSquare: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFDBCA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispenseTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  dispenseSub: {
    fontSize: 12,
    color: '#584237',
    marginTop: 1,
  },
  dispenseStock: {
    fontSize: 11,
    color: '#584237',
    marginTop: 2,
  },
  btnQuickDispense: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnQuickDispenseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  inventoryList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemSpec: {
    fontSize: 11,
    color: '#584237',
    marginTop: 1,
  },
  itemSub: {
    fontSize: 10,
    color: '#8C7164',
    marginTop: 1,
  },
  itemCardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  stockCountVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  stockTotalVal: {
    fontSize: 10,
    color: '#8C7164',
    fontWeight: '600',
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
  segmentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#D0D8E8',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7164',
  },
  segmentBtnTextActive: {
    color: '#EA580C',
    fontWeight: '900',
  },
  accountSection: {
    gap: 14,
  },
  profileCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE8D6',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#DDF5E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006E2D',
  },
  profileGrid: {
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E8F5',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#584237',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DDF5E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006E2D',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006E2D',
  },
  btnIconSync: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4FF',
  },
  securityCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cardDescText: {
    fontSize: 11,
    color: '#8C7164',
    lineHeight: 16,
  },
  btnOpenChangePass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    marginTop: 4,
    elevation: 2,
  },
  btnOpenChangePassText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  farmInfoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  farmDetailsGrid: {
    gap: 8,
  },
  farmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  farmLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#584237',
  },
  farmVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B1C30',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFEDEC',
    borderWidth: 1.5,
    borderColor: '#F8B4B4',
    marginTop: 6,
  },
  btnLogoutText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#BA1A1A',
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#8C7164',
    marginTop: 4,
  },
  suppliesSection: {
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D0D8E8',
    paddingHorizontal: 12,
    backgroundColor: '#EFF4FF',
  },
  passInputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEDEC',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#BA1A1A',
  },
  btnConfirmChange: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#006E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmChangeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  btnEditProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFE8D6',
    borderWidth: 1.5,
    borderColor: '#F97316' + '60',
  },
  btnEditProfileText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.3,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  disabledInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
  },
  disabledInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  fieldNoteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C7164',
    marginTop: 2,
  },
});
