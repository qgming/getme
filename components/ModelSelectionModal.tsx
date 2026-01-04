import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { AIProvider } from '../stores/aiStore';

interface ModelSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (modelId: string, providerId: string) => void;
  providers: AIProvider[];
  title: string;
}

export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  providers,
  title,
}) => {
  const { colors } = useTheme();
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id || '');

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.providerContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providerScrollContent}
            >
              {providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.providerTab,
                    { backgroundColor: colors.background },
                    selectedProviderId === provider.id && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => setSelectedProviderId(provider.id)}
                >
                  <Text
                    style={[
                      styles.providerName,
                      { color: selectedProviderId === provider.id ? '#fff' : colors.text },
                    ]}
                  >
                    {provider.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.modelList} showsVerticalScrollIndicator={false}>
            {selectedProvider?.models?.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[styles.modelCard, {
                  backgroundColor: colors.background,
                  borderColor: colors.border || colors.text + '20',
                }]}
                onPress={() => {
                  onSelect(model.id, selectedProviderId);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modelName, { color: colors.text }]}>
                  {model.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  providerContainer: {
    paddingVertical: 12,
  },
  providerScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  providerTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  modelList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modelCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
  },
});
