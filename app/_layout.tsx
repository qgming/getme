import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNoteStore, useThemeStore } from '../stores';

export default function RootLayout() {
  const initialize = useNoteStore(state => state.initialize);
  const loadThemeMode = useThemeStore(state => state.loadThemeMode);
  const updateColorScheme = useThemeStore(state => state.updateColorScheme);
  const colorScheme = useThemeStore(state => state.colorScheme);

  useEffect(() => {
    initialize();
    loadThemeMode();
  }, [initialize, loadThemeMode]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      updateColorScheme();
    });
    return () => subscription.remove();
  }, [updateColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-insights" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="note-editor" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="tag-notes" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}