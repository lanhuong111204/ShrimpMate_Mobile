import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';

export default function ScreenFirstChangePassword() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();
  const { user, firstTimeChangePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await firstTimeChangePassword(newPassword, currentPassword || undefined);
      Alert.alert(
        'Kích Hoạt Tài Khoản Thành Công! 🎉',
        'Mật khẩu bảo mật cá nhân của bạn đã được cập nhật an toàn. Chào mừng bạn bắt đầu ca vận hành ao nuôi.',
        [
          {
            text: 'Vào Trang Chính',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu tạm thời.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất Khỏi Tài Khoản',
      'Bạn có chắc chắn muốn đăng xuất? Bạn sẽ cần đăng nhập lại để hoàn tất kích hoạt.',
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header Brand Bar */}
          <View style={styles.brandBar}>
            <View style={styles.brandLeft}>
              <View style={styles.logoBox}>
                <MaterialIcons name="water-drop" size={24} color="#EA580C" />
              </View>
              <View>
                <Text style={[styles.brandName, { color: colors.onSurface }]}>ShrimpMate</Text>
                <Text style={[styles.brandSub, { color: colors.onSurfaceVariant }]}>
                  Kích Hoạt Tài Khoản Bờ Ao
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.btnLogout,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant + '40',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <MaterialIcons name="logout" size={18} color="#BA1A1A" />
              <Text style={styles.btnLogoutText}>Đăng xuất</Text>
            </Pressable>
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
              <MaterialIcons name="lock-reset" size={36} color="#EA580C" />
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, { color: '#9A3412' }]}>
                ĐỔI MẬT KHẨU LẦN ĐẦU
              </Text>
              <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>
                Xin chào <Text style={{ fontWeight: '800', color: colors.onSurface }}>{user?.fullName || 'Kỹ thuật viên'}</Text>. Tài khoản của bạn được khởi tạo bởi Quản lý đầm. Vui lòng thiết lập mật khẩu cá nhân mới để đảm bảo an toàn sinh học.
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <Text style={[styles.formHeading, { color: colors.onSurface }]}>
              THIẾT LẬP MẬT KHẨU BẢO MẬT
            </Text>

            {/* Field: Mật khẩu hiện tại (Tùy chọn nếu nhận được từ quản lý) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU KHỞI TẠO TỪ QUẢN LÝ (NẾU CÓ)</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="vpn-key" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={currentPassword}
                  onChangeText={(val) => {
                    setCurrentPassword(val);
                    setErrorMessage(null);
                  }}
                  secureTextEntry={!showCurrentPassword}
                  placeholder="Nhập mật khẩu do Quản lý bàn giao..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ padding: 4 }}>
                  <MaterialIcons
                    name={showCurrentPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Field: Mật khẩu mới */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU MỚI (TỐI THIỂU 8 KÝ TỰ) *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="lock" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    setErrorMessage(null);
                  }}
                  secureTextEntry={!showNewPassword}
                  placeholder="Nhập mật khẩu mới an toàn..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={{ padding: 4 }}>
                  <MaterialIcons
                    name={showNewPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Field: Xác nhận mật khẩu mới */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU MỚI *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="lock-outline" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setErrorMessage(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 4 }}>
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={16} color="#BA1A1A" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.btnSubmit,
                {
                  backgroundColor: '#EA580C',
                  opacity: pressed || isSubmitting ? 0.85 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.btnSubmitText}>XÁC NHẬN & BẮT ĐẦU VẬN HÀNH</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Security Notice */}
          <View
            style={[
              styles.securityCard,
              {
                backgroundColor: '#EFF6FF',
                borderColor: '#BFDBFE',
              },
            ]}>
            <MaterialIcons name="security" size={20} color="#1D4ED8" />
            <Text style={styles.securityText}>
              Mật khẩu mới của bạn sẽ được mã hóa an toàn trên hệ thống. Không chia sẻ mật khẩu này với bất kỳ ai để bảo vệ số lượng tôm và tài sản ao nuôi.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BA1A1A',
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
    width: 68,
    height: 68,
    borderRadius: 34,
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
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  formHeading: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B1C30',
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4E3FF',
    paddingHorizontal: 12,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BA1A1A',
  },
  btnSubmit: {
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
    marginTop: 4,
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  securityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#1E3A8A',
  },
});
