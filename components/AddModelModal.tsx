import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface AddModelModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { id: string; name: string }) => void;
  initialData?: { id: string; name: string };
}

export function AddModelModal({ visible, onClose, onConfirm, initialData }: AddModelModalProps) {
  const { colors } = useTheme();
  const [id, setId] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setId(initialData?.id || '');
      setName(initialData?.name || '');
    }
  }, [visible, initialData]);

  const handleConfirm = () => {
    if (id.trim() && name.trim()) {
      onConfirm({ id: id.trim(), name: name.trim() });
      setId('');
      setName('');
    }
  };

  const handleClose = () => {
    setId('');
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {initialData ? '编辑模型' : '添加模型'}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>ID</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={id}
                  onChangeText={setId}
                  placeholder="例如：gpt-4"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>名称</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="例如：GPT-4"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

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
                    (!id.trim() || !name.trim()) && styles.buttonDisabled
                  ]}
                  onPress={handleConfirm}
                  disabled={!id.trim() || !name.trim()}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
