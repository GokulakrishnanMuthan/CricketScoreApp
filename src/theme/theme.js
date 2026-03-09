import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
    customVariant: {
        fontFamily: 'System',
        fontWeight: '400',
        letterSpacing: 0.5,
        lineHeight: 22,
        fontSize: 14,
    }
};

export const theme = {
    ...MD3LightTheme,
    version: 3,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#1B4D3E', // Dark Green
        secondary: '#7CFC00', // Light Green
        secondaryContainer: '#E8F5E9',
        accent: '#FF8C00', // Orange
        background: '#F5F5F5',
        surface: '#FFFFFF',
        error: '#B00020',
        onPrimary: '#FFFFFF',
        onSecondary: '#000000',
        onSurface: '#1B4D3E',
    },
    roundness: 0,
};
