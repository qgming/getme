import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { AIProvider } from '../../stores/aiStore';
import { ProviderCard } from './ProviderCard';
import { ProviderEmptyState } from './ProviderEmptyState';

interface ProviderListProps {
  providers: AIProvider[];
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (provider: AIProvider) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/**
 * Provider list component
 * 作用：显示AI提供商列表的组件
 */
export function ProviderList({ providers, onToggle, onEdit, onDelete, onAdd }: ProviderListProps) {
  if (providers.length === 0) {
    return <ProviderEmptyState onAddProvider={onAdd} />;
  }

  return (
    <FlatList
      data={providers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProviderCard
          provider={item}
          onToggle={() => onToggle(item.id, !item.isEnabled)}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item.id)}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 12,
  },
});
