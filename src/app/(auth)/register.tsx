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

const VIETNAM_PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ScreenRegister() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();
  const { register, isLoading } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Họ và tên phải có ít nhất 2 ký tự');
      return false;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || !VIETNAM_PHONE_REGEX.test(cleanPhone)) {
      setFormError('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)');
      return false;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setFormError('Địa chỉ email không hợp lệ (ví dụ: name@example.com)');
      return false;
    }
    if (!password || password.length < 8) {
      setFormError('Mật khẩu bảo mật phải có ít nhất 8 ký tự');
      return false;
    }
    if (password !== confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại');
      return false;
    }
    if (!agreedToTerms) {
      setFormError('Vui lòng xác nhận đồng ý với Quy chế hoạt động & Tiêu chuẩn VietGAP');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setFormError(null);
    if (!validateForm()) return;

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        password,
      });

      Alert.alert(
        'Đăng Ký Thành Công! 🎉',
        `Chào mừng ${fullName.trim()} đã gia nhập mạng lưới trại nuôi ShrimpMate. Hãy tiếp tục thiết lập hồ sơ vuông tôm của bạn.`,
        [
          {
            text: 'Thiết Lập Trại Nuôi (Bước 2)',
            onPress: () => router.replace('/(auth)/farm-setup'),
          },
        ]
      );
    } catch (err: any) {
      setFormError(
        err?.message || 'Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại thông tin.'
      );
    }
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
                <MaterialIcons name="water-drop" size={26} color="#EA580C" />
              </View>
              <View>
                <Text style={[styles.brandName, { color: colors.onSurface }]}>ShrimpMate</Text>
                <Text style={[styles.brandTagline, { color: colors.onSurfaceVariant }]}>
                  Hệ Thống Quản Trị Đầm Nuôi
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.stepBadge,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: '#F97316' },
              ]}>
              <Text style={styles.stepBadgeText}>Bước 1/2</Text>
            </View>
          </View>

          {/* Intro Card */}
          <View
            style={[
              styles.introCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.introHeader}>
              <View style={styles.avatarWrapper}>
                <MaterialIcons name="person-add" size={28} color="#EA580C" />
              </View>
              <View style={styles.introInfo}>
                <Text style={[styles.introTitle, { color: colors.onSurface }]}>
                  Đăng ký tài khoản mới
                </Text>
                <Text style={[styles.introSub, { color: colors.onSurfaceVariant }]}>
                  Tạo hồ sơ kỹ sư vận hành hoặc chủ trang trại nuôi tôm
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.badgesRow,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant + '40',
                },
              ]}>
              <View style={styles.badgeItem}>
                <MaterialIcons name="verified-user" size={16} color="#006E2D" />
                <Text style={[styles.badgeText, { color: colors.onSurface }]}>Chuẩn VietGAP</Text>
              </View>
              <Text style={{ color: colors.outlineVariant }}>|</Text>
              <View style={styles.badgeItem}>
                <MaterialIcons name="memory" size={16} color="#006398" />
                <Text style={[styles.badgeText, { color: colors.onSurface }]}>Kết nối IoT Bờ Ao</Text>
              </View>
            </View>
          </View>

          {/* MAIN REGISTER FORM CARD */}
          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '50',
              },
            ]}>
            <Text style={[styles.formHeading, { color: colors.onSurface }]}>
              THÔNG TIN TÀI KHOẢN KỸ SƯ
            </Text>

            {/* Field 1: Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HỌ VÀ TÊN KỸ SƯ / CHỦ TRẠI *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="person" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    setFormError(null);
                  }}
                  autoCapitalize="words"
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  placeholderTextColor="#8C7164"
                />
              </View>
            </View>

            {/* Field 2: Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI LIÊN HỆ *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="phone" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={phoneNumber}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    setFormError(null);
                  }}
                  keyboardType="phone-pad"
                  maxLength={11}
                  placeholder="Ví dụ: 0901234567"
                  placeholderTextColor="#8C7164"
                />
              </View>
            </View>

            {/* Field 3: Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="mail" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setFormError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Ví dụ: nam.nguyen@shrimpmate.vn"
                  placeholderTextColor="#8C7164"
                />
              </View>
            </View>

            {/* Field 4: Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU (TỐI THIỂU 8 KÝ TỰ) *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="lock" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setFormError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#8C7164"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8C7164"
                  />
                </Pressable>
              </View>
            </View>

            {/* Field 5: Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU *</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialIcons name="verified-user" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setFormError(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholder="Nhập lại mật khẩu..."
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

            {/* Terms & Agreement Checkbox */}
            <Pressable
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              style={styles.termsRow}>
              <MaterialIcons
                name={agreedToTerms ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={agreedToTerms ? '#EA580C' : '#8C7164'}
              />
              <Text style={[styles.termsText, { color: colors.onSurfaceVariant }]}>
                Tôi đồng ý với{' '}
                <Text style={{ fontWeight: '800', color: '#EA580C' }}>
                  Quy chế vận hành & Tiêu chuẩn VietGAP 2026
                </Text>{' '}
                của hệ thống ShrimpMate.
              </Text>
            </Pressable>

            {/* Error Banner */}
            {formError && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={18} color="#BA1A1A" />
                <Text style={[styles.errorText, { color: '#BA1A1A' }]}>{formError}</Text>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.btnRegister,
                {
                  backgroundColor: '#EA580C',
                  opacity: pressed || isLoading ? 0.85 : 1,
                },
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="person-add-alt-1" size={22} color="#FFFFFF" />
                  <Text style={styles.btnRegisterText}>ĐĂNG KÝ TÀI KHOẢN BỜ AO</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Navigation to Login */}
          <View style={styles.loginLinkRow}>
            <Text style={[styles.loginPromptText, { color: colors.onSurfaceVariant }]}>
              Đã có tài khoản kỹ sư?
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 4 }]}>
              <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
            </Pressable>
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
    paddingVertical: 8,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8D6',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  introCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFDBCA',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introInfo: {
    flex: 1,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  introSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSection: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  formHeading: {
    fontSize: 12,
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
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D8E8',
    paddingHorizontal: 12,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFEDEC',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  btnRegister: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 4,
  },
  btnRegisterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  loginPromptText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
});
