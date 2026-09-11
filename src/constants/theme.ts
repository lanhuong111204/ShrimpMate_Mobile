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

    // Material 3 / Tailwind Prototype Tokens
    primary: '#0284C7',
    primaryDeep: '#006194',
    primaryContainer: '#007BB9',
    primaryLight: '#E0F2FE',
    primaryFixed: '#CCE5FF',
    primaryFixedDim: '#93CCFF',
    onPrimary: '#FFFFFF',
    onPrimaryFixed: '#001D31',
    onPrimaryFixedVariant: '#004B73',

    secondary: '#006E2D',
    secondaryContainer: '#7CF994',
    secondaryFixed: '#7FFC97',
    secondaryFixedDim: '#62DF7D',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#007230',
    onSecondaryFixed: '#002109',
    onSecondaryFixedVariant: '#005320',

    tertiary: '#A33900',
    tertiaryContainer: '#CC4900',
    tertiaryFixed: '#FFDBCE',
    tertiaryFixedDim: '#FFB599',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#FFFBFF',
    onTertiaryFixed: '#370E00',
    onTertiaryFixedVariant: '#7F2B00',

    surface: '#FAF8FF',
    surfaceBright: '#FAF8FF',
    surfaceDim: '#D2D9F4',
    surfaceVariant: '#DAE2FD',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F2F3FF',
    surfaceContainer: '#EAEDFF',
    surfaceContainerHigh: '#E2E7FF',
    surfaceContainerHighest: '#DAE2FD',

    onSurface: '#131B2E',
    onSurfaceVariant: '#3F4850',
    outline: '#707881',
    outlineVariant: '#BFC7D2',

    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
    onError: '#FFFFFF',

    inverseSurface: '#283044',
    inverseOnSurface: '#EEF0FF',
    inversePrimary: '#93CCFF',

    cardBackground: '#FFFFFF',
    border: '#BFC7D2',
    optimal: '#006E2D',
    warning: '#CC4900',
    critical: '#BA1A1A',
    offline: '#707881',
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
