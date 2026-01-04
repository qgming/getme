import { Audio } from 'expo-av';
import { Pause, Play, Square } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecordingModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (uri: string) => void;
}

export function RecordingModal({ visible, onClose, onComplete }: RecordingModalProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const breathAnim = useRef(new Animated.Value(1)).current;

  // 呼吸动画效果 - 只在录音且未暂停时显示
  useEffect(() => {
    if (visible && recording && !isPaused) {
      const breathAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      breathAnimation.start();
      return () => breathAnimation.stop();
    }
  }, [visible, recording, isPaused, breathAnim]);

  // 计时器 - 只在录音且未暂停时计时
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (visible && recording && !isPaused) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [visible, recording, isPaused]);

  // 每次打开模态框时创建新的录音
  useEffect(() => {
    let currentRecording: Audio.Recording | null = null;

    if (visible) {
      // 重置所有状态,确保是全新的开始
      setRecording(null);
      setIsPaused(false);
      setDuration(0);
      breathAnim.setValue(1);

      (async () => {
        try {
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          currentRecording = newRecording;
          setRecording(newRecording);
        } catch (error) {
          console.error('Recording failed:', error);
        }
      })();
    }

    return () => {
      // 清理:停止并卸载录音
      if (currentRecording) {
        currentRecording.stopAndUnloadAsync().catch(() => {});
      }
      // 重置所有状态
      setRecording(null);
      setIsPaused(false);
      setDuration(0);
    };
  }, [visible, breathAnim]);

  // 暂停/继续录音
  const togglePause = async () => {
    if (!recording) return;
    if (isPaused) {
      await recording.startAsync();
      setIsPaused(false);
    } else {
      await recording.pauseAsync();
      setIsPaused(true);
    }
  };

  // 完成录音
  const handleComplete = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) onComplete(uri);
    setRecording(null);
    setIsPaused(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
            <Text style={styles.date}>{new Date().toISOString().split('T')[0]}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.timeContainer}>
              <Text style={styles.currentTime}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.btnPause} onPress={togglePause}>
                {isPaused ? (
                  <Play size={24} color="#fff" fill="#fff" />
                ) : (
                  <Pause size={24} color="#fff" fill="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnComplete} onPress={handleComplete}>
                <Square size={20} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 110 },
  card: { backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 24, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  header: { marginBottom: 24 },
  recText: { fontSize: 14, color: '#fff', fontWeight: '600', letterSpacing: 1 },
  recDot: { color: '#ef4444', fontSize: 14 },
  date: { fontSize: 12, color: '#666', letterSpacing: 0.3, marginTop: 4 },
  footer: {},
  timeContainer: { marginBottom: 24 },
  currentTime: { fontSize: 56, color: '#fff', fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  btnPause: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  btnComplete: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
});
