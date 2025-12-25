import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNoteStore } from '../stores';

export default function RootLayout() {
  const initialize = useNoteStore(state => state.initialize);

  // 初始化应用
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="note-editor"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="sidebar"
          options={{
            headerShown: false,
            animation: 'slide_from_left'
          }}
        />
        <Stack.Screen
          name="tag-notes"
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}