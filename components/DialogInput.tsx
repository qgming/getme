import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface DialogInputProps {
  visible: boolean;
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  placeholder?: string;
}

export function DialogInput({
  visible,
  title,
  value,
  onChangeText,
  onCancel,
  onConfirm,
  placeholder,
}: DialogInputProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={value}
            onChangeText={onChangeText}
            autoFocus
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    width: '80%',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
