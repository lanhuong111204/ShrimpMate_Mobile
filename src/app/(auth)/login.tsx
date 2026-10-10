import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';
import { OtpInput } from '@/components/common/otp-input';

export default function ScreenLogin() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();
  const {
    login,
    forgotPassword,
    verifyResetOtp,
    resendOtp,
    resetPassword,
    loginOffline,
    isLoading,
  } = useAuth();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Forbidden Modal state
  const [showAdminForbiddenModal, setShowAdminForbiddenModal] = useState(false);
  const [adminForbiddenMsg, setAdminForbiddenMsg] = useState('');

  // Forgot password modal state (3-step flow)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  React.useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Primary Login Action - directly calls Backend API with RBAC Guard
  const handleLogin = async () => {
    if (!identifier.trim()) {
      setLoginError('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    if (!password) {
      setLoginError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoginError(null);
    try {
      await login({
        identifier: identifier.trim(),
        password,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.isForbiddenAdmin || err?.statusCode === 403) {
        setAdminForbiddenMsg(
          err?.message ||
          'Tài khoản Quản trị viên (Admin) không được phép truy cập ứng dụng di động ShrimpMate Mobile. Vui lòng đăng nhập trên hệ thống Admin Web Dashboard.'
        );
        setShowAdminForbiddenModal(true);
      } else {
        setLoginError(
          err?.message || 'Email/số điện thoại hoặc mật khẩu không đúng'
        );
      }
    }
  };

  // Offline Mode Login
  const handleEnterOffline = async () => {
    Alert.alert(
      'Chế Độ Bờ Ao Ngoại Tuyến',
      'Bạn đang truy cập ứng dụng không cần kết nối mạng. Dữ liệu các đầm tôm và lịch cữ sẽ được đồng bộ khi có sóng trở lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vào Xem Ngoại Tuyến',
          style: 'default',
          onPress: async () => {
            await loginOffline();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  // Hotline Support Dialog
  const handleCallHotline = () => {
    Alert.alert(
      'Hotline Kỹ Sư Trại Nuôi 24/7',
      'Đang kết nối tổng đài hỗ trợ kỹ thuật và chuẩn đoán hồ ao ShrimpMate: 1800 6868 (Miễn hoàn toàn cước gọi)',
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

  // Forgot Password: Step 1 - Send OTP
  const handleSendForgotOtp = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotError('Vui lòng nhập Email hoặc Số điện thoại để nhận mã');
      return;
    }

    setForgotError(null);
    setIsForgotSubmitting(true);
    try {
      const msg = await forgotPassword(forgotIdentifier.trim());
      setForgotStep(2);
      setCountdown(60);
      Alert.alert(
        'Đã Gửi Mã Xác Thực',
        msg || 'Mã OTP 6 chữ số đã được gửi qua Email/SMS của bạn.'
      );
    } catch (err: any) {
      setForgotError(err?.message || 'Không thể gửi mã xác nhận lúc này');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Forgot Password: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isForgotSubmitting) return;

    setForgotError(null);
    setIsForgotSubmitting(true);
    try {
      const msg = await resendOtp(forgotIdentifier.trim());
      setCountdown(60);
      Alert.alert('Đã Gửi Lại OTP', msg || 'Mã OTP mới đã được gửi thành công.');
    } catch (err: any) {
      setForgotError(err?.message || 'Không thể gửi lại mã xác thực lúc này');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP (Pre-validation)
  const handleVerifyOtp = async () => {
    const otpCode = forgotOtp.join('');
    if (otpCode.length < 6) {
      setForgotError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setForgotError(null);
    setIsForgotSubmitting(true);
    try {
      await verifyResetOtp({
        identifier: forgotIdentifier.trim(),
        otp: otpCode,
      });
      // OTP hợp lệ -> chuyển sang Step 3 để nhập mật khẩu mới
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Forgot Password: Step 3 - Reset with New Password
  const handleConfirmResetPassword = async () => {
    const otpCode = forgotOtp.join('');
    if (newPassword.length < 8) {
      setForgotError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Mật khẩu nhập lại không khớp');
      return;
    }

    setForgotError(null);
    setIsForgotSubmitting(true);
    try {
      const msg = await resetPassword({
        identifier: forgotIdentifier.trim(),
        otp: otpCode,
        newPassword,
      });
      setShowForgotModal(false);
      setPassword(newPassword);
      setIdentifier(forgotIdentifier.trim());
      Alert.alert(
        'Đổi Mật Khẩu Thành Công',
        msg || 'Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập với mật khẩu mới.'
      );
    } catch (err: any) {
      setForgotError(err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại');
    } finally {
      setIsForgotSubmitting(false);
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
          <View style={[styles.brandHeader, { borderBottomColor: colors.outlineVariant + '30' }]}>
            <View style={styles.brandLeft}>
              <View style={[styles.logoBox, { backgroundColor: '#EA580C' }]}>
                <MaterialIcons name="water-drop" size={26} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.brandName, { color: colors.onSurface }]}>ShrimpMate</Text>
                  <View style={[styles.verBadge, { backgroundColor: '#FFDBCA' }]}>
                    <Text style={[styles.verText, { color: '#9D4300' }]}>v2.4</Text>
                  </View>
                </View>
                <Text style={[styles.brandSub, { color: '#F97316' }]}>
                  Trợ lý số nuôi tôm công nghệ cao
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.signalBadge,
                { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.secondaryContainer },
              ]}>
              <View style={[styles.signalDot, { backgroundColor: colors.secondary }]} />
              <MaterialIcons name="wifi" size={14} color={colors.secondary} />
              <Text style={[styles.signalText, { color: colors.onSurface }]}>Máy Chủ Online</Text>
            </View>
          </View>

          {/* Greeting Card */}
          <View
            style={[
              styles.greetingCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
              },
            ]}>
            <View style={styles.greetingHeader}>
              <View style={[styles.avatarWrapper, { borderColor: '#F97316' }]}>
                <MaterialIcons name="agriculture" size={32} color="#EA580C" />
              </View>
              <View style={styles.greetingInfo}>
                <Text style={[styles.greetingTitle, { color: colors.onSurface }]}>
                  Kính chào bà con!
                </Text>
                <Text style={[styles.greetingSub, { color: colors.onSurfaceVariant }]}>
                  Đăng nhập để quản lý ao nuôi và điều khiển máy cho ăn
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
                <MaterialIcons name="security" size={16} color="#9D4300" />
                <Text style={[styles.badgeText, { color: colors.onSurface }]}>Bảo mật Token JWT</Text>
              </View>
            </View>
          </View>

          {/* MAIN LOGIN FORM CARD */}
          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '50',
              },
            ]}>
            <Text style={[styles.formHeading, { color: colors.onSurface }]}>
              ĐĂNG NHẬP HỆ THỐNG
            </Text>

            {/* Field 1: Identifier */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI HOẶC EMAIL</Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: loginError ? colors.error : colors.outlineVariant + '70',
                  },
                ]}>
                <MaterialIcons name="account-circle" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    setLoginError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Nhập Email hoặc Số điện thoại"
                  placeholderTextColor="#8C7164"
                />
                {!!identifier && (
                  <Pressable onPress={() => setIdentifier('')} style={{ padding: 4 }}>
                    <MaterialIcons name="cancel" size={18} color={colors.outlineVariant} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Field 2: Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>MẬT KHẨU</Text>
                <Pressable
                  onPress={() => {
                    setForgotIdentifier(identifier);
                    setForgotStep(1);
                    setForgotError(null);
                    setShowForgotModal(true);
                  }}>
                  <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: loginError ? colors.error : colors.outlineVariant + '70',
                  },
                ]}>
                <MaterialIcons name="lock" size={20} color="#8C7164" />
                <TextInput
                  style={[styles.inputField, { color: colors.onSurface }]}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setLoginError(null);
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

            {/* Error Message Display */}
            {loginError && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{loginError}</Text>
              </View>
            )}

            {/* Primary Submit Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.btnLogin,
                {
                  backgroundColor: '#EA580C',
                  opacity: pressed || isLoading ? 0.85 : 1,
                },
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="login" size={22} color="#FFFFFF" />
                  <Text style={styles.btnLoginText}>VÀO VUÔNG TÔM</Text>
                </>
              )}
            </Pressable>

            {/* Register Link Row */}
            <View style={styles.registerPromptRow}>
              <Text style={[styles.registerPromptText, { color: colors.onSurfaceVariant }]}>
                Chưa có tài khoản kỹ sư?
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/register')}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 2 }]}>
                <Text style={styles.registerLinkText}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>

          {/* Offline Mode Option */}
          <Pressable
            onPress={handleEnterOffline}
            style={({ pressed }) => [
              styles.offlineCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '40',
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <View style={[styles.offlineIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="signal-wifi-off" size={20} color={colors.onSurface} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offlineTitle, { color: colors.onSurface }]}>
                Bờ ao mất sóng
              </Text>
              <Text style={[styles.offlineSub, { color: colors.onSurfaceVariant }]}>
                Chế độ xem dữ liệu ngoại tuyến (Offline)
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={14} color={colors.outlineVariant} />
          </Pressable>

          {/* Hotline Engineer 24/7 */}
          <View
            style={[
              styles.hotlineBanner,
              {
                backgroundColor: colors.inverseSurface,
                borderColor: colors.outlineVariant + '50',
              },
            ]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.hotlineBadge}>
                <View style={[styles.signalDot, { backgroundColor: colors.secondaryFixed }]} />
                <Text style={[styles.hotlineTag, { color: colors.inverseOnSurface }]}>
                  KỸ SƯ TRỰC MÁY 24/7
                </Text>
              </View>
              <Text style={[styles.hotlineTitle, { color: colors.inverseOnSurface }]}>
                Cần hỗ trợ tài khoản hoặc thiết bị ao?
              </Text>
              <Text style={[styles.hotlineSub, { color: colors.primaryFixed }]}>
                Bà con gọi miễn hoàn toàn cước phí
              </Text>
            </View>

            <Pressable
              onPress={handleCallHotline}
              style={({ pressed }) => [
                styles.hotlineCallBtn,
                { backgroundColor: colors.secondaryFixed, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialIcons name="call" size={18} color={colors.onSecondaryFixed} />
              <Text style={[styles.hotlineCallNum, { color: colors.onSecondaryFixed }]}>1800 6868</Text>
            </Pressable>
          </View>

          <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            An toàn sinh học & Bảo mật hồ sơ nuôi tôm chuẩn VietGAP
          </Text>
        </View>
      </ScrollView>

      {/* MODAL: CHẶN QUYỀN QUẢN TRỊ VIÊN (ADMIN FORBIDDEN DIALOG) */}
      <Modal
        visible={showAdminForbiddenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdminForbiddenModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderColor: '#BA1A1A', borderWidth: 1 }]}>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#FFDAD6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MaterialIcons name="admin-panel-settings" size={36} color="#BA1A1A" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '900',
                  color: '#BA1A1A',
                  textAlign: 'center',
                  letterSpacing: -0.2,
                }}>
                TÀI KHOẢN QUẢN TRỊ VIÊN
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#41484D',
                  lineHeight: 20,
                  textAlign: 'center',
                }}>
                {adminForbiddenMsg ||
                  'Ứng dụng di động ShrimpMate Mobile chỉ dành riêng cho Người nuôi (Farmer). Tài khoản Quản trị viên không được phép đăng nhập trên thiết bị di động.'}
              </Text>
              <View
                style={{
                  width: '100%',
                  backgroundColor: '#EFF4FF',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#D4E3FF',
                  gap: 4,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="info" size={16} color="#0058BE" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0058BE' }}>
                    Hướng dẫn truy cập Admin:
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#2B4865', lineHeight: 18 }}>
                  Vui lòng đăng nhập trên máy tính bằng trình duyệt web tới hệ thống Quản trị Web (Admin Web Dashboard) để quản lý cấu hình ao nuôi và thiết bị toàn hệ thống.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowAdminForbiddenModal(false);
                setPassword('');
              }}
              style={({ pressed }) => [
                styles.btnPrimaryModal,
                { backgroundColor: '#0B1C30', opacity: pressed ? 0.85 : 1 },
              ]}>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.btnPrimaryModalText}>ĐÃ HIỂU & ĐÓNG</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: QUÊN MẬT KHẨU (FORGOT PASSWORD 3 BƯỚC CHUẨN) */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialIcons name="lock-reset" size={24} color="#EA580C" />
                <Text style={styles.modalTitle}>
                  {forgotStep === 1
                    ? 'QUÊN MẬT KHẨU (BƯỚC 1/3)'
                    : forgotStep === 2
                    ? 'XÁC THỰC MÃ OTP (BƯỚC 2/3)'
                    : 'ĐẶT MẬT KHẨU MỚI (BƯỚC 3/3)'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowForgotModal(false)}
                style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#584237" />
              </Pressable>
            </View>

            {/* Stepper Indicator */}
            <View style={styles.stepperContainer}>
              <View
                style={[
                  styles.stepBadge,
                  forgotStep >= 1 ? styles.stepBadgeActive : styles.stepBadgeInactive,
                ]}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  forgotStep >= 2 ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />
              <View
                style={[
                  styles.stepBadge,
                  forgotStep >= 2 ? styles.stepBadgeActive : styles.stepBadgeInactive,
                ]}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  forgotStep >= 3 ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />
              <View
                style={[
                  styles.stepBadge,
                  forgotStep >= 3 ? styles.stepBadgeActive : styles.stepBadgeInactive,
                ]}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
            </View>

            {/* BƯỚC 1: NHẬP SĐT HOẶC EMAIL */}
            {forgotStep === 1 && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  Nhập Email hoặc Số điện thoại tài khoản của bà con. Hệ thống sẽ gửi mã xác thực OTP 6 số.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL HOẶC SỐ ĐIỆN THOẠI</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons name="contact-mail" size={20} color="#8C7164" />
                    <TextInput
                      style={styles.inputField}
                      value={forgotIdentifier}
                      onChangeText={(val) => {
                        setForgotIdentifier(val);
                        setForgotError(null);
                      }}
                      autoCapitalize="none"
                      placeholder="farmer@shrimpmate.local hoặc 0901000002"
                      placeholderTextColor="#8C7164"
                    />
                  </View>
                </View>

                {forgotError && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={16} color="#BA1A1A" />
                    <Text style={[styles.errorText, { color: '#BA1A1A' }]}>{forgotError}</Text>
                  </View>
                )}

                <Pressable
                  onPress={handleSendForgotOtp}
                  disabled={isForgotSubmitting}
                  style={({ pressed }) => [
                    styles.btnPrimaryModal,
                    { opacity: pressed || isForgotSubmitting ? 0.85 : 1 },
                  ]}>
                  {isForgotSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.btnPrimaryModalText}>GỬI MÃ XÁC THỰC (OTP 6 SỐ)</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* BƯỚC 2: XÁC THỰC MÃ OTP */}
            {forgotStep === 2 && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  Mã OTP 6 số đã gửi tới:{' '}
                  <Text style={{ fontWeight: '800', color: '#0B1C30' }}>{forgotIdentifier}</Text>
                </Text>

                {/* 6-Digit OTP Input */}
                <View style={{ marginVertical: 4 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 6 }]}>MÃ XÁC THỰC 6 CHỮ SỐ</Text>
                  <OtpInput
                    length={6}
                    value={forgotOtp}
                    onChangeOtp={(newOtp) => {
                      setForgotOtp(newOtp);
                      setForgotError(null);
                    }}
                    hasError={!!forgotError}
                  />
                </View>

                {/* Resend OTP Row */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendWaitText}>
                      Gửi lại mã sau <Text style={{ fontWeight: '800', color: '#EA580C' }}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={isForgotSubmitting}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                      <Text style={styles.resendActiveText}>Chưa nhận được mã? Gửi lại OTP</Text>
                    </Pressable>
                  )}
                </View>

                {forgotError && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={16} color="#BA1A1A" />
                    <Text style={[styles.errorText, { color: '#BA1A1A' }]}>{forgotError}</Text>
                  </View>
                )}

                <View style={styles.forgotActionsRow}>
                  <Pressable
                    onPress={() => setForgotStep(1)}
                    style={styles.btnBackModal}>
                    <Text style={styles.btnBackModalText}>Quay lại</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={isForgotSubmitting}
                    style={({ pressed }) => [
                      styles.btnConfirmModal,
                      { opacity: pressed || isForgotSubmitting ? 0.85 : 1 },
                    ]}>
                    {isForgotSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.btnConfirmModalText}>XÁC THỰC MÃ</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI */}
            {forgotStep === 3 && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  Mã OTP hợp lệ! Hãy nhập mật khẩu mới cho tài khoản{' '}
                  <Text style={{ fontWeight: '800', color: '#0B1C30' }}>{forgotIdentifier}</Text>.
                </Text>

                {/* New Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MẬT KHẨU MỚI (TỐI THIỂU 8 KÝ TỰ)</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons name="lock" size={20} color="#8C7164" />
                    <TextInput
                      style={styles.inputField}
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        setForgotError(null);
                      }}
                      secureTextEntry={!showNewPassword}
                      placeholder="Nhập mật khẩu mới..."
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

                {/* Confirm New Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons name="lock-outline" size={20} color="#8C7164" />
                    <TextInput
                      style={styles.inputField}
                      value={confirmNewPassword}
                      onChangeText={(val) => {
                        setConfirmNewPassword(val);
                        setForgotError(null);
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

                {forgotError && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={16} color="#BA1A1A" />
                    <Text style={[styles.errorText, { color: '#BA1A1A' }]}>{forgotError}</Text>
                  </View>
                )}

                <View style={styles.forgotActionsRow}>
                  <Pressable
                    onPress={() => setForgotStep(2)}
                    style={styles.btnBackModal}>
                    <Text style={styles.btnBackModalText}>Quay lại</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmResetPassword}
                    disabled={isForgotSubmitting}
                    style={({ pressed }) => [
                      styles.btnConfirmModal,
                      { opacity: pressed || isForgotSubmitting ? 0.85 : 1 },
                    ]}>
                    {isForgotSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.btnConfirmModalText}>ĐỔI MẬT KHẨU</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  container: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  verBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verText: {
    fontSize: 11,
    fontWeight: '800',
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  signalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '800',
  },
  greetingCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFDBCA',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingInfo: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B1C30',
    letterSpacing: 0.3,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F97316',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#EFF4FF',
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
  },
  btnLogin: {
    height: 54,
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
  btnLoginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  registerPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  registerPromptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  registerLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  offlineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  offlineSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  hotlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  hotlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hotlineTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hotlineTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  hotlineSub: {
    fontSize: 10,
    marginTop: 2,
  },
  hotlineCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  hotlineCallNum: {
    fontSize: 14,
    fontWeight: '900',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B1C30',
  },
  modalBody: {
    gap: 12,
  },
  modalDesc: {
    fontSize: 12,
    color: '#584237',
    lineHeight: 18,
  },
  btnPrimaryModal: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnPrimaryModalText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  forgotActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnBackModal: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBackModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#584237',
  },
  btnConfirmModal: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#006E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmModalText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginBottom: 6,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#EA580C',
  },
  stepBadgeInactive: {
    backgroundColor: '#D1D5DB',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    maxWidth: 40,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#EA580C',
  },
  stepLineInactive: {
    backgroundColor: '#D1D5DB',
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  resendWaitText: {
    fontSize: 12,
    color: '#584237',
    fontWeight: '600',
  },
  resendActiveText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
