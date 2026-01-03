import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';

export default function AIProviderScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { providers } = useAIStore();

  const provider = providers.find(p => p.id === id);

  if (!provider) {
    return null;
  }

  const models = provider.models || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader title={provider.name} showBackButton />

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Base URL</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
              {provider.baseUrl}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>API Key</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {provider.apiKey ? '••••••••' + provider.apiKey.slice(-4) : '未设置'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>模型列表</Text>

        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.modelCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modelHeader}>
                <Ionicons name="cube-outline" size={20} color={colors.accent} />
                <Text style={[styles.modelName, { color: colors.text }]}>{item.name}</Text>
              </View>
              {item.description && (
                <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                暂无模型
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  modelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modelDesc: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
