import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useNoteStore } from '../stores';

export default function RootLayout() {
  const initialize = useNoteStore(state => state.initialize);

  // 初始化应用
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
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
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}