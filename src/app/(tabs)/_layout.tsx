import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant + '30',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lịch Cữ',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="menu-book"
              size={24}
              color={focused ? '#F97316' : color}
              style={focused ? { transform: [{ scale: 1.1 }] } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="may-cho-an"
        options={{
          title: 'Trạm Ăn',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="radar"
              size={24}
              color={focused ? '#F97316' : color}
              style={focused ? { transform: [{ scale: 1.1 }] } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="quan-ly-ao"
        options={{
          title: 'Giám Sát',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="waves"
              size={24}
              color={focused ? '#F97316' : color}
              style={focused ? { transform: [{ scale: 1.1 }] } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cai-dat"
        options={{
          title: 'Cài Đặt',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="settings"
              size={24}
              color={focused ? '#F97316' : color}
              style={focused ? { transform: [{ scale: 1.1 }] } : {}}
            />
          ),
        }}
      />
    </Tabs>
  );
}
