import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Search, Brain, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface MemorySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  isExtracting?: boolean;
  onExtract?: () => void;
  onClear?: () => void;
}

/**
 * 记忆搜索栏组件
 * 作用：输入关键词搜索记忆内容，并提供清空记忆和手动提取记忆功能
 */
export const MemorySearchBar: React.FC<MemorySearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  isExtracting = false,
  onExtract,
  onClear,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="搜索记忆内容..."
          placeholderTextColor={colors.textQuaternary}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          multiline={false}
          numberOfLines={1}
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={onSearch}
        >
          <Search size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        {onClear && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.error }]}
            onPress={onClear}
          >
            <Trash2 size={18} color="#fff" />
            <Text style={styles.buttonText}>清空记忆</Text>
          </TouchableOpacity>
        )}
        {onExtract && (
          <TouchableOpacity
            style={[styles.extractButton, { backgroundColor: colors.primary }]}
            onPress={onExtract}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>提取中...</Text>
              </>
            ) : (
              <>
                <Brain size={18} color="#fff" />
                <Text style={styles.buttonText}>手动提取记忆</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  extractButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
