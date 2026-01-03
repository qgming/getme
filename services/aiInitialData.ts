import * as aiDb from './aiDatabase';

export const initializeDefaultProviders = async () => {
  const providers = await aiDb.getAllProviders();

  if (providers.length === 0) {
    const openai = await aiDb.createProvider({
      name: 'OpenAI',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      isEnabled: true,
      iconName: 'OpenAI',
    });

    await aiDb.createModel({
      id: 'gpt-4',
      providerId: openai.id,
      name: 'GPT-4',
    });

    await aiDb.createModel({
      id: 'gpt-3.5-turbo',
      providerId: openai.id,
      name: 'GPT-3.5 Turbo',
    });
  }
};
