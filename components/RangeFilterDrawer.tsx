import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export interface RangeFilter {
  time: string;
  notes: string;
  tags: string[];
}

interface RangeFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  allTags: string[];
  selectedFilters: RangeFilter;
  onApply: (filters: RangeFilter) => void;
}

const TIME_OPTIONS = ['最近7天', '最近15天', '最近30天', '最近100天', '最近365天'];
const NOTE_OPTIONS = ['最近10条', '最近50条', '最近100条'];

export default function RangeFilterDrawer({ visible, onClose, allTags, selectedFilters, onApply }: RangeFilterDrawerProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'time' | 'notes' | 'tags'>('time');
  const [filters, setFilters] = useState<RangeFilter>(selectedFilters);

  const toggleFilter = (category: keyof RangeFilter, value: string) => {
    setFilters(prev => {
      if (category === 'tags') {
        const isSelected = prev.tags.includes(value);
        return {
          time: '',
          notes: '',
          tags: isSelected
            ? prev.tags.filter(t => t !== value)
            : [...prev.tags, value]
        };
      }

      const isDeselecting = prev[category] === value;
      return {
        time: category === 'time' ? (isDeselecting ? '' : value) : '',
        notes: category === 'notes' ? (isDeselecting ? '' : value) : '',
        tags: []
      };
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const renderOptions = () => {
    let options: string[] = [];
    let category: keyof RangeFilter = 'time';

    if (activeTab === 'time') {
      options = TIME_OPTIONS;
      category = 'time';
    } else if (activeTab === 'notes') {
      options = NOTE_OPTIONS;
      category = 'notes';
    } else {
      options = allTags;
      category = 'tags';
    }

    return (
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = category === 'tags'
            ? filters[category].includes(option)
            : filters[category] === option;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionItem,
                { backgroundColor: colors.surface },
                isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
              ]}
              onPress={() => toggleFilter(category, option)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.drawer, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>选择范围</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
            {(['time', 'notes', 'tags'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: colors.primary }
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  { color: colors.text },
                  activeTab === tab && { color: '#fff', fontWeight: '600' }
                ]}>
                  {tab === 'time' ? '时间' : tab === 'notes' ? '笔记' : '标签'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content}>
            {renderOptions()}
          </ScrollView>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>应用</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
    borderRadius: 25,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  optionText: {
    fontSize: 14,
  },
  applyButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
