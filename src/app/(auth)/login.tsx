import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function ScreenLogin() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('0912 345 678');
  const [timer, setTimer] = useState(24);
  const [otp, setOtp] = useState(['8', '5', '2', '']);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterApp = () => {
    router.replace('/(tabs)');
  };

  const handleSendSMS = () => {
    Alert.alert('Gửi Mã Xác Nhận', `Đã gửi mã xác nhận 4 số về SĐT: ${phoneNumber}`);
  };

  const handleCallHotline = () => {
    Alert.alert(
      'Hotline Kỹ Sư Trại Nuôi',
      'Đang kết nối tổng đài hỗ trợ kỹ thuật ShrimpMate: 1800 6868 (Miễn phí cước gọi)',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi 1800 6868', onPress: () => Linking.openURL('tel:18006868').catch(() => {}) },
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
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header: App Brand + Outdoor Signal */}
          <View style={[styles.brandHeader, { borderBottomColor: colors.surfaceContainerHigh }]}>
            <View style={styles.brandLeft}>
              <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="water-drop" size={28} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.brandName, { color: colors.onSurface }]}>ShrimpMate</Text>
                  <View style={[styles.verBadge, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.verText, { color: colors.onSecondaryContainer }]}>v2.4</Text>
                  </View>
                </View>
                <Text style={[styles.brandSub, { color: colors.primary }]}>
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
              <MaterialIcons name="wifi" size={15} color={colors.secondary} />
              <Text style={[styles.signalText, { color: colors.onSurface }]}>Sóng Đầm Khỏe</Text>
            </View>
          </View>

          {/* Friendly Greeting Card */}
          <View
            style={[
              styles.greetingCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
            ]}>
            <View style={styles.greetingHeader}>
              <View style={[styles.avatarWrapper, { borderColor: colors.primary, backgroundColor: colors.surfaceContainer }]}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB89q4fkunRCQjyTnA2MdoLszgf-pSQBQBnzHyTPjJNJIZ0W2tnrJujZq5g6H68wlxq9O9cw09TKJiJasbwMFtjF63_8t5TsUCE5j9dVNrMZ6Hg4veBeAU-yQRC_BOw0UMcPGNdam9t4IBcQDrTir_p3REcuu1jhec9pDpgU3HO4L5oEdibTLwnC0f7hLZyIwuE0Qp9pGqatDMSJe66auTUJAtxzzYPjOrlITgTDesKPWNtCnXE5kbP7w',
                  }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              </View>
              <View style={styles.greetingInfo}>
                <Text style={[styles.greetingTitle, { color: colors.onSurface }]}>
                  Kính chào bà con!
                </Text>
                <Text style={[styles.greetingSub, { color: colors.onSurfaceVariant }]}>
                  Chỉ cần số điện thoại, không cần nhớ mật khẩu
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.badgesRow,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant + '90' },
              ]}>
              <View style={styles.badgeItem}>
                <MaterialIcons name="check-circle" size={18} color={colors.secondary} />
                <Text style={[styles.badgeText, { color: colors.onSurface }]}>Chạm tay ướt mượt mà</Text>
              </View>
              <Text style={{ color: colors.outlineVariant }}>|</Text>
              <View style={styles.badgeItem}>
                <MaterialIcons name="verified-user" size={18} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.onSurface }]}>Bảo mật chuẩn VietGAP</Text>
              </View>
            </View>
          </View>

          {/* Step 1: Input Phone Number */}
          <View
            style={[
              styles.cardSection,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
            ]}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepLabelGroup}>
                <View style={[styles.stepNumCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <Text style={[styles.stepLabelText, { color: colors.onSurface }]}>
                  NHẬP SỐ ĐIỆN THOẠI CHỦ VUÔNG
                </Text>
              </View>
              <View style={[styles.requiredBadge, { backgroundColor: colors.errorContainer }]}>
                <Text style={[styles.requiredText, { color: colors.onErrorContainer }]}>BẮT BUỘC</Text>
              </View>
            </View>

            <View
              style={[
                styles.phoneInputRow,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.primary + '60',
                },
              ]}>
              <View style={[styles.countryCode, { borderRightColor: colors.outlineVariant }]}>
                <Text style={{ fontSize: 20 }}>🇻🇳</Text>
                <Text style={[styles.countryCodeText, { color: colors.onSurface }]}>+84</Text>
              </View>

              <TextInput
                style={[styles.inputField, { color: colors.onSurface }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="0912 345 678"
                placeholderTextColor={colors.outline}
              />

              {!!phoneNumber && (
                <Pressable onPress={() => setPhoneNumber('')} style={{ padding: 4 }}>
                  <MaterialIcons name="cancel" size={22} color={colors.outlineVariant} />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleSendSMS}
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={styles.btnPrimaryText}>TIẾP TỤC NHẬN MÃ</Text>
              <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Step 2: Extra-Large OTP Input */}
          <View
            style={[
              styles.cardSection,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
            ]}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepLabelGroup}>
                <View style={[styles.stepNumCircle, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <Text style={[styles.stepLabelText, { color: colors.onSurface }]}>
                  MÃ XÁC THỰC BẰNG TIN NHẮN
                </Text>
              </View>
              <View style={[styles.requiredBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[styles.requiredText, { color: colors.primary }]}>4 Chữ Số</Text>
              </View>
            </View>

            <Text style={[styles.otpSubText, { color: colors.onSurfaceVariant }]}>
              Đã gửi mã SMS về số: <Text style={{ color: colors.onSurface, fontWeight: '800' }}>{phoneNumber || '0912 ••• 678'}</Text>
            </Text>

            <View style={styles.otpGrid}>
              {otp.map((digit, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: digit ? colors.surfaceContainerHigh : colors.surfaceContainerLowest,
                      borderColor: digit ? colors.primary + '70' : colors.primary,
                    },
                  ]}>
                  {digit ? (
                    <Text style={[styles.otpDigit, { color: colors.primary }]}>{digit}</Text>
                  ) : (
                    <View style={[styles.otpDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.timerRow}>
              <View style={styles.timerLeft}>
                <MaterialIcons name="timer" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.timerText, { color: colors.onSurfaceVariant }]}>
                  Gửi lại sau <Text style={{ color: colors.tertiaryContainer, fontWeight: '800' }}>{timer}s</Text>
                </Text>
              </View>

              <Pressable
                onPress={() => Alert.alert('Đọc mã tự động', 'Tổng đài ShrimpMate đang gọi để đọc mã số tự động cho bà con...')}
                style={[styles.readCodeBtn, { backgroundColor: colors.surfaceContainer }]}>
                <MaterialIcons name="phone-in-talk" size={15} color={colors.primary} />
                <Text style={[styles.readCodeText, { color: colors.primary }]}>Bấm nghe đọc mã</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleEnterApp}
              style={({ pressed }) => [
                styles.btnEnter,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialIcons name="lock-open" size={24} color="#FFFFFF" />
              <Text style={styles.btnEnterText}>VÀO VUÔNG TÔM</Text>
            </Pressable>
          </View>

          {/* Quick 1-Tap Options */}
          <View style={styles.quickGrid}>
            <Pressable
              onPress={handleEnterApp}
              style={({ pressed }) => [
                styles.quickCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <View style={styles.zaloIcon}>
                <Text style={styles.zaloText}>Zalo</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Vào bằng Zalo</Text>
                <Text style={[styles.quickCardSub, { color: colors.onSurfaceVariant }]}>1 chạm không cần mã</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleEnterApp}
              style={({ pressed }) => [
                styles.quickCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <View style={[styles.offlineIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                <MaterialIcons name="signal-wifi-off" size={20} color={colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Bờ ao mất sóng</Text>
                <Text style={[styles.quickCardSub, { color: colors.onSurfaceVariant }]}>Chế độ xem Offline</Text>
              </View>
            </Pressable>
          </View>

          {/* Hotline Engineer Banner */}
          <View
            style={[
              styles.hotlineBanner,
              { backgroundColor: colors.inverseSurface, borderColor: colors.outlineVariant },
            ]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.hotlineBadge}>
                <View style={[styles.signalDot, { backgroundColor: colors.secondaryFixed }]} />
                <Text style={[styles.hotlineTag, { color: colors.inverseOnSurface }]}>
                  KỸ SƯ TRỰC MÁY 24/7
                </Text>
              </View>
              <Text style={[styles.hotlineTitle, { color: colors.inverseOnSurface }]}>
                Cần hướng dẫn cài đặt thiết bị ao?
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
              <MaterialIcons name="call" size={20} color={colors.onSecondaryFixed} />
              <Text style={[styles.hotlineCallNum, { color: colors.onSecondaryFixed }]}>1800 6868</Text>
            </Pressable>
          </View>

          <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            An toàn sinh học & Bảo mật hồ sơ nuôi tôm chuẩn VietGAP
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
    width: 46,
    height: 46,
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
    gap: 4,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  greetingInfo: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 18,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stepNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '800',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 12,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    borderRightWidth: 1.5,
  },
  countryCodeText: {
    fontSize: 17,
    fontWeight: '900',
  },
  inputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  btnPrimary: {
    height: 50,
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
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  otpSubText: {
    fontSize: 12,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: '900',
  },
  otpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readCodeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  btnEnter: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  btnEnterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  zaloIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0068FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zaloText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  offlineIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickCardSub: {
    fontSize: 10,
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
});
