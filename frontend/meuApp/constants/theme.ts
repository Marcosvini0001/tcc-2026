/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Design system palette (from provided mockups)
const Palette = {
  mint: '#00E5A0', // principal
  teal: '#00BFA6', // secundária
  azure: '#3A8EF6', // info / XP
  indigo: '#9B8FF4', // conquistas
  gold: '#FFC700', // ranking / destaque
  cloud: '#F0F2F7', // títulos
  silver: '#CBCEDB', // texto body muted
  slate: '#A2B1C8', // muted
  surface: '#151820', // cards
  surface2: '#1C2431',
  surface3: '#222A3C',
  base: '#0A0F1F', // background
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    primary: Palette.mint,
    secondary: Palette.teal,
    accent: Palette.azure,
    highlight: Palette.gold,
    surface: '#F6F7F9',
    muted: Palette.slate,
    card: '#FFFFFF',
    border: '#2A2F36',
  },
  dark: {
    text: '#F4F7FB',
    background: Palette.base,
    primary: Palette.mint,
    secondary: Palette.teal,
    accent: Palette.azure,
    highlight: Palette.gold,
    surface: Palette.surface,
    muted: Palette.silver,
    card: Palette.surface2,
    border: '#0F1422',
  },
};

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
    // Prefer the design fonts; fallbacks provided for web
    display: "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    heading: "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    body: "'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Tokens = {
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 18,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  shadow: {
    card: '0 4px 20px rgba(0,0,0,0.4)',
    glowMint: '0 0 18px rgba(0,229,160,0.25)',
  },
};

export default {
  Colors,
  Fonts,
  Tokens,
};
