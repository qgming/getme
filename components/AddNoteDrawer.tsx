import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';

interface AddNoteDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const DRAFT_KEY = 'addNoteDrawerDraft';

export function AddNoteDrawer({ visible, onClose }: AddNoteDrawerProps) {
  const { colors } = useTheme();
  const { createNote } = useNoteStore();
  const [content, setContent] = useState('');
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(draft => {
      if (draft) setContent(draft);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, content);
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!content.trim()) return;
    await createNote({ content: content.trim(), tags: [] });
    setContent('');
    await AsyncStorage.removeItem(DRAFT_KEY);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.drawer, { backgroundColor: colors.surface }]}
            >
              <TextInput
                ref={textInputRef}
                style={[styles.input, { color: colors.textSecondary }]}
                placeholder="输入内容..."
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.toolbar}>
                <View style={styles.toolbarLeft} />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: content.trim() ? '#10b981' : colors.textMuted }
                  ]}
                  onPress={handleSave}
                  disabled={!content.trim()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // minHeight: 300,
  },
  input: {
    fontSize: 18,
    lineHeight: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    minHeight: 200,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    paddingBottom: 16,
  },
  toolbarLeft: {
    flex: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
