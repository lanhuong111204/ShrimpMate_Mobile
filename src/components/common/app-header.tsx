import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

interface AppHeaderProps {
  title?: string;
  onLocationClick?: () => void;
}

export function AppHeader({ title = 'Khu Nuôi Bạc Liêu A', onLocationClick }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const router = useRouter();

  const handleLocationPress = () => {
    if (onLocationClick) {
      onLocationClick();
      return;
    }
    Alert.alert(
      'Chọn Khu Nuôi',
      `Khu nuôi hiện tại: ${title}\nBạn có muốn chuyển sang:\n• Phân Khu B\n• Khu Trại Cà Mau?`,
      [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Phân Khu B', onPress: () => {} },
        { text: 'Khu Trại Cà Mau', onPress: () => {} },
      ]
    );
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/cai-dat');
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.surface,
          borderBottomColor: colors.outlineVariant + '40',
        },
      ]}>
      <View style={styles.headerContent}>
        {/* Left: Location button + Online badge */}
        <View style={styles.leftGroup}>
          <Pressable
            onPress={handleLocationPress}
            style={({ pressed }) => [
              styles.locationBtn,
              { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.8 : 1 },
            ]}>
            <MaterialIcons name="location-on" size={18} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.locationText, { color: colors.onSurface }]}>
              {title}
            </Text>
            <MaterialIcons name="expand-more" size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.onlineBadge, { backgroundColor: colors.secondaryContainer }]}>
            <MaterialIcons name="wifi" size={14} color={colors.onSecondaryContainer} />
            <Text style={[styles.onlineText, { color: colors.onSecondaryContainer }]}>ONLINE</Text>
          </View>
        </View>

        {/* Right: Profile Avatar Button */}
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.avatarBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <MaterialIcons name="person" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  headerContent: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationBtn: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 200,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
