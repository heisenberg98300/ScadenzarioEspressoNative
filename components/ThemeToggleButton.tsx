// components/ThemeToggleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type ThemeToggleButtonProps = {
  isDarkMode: boolean;
  onToggle: () => void;
};

export default function ThemeToggleButton({ isDarkMode, onToggle }: ThemeToggleButtonProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.button}>
      <Text style={styles.icon}>{isDarkMode ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
});