import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useFarm } from '@/context/farm-context';
import { useAuth } from '@/context/auth-context';

export function NoAssignedPondState() {
  const colors = useTheme();
  const { user } = useAuth();
  const { isLoadingFarms, isLoadingPonds, refreshFarmsAndPonds } = useFarm();

  const isLoading = isLoadingFarms || isLoadingPonds;

  const handleCallHotline = () => {
    Alert.alert(
      'Hotline Hỗ Trợ Bờ Ao 24/7',
      'Kết nối tổng đài kỹ sư ShrimpMate (1800 6868 - Miễn phí) để hỗ trợ kiểm tra phân công ao nuôi.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi 1800 6868',
          onPress: () => {
            Linking.openURL('tel:18006868').catch(() => {
              Alert.alert('Thông Báo', 'Vui lòng gọi số 1800 6868.');
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: colors.outlineVariant + '40',
          },
        ]}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={[styles.loadingTitle, { color: colors.onSurface }]}>
          Đang đồng bộ danh sách ao nuôi được phân công...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: '#FED7AA',
        },
      ]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="waves" size={38} color="#EA580C" />
      </View>

      <View style={styles.badge}>
        <MaterialIcons name="info-outline" size={14} color="#9A3412" />
        <Text style={styles.badgeText}>TRẠNG THÁI PHÂN CÔNG BỜ AO (UC021)</Text>
      </View>

      <Text style={[styles.title, { color: colors.onSurface }]}>
        KHÔNG CÓ AO NUÔI GIÁM SÁT
      </Text>

      <Text style={[styles.desc, { color: colors.onSurfaceVariant }]}>
        Xin chào{' '}
        <Text style={{ fontWeight: '800', color: colors.onSurface }}>
          {user?.fullName || 'Kỹ thuật viên'}
        </Text>
        . Tài khoản của bạn hiện chưa được Quản lý đầm (Manager) phân công phụ trách ao nuôi nào trên hệ thống.
      </Text>

      <View style={styles.guideBox}>
        <View style={styles.guideHeader}>
          <MaterialIcons name="verified-user" size={16} color="#0058BE" />
          <Text style={styles.guideHeading}>Hướng dẫn kích hoạt giám sát ao:</Text>
        </View>
        <Text style={styles.guideStep}>
          1. Liên hệ Chủ trang trại / Quản lý đầm (Manager) đăng nhập vào cổng Manager Web App.
        </Text>
        <Text style={styles.guideStep}>
          2. Quản lý vào mục "Phân công ao nuôi" và gán tài khoản ({user?.phoneNumber || user?.email || 'của bạn'}) vào ao hoặc trang trại cần vận hành.
        </Text>
        <Text style={styles.guideStep}>
          3. Bấm nút "Kiểm tra lại phân công" bên dưới để tải dữ liệu ao ngay lập tức.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => refreshFarmsAndPonds()}
          style={({ pressed }) => [
            styles.btnRefresh,
            { opacity: pressed ? 0.85 : 1 },
          ]}>
          <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.btnRefreshText}>KIỂM TRA LẠI PHÂN CÔNG AO</Text>
        </Pressable>

        <Pressable
          onPress={handleCallHotline}
          style={({ pressed }) => [
            styles.btnSupport,
            { opacity: pressed ? 0.85 : 1 },
          ]}>
          <MaterialIcons name="support-agent" size={18} color="#EA580C" />
          <Text style={styles.btnSupportText}>GỌI HỖ TRỢ KỸ THUẬT 1800 6868</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  loadingTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  guideBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginTop: 2,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  guideHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  guideStep: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1E3A8A',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  btnRefresh: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnRefreshText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  btnSupport: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSupportText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '800',
  },
});
