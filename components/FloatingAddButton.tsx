import { Mic, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { RecordingModal } from './RecordingModal';

interface FloatingAddButtonProps {
  onPress: () => void;
}

export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  const [showRecording, setShowRecording] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, styles.leftButton]}
          onPress={() => setShowRecording(true)}
        >
          <Mic size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rightButton]}
          onPress={onPress}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>
      <RecordingModal
        visible={showRecording}
        onClose={() => setShowRecording(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    marginLeft: -80,
    bottom: 30,
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  button: {
    width: 80,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftButton: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightButton: {},
});
