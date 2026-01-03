import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LobeIcons from '@lobehub/icons-rn';
import { X, Search } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface IconPickerDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

const AI_ICONS = [
  'Adobe', 'AdobeFirefly', 'Agui', 'Ai2', 'Ai21', 'Ai302', 'Ai360', 'AiHubMix', 'AiMass',
  'AionLabs', 'AiStudio', 'AkashChat', 'AlephAlpha', 'Alibaba', 'AlibabaCloud', 'AntGroup',
  'Anthropic', 'Anyscale', 'Apple', 'Arcee', 'AssemblyAI', 'Automatic', 'Aws', 'Aya',
  'Azure', 'AzureAI', 'BAAI', 'Baichuan', 'Baidu', 'BaiduCloud', 'Bailian', 'Baseten',
  'Bedrock', 'Bfl', 'Bilibili', 'BilibiliIndex', 'Bing', 'BurnCloud', 'ByteDance', 'CapCut',
  'CentML', 'Cerebras', 'ChatGLM', 'Civitai', 'Claude', 'Cline', 'Clipdrop', 'Cloudflare',
  'CodeFlicker', 'CodeGeeX', 'CogVideo', 'CogView', 'Cohere', 'Colab', 'CometAPI', 'ComfyUI',
  'CommandA', 'Copilot', 'CopilotKit', 'Coqui', 'Coze', 'CrewAI', 'Crusoe', 'Cursor',
  'CyberCut', 'Dalle', 'Dbrx', 'DeepAI', 'DeepCogito', 'DeepInfra', 'DeepL', 'DeepMind',
  'DeepSeek', 'Dify', 'Doc2X', 'DocSearch', 'Dolphin', 'Doubao', 'DreamMachine', 'ElevenLabs',
  'ElevenX', 'EssentialAI', 'Exa', 'Fal', 'FastGPT', 'Featherless', 'Figma', 'Fireworks',
  'FishAudio', 'Flora', 'Flowith', 'Flux', 'Friendli', 'Gemini', 'Gemma', 'GiteeAI',
  'Github', 'GithubCopilot', 'Glama', 'Glif', 'GLMV', 'Google', 'GoogleCloud', 'Goose',
  'Gradio', 'Greptile', 'Grok', 'Groq', 'Hailuo', 'Haiper', 'Hedra', 'Higress', 'Huawei',
  'HuaweiCloud', 'HuggingFace', 'Hunyuan', 'Hyperbolic', 'IBM', 'Ideogram', 'IFlyTekCloud',
  'Inception', 'Inference', 'Infermatic', 'Infinigence', 'Inflection', 'InternLM', 'Jimeng',
  'Jina', 'Kimi', 'Kling', 'Kluster', 'Kolors', 'Krea', 'KwaiKAT', 'Kwaipilot', 'Lambda',
  'LangChain', 'Langfuse', 'LangGraph', 'LangSmith', 'LeptonAI', 'LG', 'Lightricks',
  'Liquid', 'LiveKit', 'LlamaIndex', 'LLaVA', 'LmStudio', 'LobeHub', 'LongCat', 'Lovable',
  'Luma', 'Magic', 'Make', 'Manus', 'Mastra', 'MCP', 'McpSo', 'Menlo', 'Meta', 'MetaAI',
  'MetaGPT', 'Microsoft', 'Midjourney', 'Minimax', 'Mistral', 'ModelScope', 'Monica',
  'Moonshot', 'Morph', 'MyShell', 'N8n', 'Nebius', 'NewAPI', 'NotebookLM', 'Notion',
  'NousResearch', 'Nova', 'NovelAI', 'Novita', 'NPLCloud', 'Nvidia', 'Ollama', 'OpenAI',
  'OpenChat', 'OpenRouter', 'OpenWebUI', 'PaLM', 'Parasail', 'Perplexity', 'Phidata',
  'Phind', 'Pika', 'PixVerse', 'Player2', 'Poe', 'Pollinations', 'PPIO', 'PydanticAI',
  'Qingyan', 'Qiniu', 'Qwen', 'Railway', 'Recraft', 'Relace', 'Replicate', 'Replit',
  'RSSHub', 'Runway', 'Rwkv', 'SambaNova', 'Search1API', 'SearchApi', 'SenseNova',
  'SiliconCloud', 'Skywork', 'Smithery', 'Snowflake', 'SophNet', 'Sora', 'Spark',
  'Stability', 'StateCloud', 'Stepfun', 'Straico', 'StreamLake', 'SubModel', 'Suno',
  'Sync', 'Targon', 'Tavily', 'Tencent', 'TencentCloud', 'Tiangong', 'TII', 'Together',
  'TopazLabs', 'Trae', 'Tripo', 'TuriX', 'Udio', 'Unstructured', 'Upstage', 'V0',
  'VectorizerAI', 'Vercel', 'VertexAI', 'Vidu', 'Viggle', 'Vllm', 'Volcengine', 'Voyage',
  'Wenxin', 'Windsurf', 'WorkersAI', 'XAI', 'Xinference', 'Xuanyuan', 'Yandex', 'Yi',
  'YouMind', 'Yuanbao', 'ZAI', 'Zapier', 'Zeabur', 'ZenMux', 'ZeroOne', 'Zhipu',
];

export function IconPickerDrawer({ visible, onClose, onSelect, selectedIcon }: IconPickerDrawerProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = AI_ICONS.filter(icon =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedIcons = filteredIcons.reduce((acc, icon) => {
    const firstChar = icon[0];
    const key = /\d/.test(firstChar) ? '0-9' : firstChar.toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(icon);
    return acc;
  }, {} as Record<string, string[]>);

  const sortedLetters = Object.keys(groupedIcons).sort((a, b) =>
    a === '0-9' ? -1 : b === '0-9' ? 1 : a.localeCompare(b)
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>选择图标</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.background }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索图标..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {sortedLetters.map((letter) => (
              <View key={letter} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{letter}</Text>
                <View style={styles.grid}>
                  {groupedIcons[letter].map((iconName) => {
                    const IconComponent = (LobeIcons as any)[iconName];
                    const isSelected = selectedIcon === iconName;

                    return (
                      <TouchableOpacity
                        key={iconName}
                        style={[
                          styles.iconItem,
                          { backgroundColor: colors.background },
                          isSelected && { backgroundColor: colors.accent + '20', borderColor: colors.accent, borderWidth: 2 }
                        ]}
                        onPress={() => {
                          onSelect(iconName);
                          onClose();
                        }}
                      >
                        {IconComponent?.Color && <IconComponent.Color size={32} />}
                        <Text style={[styles.iconName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {iconName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
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
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  iconName: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
});
