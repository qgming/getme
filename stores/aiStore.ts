import { create } from 'zustand';
import * as aiDb from '../database/aiProviders';

export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  isEnabled: boolean;
  iconName?: string;
  models?: AIModel[];
}

interface AIStore {
  providers: AIProvider[];
  addProvider: (provider: Omit<AIProvider, 'id' | 'isEnabled' | 'models'>, models?: AIModel[]) => Promise<void>;
  updateProvider: (id: string, updates: Partial<Omit<AIProvider, 'id' | 'models'>>, models?: AIModel[]) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProvider: (id: string, isEnabled: boolean) => Promise<void>;
  loadProviders: () => Promise<void>;
}

export const useAIStore = create<AIStore>((set, get) => ({
  providers: [],

  addProvider: async (provider, models = []) => {
    const newProvider = await aiDb.createProvider({ ...provider, isEnabled: true });
    for (const model of models) {
      await aiDb.createModel({ ...model, providerId: newProvider.id });
    }
    await get().loadProviders();
  },

  updateProvider: async (id, updates, models) => {
    await aiDb.updateProvider(id, updates);
    if (models) {
      await aiDb.deleteModelsByProvider(id);
      for (const model of models) {
        await aiDb.createModel({ ...model, providerId: id });
      }
    }
    await get().loadProviders();
  },

  deleteProvider: async (id) => {
    await aiDb.deleteProvider(id);
    await get().loadProviders();
  },

  toggleProvider: async (id, isEnabled) => {
    await aiDb.updateProvider(id, { isEnabled });
    await get().loadProviders();
  },

  loadProviders: async () => {
    const providers = await aiDb.getAllProviders();
    const providersWithModels = await Promise.all(
      providers.map(async (p) => ({
        ...p,
        models: await aiDb.getModelsByProvider(p.id),
      }))
    );
    set({ providers: providersWithModels });
  },
}));
