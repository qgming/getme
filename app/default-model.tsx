import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { ModelSelectionModal } from '../components/ModelSelectionModal';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';
import { useDefaultModelStore, AIFeature } from '../stores/defaultModelStore';

const FEATURES: { key: AIFeature; label: string }[] = [
  { key: 'transcription', label: 'AI转写' },
  { key: 'insights', label: 'AI洞察' },
  { key: 'avatar', label: 'AI分身' },
  { key: 'tag', label: 'AI标签' },
  { key: 'memory', label: 'AI记忆提取' },
];

export default function DefaultModelScreen() {
  const { colors } = useTheme();
  const { providers, loadProviders } = useAIStore();
  const { defaultModels, setDefaultModel, loadDefaultModels } = useDefaultModelStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);

  useEffect(() => {
    loadProviders();
    loadDefaultModels();
  }, [loadProviders, loadDefaultModels]);

  const handleFeaturePress = (feature: AIFeature) => {
    setSelectedFeature(feature);
    setModalVisible(true);
  };

  const handleModelSelect = async (modelId: string, providerId: string) => {
    if (selectedFeature) {
      await setDefaultModel(selectedFeature, modelId, providerId);
    }
  };

  const getModelName = (feature: AIFeature) => {
    const defaultModel = defaultModels[feature];
    if (!defaultModel) return '未设置';

    const provider = providers.find(p => p.id === defaultModel.providerId);
    const model = provider?.models?.find(m => m.id === defaultModel.modelId);
    return model ? model.name : '未设置';
  };

  const enabledProviders = providers.filter(p => p.isEnabled);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader title="默认模型" showBackButton />

        <ScrollView style={styles.content}>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.key}
              style={[styles.card, { backgroundColor: colors.surface }]}
              onPress={() => handleFeaturePress(feature.key)}
            >
              <View style={styles.cardLeft}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {feature.label}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardValue, { color: colors.textQuaternary }]}>
                  {getModelName(feature.key)}
                </Text>
                <ChevronRight size={20} color={colors.textQuaternary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedFeature && (
          <ModelSelectionModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setSelectedFeature(null);
            }}
            onSelect={handleModelSelect}
            providers={enabledProviders}
            title={FEATURES.find(f => f.key === selectedFeature)?.label || ''}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 14,
    marginRight: 4,
  },
});
