import { create } from 'zustand';
import { InsightRecord } from '../types/Insight';
import * as insightDb from '../database/insights';

interface InsightStore {
  records: InsightRecord[];
  loadRecords: () => Promise<void>;
  saveRecord: (record: Omit<InsightRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useInsightStore = create<InsightStore>((set, get) => ({
  records: [],

  loadRecords: async () => {
    try {
      const records = await insightDb.getAllInsightRecords();
      set({ records });
    } catch (error) {
      console.error('加载洞察记录失败:', error);
    }
  },

  saveRecord: async (record) => {
    try {
      const newRecord = await insightDb.saveInsightRecord(record);
      set({ records: [newRecord, ...get().records] });
    } catch (error) {
      console.error('保存洞察记录失败:', error);
    }
  },

  deleteRecord: async (id) => {
    try {
      await insightDb.deleteInsightRecord(id);
      set({ records: get().records.filter(r => r.id !== id) });
    } catch (error) {
      console.error('删除洞察记录失败:', error);
    }
  },
}));
