/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#000000'; // Changed from '#0a7ea4' to black
const tintColorDark = '#fff'; // Remains white

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#000000', // Changed from '#007AFF' (iOS Blue) to black
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#000000', // Changed from '#007AFF' to black
    card: '#f8f9fa',
    border: '#dedede',
    inputBackground: '#f0f0f0',
    placeholder: '#9a9a9a',
    primary: '#000000', // Changed from '#007AFF' to black
    secondary: '#5AC8FA', // Lighter blue - user might want to change this too if it clashes
    buttonText: '#fff',
    // Semantic colors
    error: '#FF3B30', // iOS Red
    success: '#34C759', // iOS Green
    warning: '#FF9500', // iOS Orange
    textMuted: '#8A8A8E', // Softer text color
    errorText: '#FF3B30',

  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    tint: '#FFFFFF', // Changed from '#0A84FF' (iOS Blue for dark mode) to white
    icon: '#98989E',
    tabIconDefault: '#98989E',
    tabIconSelected: '#FFFFFF', // Changed from '#0A84FF' to white
    card: '#1e1e1e',
    border: '#3a3a3c',
    inputBackground: '#2c2c2e',
    placeholder: '#7e7e82',
    primary: '#FFFFFF', // Changed from '#0A84FF' to white
    secondary: '#64D2FF', // Lighter blue for dark mode - user might want to change this too
    buttonText: '#fff',
    // Semantic colors
    error: '#FF453A', // iOS Red for dark mode
    success: '#30D158', // iOS Green for dark mode
    warning: '#FF9F0A', // iOS Orange for dark mode
    textMuted: '#8D8D93', // Softer text color for dark mode
    errorText: '#FF453A',
  },
};
