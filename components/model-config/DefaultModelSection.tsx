import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAIStore } from '../../stores/aiStore';
import { useDefaultModelStore, AIFeature } from '../../stores/defaultModelStore';
import { DefaultModelItem } from './DefaultModelItem';
import { ModelSelectionModal } from '../model-selection/ModelSelectionModal';

const FEATURES: { key: AIFeature; label: string }[] = [
  { key: 'transcription', label: 'AI转写' },
  { key: 'insights', label: 'AI洞察' },
  { key: 'avatar', label: 'AI分身' },
  { key: 'tag', label: 'AI标签' },
  { key: 'memory', label: 'AI记忆提取' },
];

/**
 * Default model section component
 * 作用：默认模型配置区域组件
 */
export function DefaultModelSection() {
  const { colors } = useTheme();
  const { providers } = useAIStore();
  const { defaultModels, setDefaultModel } = useDefaultModelStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);

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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>默认模型</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          为不同功能选择默认模型
        </Text>
      </View>

      <View style={styles.sectionContent}>
        {FEATURES.map((feature) => (
          <DefaultModelItem
            key={feature.key}
            feature={feature.key}
            featureName={feature.label}
            currentModel={getModelName(feature.key)}
            onPress={() => handleFeaturePress(feature.key)}
          />
        ))}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  sectionContent: {
    // Content styles
  },
});
