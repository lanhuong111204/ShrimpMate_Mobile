/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#131B2E',
    background: '#FAF8FF',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#3F4850',

    // Material 3 / ShrimpMate OS Prototype Tokens
    primary: '#9D4300',
    primaryDeep: '#7A3200',
    primaryContainer: '#F97316',
    primaryLight: '#FFDBCA',
    primaryFixed: '#FFDBCA',
    primaryFixedDim: '#FFB690',
    onPrimary: '#FFFFFF',
    onPrimaryFixed: '#341100',
    onPrimaryFixedVariant: '#7A3200',

    secondary: '#006E2D',
    secondaryContainer: '#7CF994',
    secondaryFixed: '#7FFC97',
    secondaryFixedDim: '#62DF7D',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#007230',
    onSecondaryFixed: '#002109',
    onSecondaryFixedVariant: '#005320',

    tertiary: '#006398',
    tertiaryContainer: '#40A2E7',
    tertiaryFixed: '#CCE5FF',
    tertiaryFixedDim: '#93CCFF',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#001D31',
    onTertiaryFixed: '#001D31',
    onTertiaryFixedVariant: '#004B73',

    surface: '#F8F9FF',
    surfaceBright: '#F8F9FF',
    surfaceDim: '#D2D9F4',
    surfaceVariant: '#DAE2FD',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#EFF4FF',
    surfaceContainer: '#E5EEFF',
    surfaceContainerHigh: '#DCE9FF',
    surfaceContainerHighest: '#D3E4FE',

    onSurface: '#0B1C30',
    onSurfaceVariant: '#584237',
    outline: '#8C7164',
    outlineVariant: '#E0C0B1',

    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
    onError: '#FFFFFF',

    inverseSurface: '#213145',
    inverseOnSurface: '#EAF1FF',
    inversePrimary: '#FFB690',

    cardBackground: '#FFFFFF',
    border: '#E0C0B1',
    optimal: '#006E2D',
    warning: '#F97316',
    critical: '#BA1A1A',
    offline: '#8C7164',
  },
  dark: {
    text: '#EEF0FF',
    background: '#131B2E',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#BFC7D2',

    primary: '#38BDF8',
    primaryDeep: '#0284C7',
    primaryContainer: '#004B73',
    primaryLight: '#082F49',
    primaryFixed: '#CCE5FF',
    primaryFixedDim: '#93CCFF',
    onPrimary: '#001D31',
    onPrimaryFixed: '#001D31',
    onPrimaryFixedVariant: '#004B73',

    secondary: '#7FFC97',
    secondaryContainer: '#005320',
    secondaryFixed: '#7FFC97',
    secondaryFixedDim: '#62DF7D',
    onSecondary: '#002109',
    onSecondaryContainer: '#7CF994',
    onSecondaryFixed: '#002109',
    onSecondaryFixedVariant: '#005320',

    tertiary: '#FFB599',
    tertiaryContainer: '#7F2B00',
    tertiaryFixed: '#FFDBCE',
    tertiaryFixedDim: '#FFB599',
    onTertiary: '#370E00',
    onTertiaryContainer: '#FFDBCE',
    onTertiaryFixed: '#370E00',
    onTertiaryFixedVariant: '#7F2B00',

    surface: '#131B2E',
    surfaceBright: '#283044',
    surfaceDim: '#0B0F19',
    surfaceVariant: '#283044',
    surfaceContainerLowest: '#0B0F19',
    surfaceContainerLow: '#1A2238',
    surfaceContainer: '#202A44',
    surfaceContainerHigh: '#283044',
    surfaceContainerHighest: '#333D56',

    onSurface: '#EEF0FF',
    onSurfaceVariant: '#BFC7D2',
    outline: '#8A939E',
    outlineVariant: '#3F4850',

    error: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    onError: '#690005',

    inverseSurface: '#FAF8FF',
    inverseOnSurface: '#131B2E',
    inversePrimary: '#006194',

    cardBackground: '#1A2238',
    border: '#3F4850',
    optimal: '#7FFC97',
    warning: '#FFB599',
    critical: '#FFB4AB',
    offline: '#8A939E',
  },
} as const;

export const Gradients = {
  header: ['#FB923C', '#EA580C'],
} as const;


export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
