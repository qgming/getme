import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LobeIcons from '@lobehub/icons-rn';
import { useTheme } from '../../hooks/useTheme';
import { AIProvider } from '../../stores/aiStore';
import { IconPickerDrawer } from '../model-selection/IconPickerDrawer';

interface ProviderConfigDrawerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (config: { name: string; apiKey: string; baseUrl: string; iconName?: string }) => void;
  editProvider?: AIProvider;
}

/**
 * Provider configuration drawer component
 * 作用：用于添加或编辑AI提供商配置的抽屉组件
 */
export function ProviderConfigDrawer({ visible, onClose, onConfirm, editProvider }: ProviderConfigDrawerProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [iconName, setIconName] = useState<string | undefined>();
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (editProvider) {
      setName(editProvider.name);
      setApiKey(editProvider.apiKey);
      setBaseUrl(editProvider.baseUrl);
      setIconName(editProvider.iconName);
    } else {
      setName('');
      setApiKey('');
      setBaseUrl('');
      setIconName(undefined);
    }
  }, [editProvider, visible]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm({ name, apiKey, baseUrl, iconName });
      setName('');
      setApiKey('');
      setBaseUrl('');
      setIconName(undefined);
    }
  };

  const handleClose = () => {
    setName('');
    setApiKey('');
    setBaseUrl('');
    setIconName(undefined);
    onClose();
  };

  const IconComponent = iconName ? (LobeIcons as any)[iconName] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior="padding"
              style={[styles.container, { backgroundColor: colors.surface }]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {editProvider ? '编辑AI配置' : '添加AI配置'}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>图标</Text>
                  <TouchableOpacity
                    style={[styles.iconSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowIconPicker(true)}
                  >
                    <View style={styles.iconPreview}>
                      {IconComponent?.Avatar ? (
                        <IconComponent.Avatar size={24} />
                      ) : (
                        <Ionicons name="sparkles" size={24} color={colors.textSecondary} />
                      )}
                      <Text style={[styles.iconText, { color: colors.text }]}>
                        {iconName || '选择图标'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>名称</Text>
                  <TextInput
                    style={[styles.input, {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="例如：OpenAI"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>API Key</Text>
                  <TextInput
                    style={[styles.input, {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="sk-..."
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Base URL</Text>
                  <TextInput
                    style={[styles.input, {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}
                    value={baseUrl}
                    onChangeText={setBaseUrl}
                    placeholder="https://api.openai.com/v1"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </ScrollView>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.accent },
                    !name.trim() && styles.buttonDisabled
                  ]}
                  onPress={handleConfirm}
                  disabled={!name.trim()}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>确定</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      <IconPickerDrawer
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={setIconName}
        selectedIcon={iconName}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  iconSelector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconText: {
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
