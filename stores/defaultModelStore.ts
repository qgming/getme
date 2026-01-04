import { create } from 'zustand';
import * as defaultModelsDb from '../database/defaultModels';

export type AIFeature = 'transcription' | 'insights' | 'parallel';

interface DefaultModelStore {
  defaultModels: Record<AIFeature, { modelId: string; providerId: string } | null>;
  setDefaultModel: (feature: AIFeature, modelId: string, providerId: string) => Promise<void>;
  loadDefaultModels: () => Promise<void>;
}

export const useDefaultModelStore = create<DefaultModelStore>((set, get) => ({
  defaultModels: {
    transcription: null,
    insights: null,
    parallel: null,
  },

  setDefaultModel: async (feature, modelId, providerId) => {
    await defaultModelsDb.setDefaultModel(feature, modelId, providerId);
    await get().loadDefaultModels();
  },

  loadDefaultModels: async () => {
    const models = await defaultModelsDb.getAllDefaultModels();
    const defaultModels: Record<AIFeature, { modelId: string; providerId: string } | null> = {
      transcription: null,
      insights: null,
      parallel: null,
    };

    models.forEach(model => {
      if (model.feature in defaultModels) {
        defaultModels[model.feature as AIFeature] = {
          modelId: model.modelId,
          providerId: model.providerId,
        };
      }
    });

    set({ defaultModels });
  },
}));
