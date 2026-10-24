import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function ScreenRegisterGuide() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();

  const handleCallHotline = () => {
    Alert.alert(
      'Tổng Đài Hỗ Trợ Kỹ Sư 24/7',
      'Đang kết nối tới tổng đài hỗ trợ tài khoản và kết nối ao nuôi ShrimpMate: 1800 6868 (Miễn hoàn toàn cước gọi)',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi 1800 6868',
          onPress: () => {
            Linking.openURL('tel:18006868').catch(() => {
              Alert.alert('Thông Báo', 'Không thể tự động quay số trên thiết bị này. Vui lòng gọi 1800 6868.');
            });
          },
        },
      ]
    );
  };

  const handleOpenManagerWeb = () => {
    Alert.alert(
      'Hệ Thống Quản Lý Trang Trại (Manager Web)',
      'Hệ thống Web dành riêng cho Chủ đầm / Quản lý trang trại để đăng ký tài khoản mới, tạo danh sách ao nuôi và phân công kỹ thuật viên.',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Tìm Hiểu Thêm',
          onPress: () => {
            Alert.alert(
              'Cổng Quản Lý Web',
              'Vui lòng truy cập trên trình duyệt máy tính theo địa chỉ cổng Quản lý đầm tôm của trang trại bạn.'
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header Brand Bar */}
          <View style={styles.brandBar}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [
                styles.btnBack,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant + '40',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
            </Pressable>

            <View style={styles.brandCenter}>
              <View style={styles.logoBox}>
                <MaterialIcons name="water-drop" size={22} color="#EA580C" />
              </View>
              <Text style={[styles.brandName, { color: colors.onSurface }]}>ShrimpMate</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Hero Banner */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: '#FFDCC2',
              },
            ]}>
            <View style={styles.heroAvatar}>
              <MaterialIcons name="badge" size={32} color="#EA580C" />
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, { color: '#9A3412' }]}>
                CẤP PHÁT TÀI KHOẢN BỜ AO
              </Text>
              <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>
                Ứng dụng di động ShrimpMate Mobile dành riêng cho Người nuôi & Kỹ thuật viên vận hành ao nuôi (Farmer)
              </Text>
            </View>
          </View>

          {/* RBAC Policy Notice Card */}
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: '#EFF6FF',
                borderColor: '#BFDBFE',
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="verified-user" size={20} color="#1D4ED8" />
              <Text style={styles.noticeHeading}>Quy Định An Toàn Sinh Học & Phân Quyền</Text>
            </View>
            <Text style={styles.noticeBody}>
              Để đảm bảo bảo mật dữ liệu vuông tôm và ngăn ngừa sai lệch cữ ăn,{' '}
              <Text style={{ fontWeight: '800', color: '#1E40AF' }}>
                Người nuôi không tự đăng ký tài khoản tự do trên điện thoại
              </Text>
              . Toàn bộ tài khoản Người nuôi được Quản lý đầm (Manager) tạo và phân công ao nuôi cụ thể.
            </Text>
          </View>

          {/* 3 Steps Guide Section */}
          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              3 BƯỚC NHẬN TÀI KHOẢN VẬN HÀNH
            </Text>

            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#EA580C' }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                  Liên hệ Quản lý trang trại của bạn
                </Text>
                <Text style={[styles.stepDesc, { color: colors.onSurfaceVariant }]}>
                  Chủ đầm hoặc Kỹ sư quản lý (Manager) sẽ tạo hồ sơ của bạn trên hệ thống Quản lý Web và gán các ao nuôi bạn trực tiếp phụ trách.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#0284C7' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                  Nhận thông tin đăng nhập tạm thời
                </Text>
                <Text style={[styles.stepDesc, { color: colors.onSurfaceVariant }]}>
                  Quản lý sẽ bàn giao Email hoặc Số điện thoại đăng nhập kèm mật khẩu khởi tạo ban đầu cho bạn.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                  Đăng nhập & Đổi mật khẩu cá nhân
                </Text>
                <Text style={[styles.stepDesc, { color: colors.onSurfaceVariant }]}>
                  Đăng nhập vào ứng dụng di động này. Hệ thống sẽ tự động yêu cầu bạn thiết lập mật khẩu bảo mật mới trong lần đầu tiên để kích hoạt tài khoản.
                </Text>
              </View>
            </View>
          </View>

          {/* For Farm Managers Card */}
          <View
            style={[
              styles.managerCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.managerIconBox}>
                <MaterialIcons name="business" size={24} color="#0058BE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.managerCardTitle, { color: colors.onSurface }]}>
                  Bạn là Chủ đầm / Quản lý trang trại?
                </Text>
                <Text style={[styles.managerCardSub, { color: colors.onSurfaceVariant }]}>
                  Đăng ký tài khoản Quản lý & thiết lập vuông tôm trên Web
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleOpenManagerWeb}
              style={({ pressed }) => [
                styles.btnManagerWeb,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="open-in-browser" size={18} color="#0058BE" />
              <Text style={styles.btnManagerWebText}>HƯỚNG DẪN DÀNH CHO QUẢN LÝ</Text>
            </Pressable>
          </View>

          {/* Hotline Support Card */}
          <View
            style={[
              styles.hotlineCard,
              {
                backgroundColor: colors.inverseSurface,
              },
            ]}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.hotlineTagRow}>
                <View style={[styles.signalDot, { backgroundColor: colors.secondaryFixed }]} />
                <Text style={[styles.hotlineTag, { color: colors.inverseOnSurface }]}>
                  TỔNG ĐÀI TRỢ GIÚP 24/7
                </Text>
              </View>
              <Text style={[styles.hotlineTitle, { color: colors.inverseOnSurface }]}>
                Cần hỗ trợ nhận tài khoản ao nuôi?
              </Text>
              <Text style={[styles.hotlineSub, { color: colors.primaryFixed }]}>
                Kỹ sư ShrimpMate túc trực miễn cước gọi
              </Text>
            </View>

            <Pressable
              onPress={handleCallHotline}
              style={({ pressed }) => [
                styles.hotlineCallBtn,
                { backgroundColor: colors.secondaryFixed, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialIcons name="call" size={18} color={colors.onSecondaryFixed} />
              <Text style={[styles.hotlineCallNum, { color: colors.onSecondaryFixed }]}>
                1800 6868
              </Text>
            </Pressable>
          </View>

          {/* Primary CTA Buttons */}
          <View style={{ gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: '#EA580C', opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="login" size={20} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>ĐÃ CÓ TÀI KHOẢN • ĐĂNG NHẬP NGAY</Text>
            </Pressable>

            <Pressable
              onPress={handleCallHotline}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant + '60',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <MaterialIcons name="support-agent" size={20} color="#EA580C" />
              <Text style={[styles.btnSecondaryText, { color: '#EA580C' }]}>
                GỌI TỔNG ĐÀI HỖ TRỢ MIỄN PHÍ
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            Hệ thống Quản lý Bờ ao Thông minh ShrimpMate • Chuẩn VietGAP
          </Text>
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
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  btnBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  noticeHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  noticeBody: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  cardSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  managerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  managerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  managerCardSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  btnManagerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnManagerWebText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0058BE',
    letterSpacing: 0.3,
  },
  hotlineCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hotlineTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hotlineTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotlineTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  hotlineSub: {
    fontSize: 11,
  },
  hotlineCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  hotlineCallNum: {
    fontSize: 12,
    fontWeight: '900',
  },
  btnPrimary: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
