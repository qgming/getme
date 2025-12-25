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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="note-editor"
          options={{
            headerShown: false,
            animation: 'none'
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            animation: 'none'
          }}
        />
        <Stack.Screen
          name="tag-notes"
          options={{
            headerShown: false,
            animation: 'none'
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}