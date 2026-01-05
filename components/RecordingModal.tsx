import { AudioModule, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import { Check, Pause, Play, Square, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { transcribeAudio } from '../services/transcription';
import { useNoteStore } from '../stores/noteStore';
import { showToast } from './Toast';

interface RecordingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RecordingModal({ visible, onClose }: RecordingModalProps) {
  const createNote = useNoteStore((state) => state.createNote);
  const audioRecorder = useAudioRecorder({
    extension: '.mp3',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {
      extension: '.mp3',
      outputFormat: 'mpeg4' as any,
      audioEncoder: 'aac' as any,
    },
    ios: {
      extension: '.mp3',
      outputFormat: 'mpeg4Layer3' as any,
      audioQuality: 96,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  });
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isPaused, setIsPaused] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && recorderState.isRecording && !isPaused) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      breathAnim.setValue(1);
    }
  }, [visible, recorderState.isRecording, isPaused, breathAnim]);

  useEffect(() => {
    if (!visible) return;

    setIsPaused(false);
    setUri(null);
    setIsTranscribing(false);
    setFinalDuration(0);

    let cancelled = false;

    const start = async () => {
      try {
        const { granted } = await AudioModule.requestRecordingPermissionsAsync();
        if (!granted) {
          showToast('请在设置中开启麦克风权限', 'error');
          onClose();
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        if (!cancelled) {
          audioRecorder.record();
        }
      } catch (error) {
        console.error('录音启动失败:', error);
        showToast('录音启动失败', 'error');
        onClose();
      }
    };

    start();

    return () => {
      cancelled = true;
      if (audioRecorder.isRecording) {
        audioRecorder.stop();
      }
    };
  }, [visible]);

  const togglePause = () => {
    try {
      if (recorderState.isRecording) {
        audioRecorder.pause();
        setIsPaused(true);
      } else {
        audioRecorder.record();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('暂停/继续失败:', error);
      showToast('操作失败', 'error');
    }
  };

  const handleComplete = async () => {
    try {
      setFinalDuration(recorderState.durationMillis);
      await audioRecorder.stop();
      const recordingUri = audioRecorder.uri;
      if (recordingUri) {
        setUri(recordingUri);
      } else {
        showToast('获取录音文件失败', 'error');
      }
    } catch (error) {
      console.error('停止录音失败:', error);
      showToast('停止录音失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (uri) {
      try {
        const file = new File(uri);
        file.delete();
      } catch (error) {
        console.error('删除录音文件失败:', error);
      }
    }
    onClose();
  };

  const handleConfirm = async () => {
    if (!uri) {
      console.log('handleConfirm: uri is null');
      return;
    }
    console.log('handleConfirm: starting transcription, uri:', uri);
    setIsTranscribing(true);
    showToast('AI转写中...', 'info', 0);
    try {
      const text = await transcribeAudio(uri);
      console.log('handleConfirm: transcription result:', text);
      await createNote({ content: text, tags: [] });
      const file = new File(uri);
      file.delete();
      showToast('转写成功', 'success');
      onClose();
    } catch (error) {
      console.error('handleConfirm: error:', error);
      showToast(error instanceof Error ? error.message : '转写失败', 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.recText}>REC </Text>
              <Animated.Text style={[styles.recDot, { opacity: breathAnim }]}>●</Animated.Text>
            </View>
            <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.timeContainer}>
              <Text style={styles.currentTime}>{formatTime(uri ? finalDuration : recorderState.durationMillis)}</Text>
            </View>

            {!uri ? (
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.btnPause} onPress={togglePause}>
                  {isPaused ? <Play size={24} color="#fff" fill="#fff" /> : <Pause size={24} color="#fff" fill="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnComplete} onPress={handleComplete}>
                  <Square size={20} color="#fff" fill="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttons}>
                {isTranscribing ? (
                  <ActivityIndicator size="large" color="#10b981" />
                ) : (
                  <>
                    <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                      <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
                      <Check size={24} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 110 },
  card: { backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  recText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  recDot: { color: '#ef4444', fontSize: 14 },
  date: { fontSize: 12, color: '#666' },
  footer: {},
  timeContainer: { marginBottom: 24 },
  currentTime: { fontSize: 56, color: '#fff', fontWeight: '700', fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  btnPause: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  btnComplete: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  btnDelete: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  btnConfirm: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
});
