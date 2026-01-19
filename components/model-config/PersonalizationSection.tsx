import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getPersonalizationInfo } from '../../database/personalization';
import { PersonalizationForm } from './PersonalizationForm';

interface PersonalizationSectionProps {
  onChange?: (name: string, about: string) => void;
}

/**
 * Personalization section component
 * 作用：个性化信息配置区域组件
 */
export function PersonalizationSection({ onChange }: PersonalizationSectionProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    loadPersonalizationInfo();
  }, []);

  const loadPersonalizationInfo = async () => {
    try {
      const info = await getPersonalizationInfo();
      if (info) {
        setName(info.name || '');
        setAbout(info.about || '');
      }
    } catch (error) {
      console.error('Failed to load personalization info:', error);
    }
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    onChange?.(newName, about);
  };

  const handleAboutChange = (newAbout: string) => {
    setAbout(newAbout);
    onChange?.(name, newAbout);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>个性化</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          帮助AI更好地了解你
        </Text>
      </View>

      <View style={styles.sectionContent}>
        <PersonalizationForm
          initialName={name}
          initialAbout={about}
          onNameChange={handleNameChange}
          onAboutChange={handleAboutChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
});
