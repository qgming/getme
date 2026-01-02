import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useTheme } from '../hooks/useTheme';

export default function AIInsightsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <CustomHeader title="AI 洞察" showBackButton />

      <View style={styles.container}>
        <Ionicons name="sparkles-outline" size={64} color={colors.textQuaternary} />
        <Text style={[styles.placeholderText, { color: colors.textQuaternary }]}>AI 洞察功能</Text>
        <Text style={[styles.placeholderSubtext, { color: colors.textMuted }]}>即将推出</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
});
