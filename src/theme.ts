import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#D55500', // Orange
  primaryLight: '#FFB366',
  background: '#FFFBE6',
  card: '#FFF',
  accent: '#FFD700', // Gold
  text: '#222',
  textSecondary: '#555',
  border: '#EEE',
  error: '#D32F2F',
  success: '#78BE5E',
  info: '#1976D2',
  warning: '#FF9800', // Orange for warning state
};

export const fontSizes = {
  title: 32,
  subtitle: 20,
  body: 16,
  small: 13,
};

export const fontFamily = {
  regular: 'System', // Replace with your custom font if loaded
  bold: 'System',
};

export const textStyles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    color: colors.primary,
    fontWeight: 'bold',
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: fontSizes.subtitle,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: fontSizes.body,
    color: colors.text,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginVertical: 4,
  },
});
