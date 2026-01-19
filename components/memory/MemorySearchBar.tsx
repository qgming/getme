import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Search, Brain } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface MemorySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  isExtracting?: boolean;
  onExtract?: () => void;
}

/**
 * 记忆搜索栏组件
 * 作用：输入关键词搜索记忆内容，并提供手动提取记忆功能
 */
export const MemorySearchBar: React.FC<MemorySearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  isExtracting = false,
  onExtract,
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
      {onExtract && (
        <TouchableOpacity
          style={[styles.extractButton, { backgroundColor: colors.primary }]}
          onPress={onExtract}
          disabled={isExtracting}
        >
          {isExtracting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.extractButtonText}>提取中...</Text>
            </>
          ) : (
            <>
              <Brain size={18} color="#fff" />
              <Text style={styles.extractButtonText}>手动提取记忆</Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
  extractButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  extractButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
