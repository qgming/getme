import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useTheme } from '../hooks/useTheme';

export default function AIAvatarScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* 页面内容待实现 */}
      </ScrollView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title="AI分身"
          showBackButton
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 100,
  },
});
