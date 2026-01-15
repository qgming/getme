<div align="center">

# Getme

### AI 懂你，记录真我

<img src="./assets/images/icon.png" alt="GetMe Logo" width="140" height="140">

**一款融合 AI 深度洞察的智能笔记应用**

用 AI 理解你的思考，用标签组织你的想法，用洞察发现真实的自我

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[功能特性](#-功能特性) • [技术架构](#-技术架构) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发指南](#-开发指南)

</div>

---

## 📖 项目简介

Getme 是一款基于 React Native 开发的 AI 智能笔记应用，它不仅是记录工具，更是你的思维伙伴。通过集成先进的 AI 能力，Getme 能够：

- 🧠 **深度理解**：运用 25+ 种心理学和认知科学框架分析你的笔记
- 🏷️ **智能组织**：自动提取人物、地点、时间、主题等关键标签
- 🎤 **语音记录**：实时语音转文字，随时捕捉灵感
- 💾 **本地优先**：所有数据存储在本地 SQLite 数据库，隐私安全可控
- 🎨 **优雅设计**：现代化 UI 设计，支持深色模式

## ✨ 功能特性

### 🤖 AI 智能洞察

Getme 的核心特性是 **AI 洞察引擎**，提供 25+ 种专业分析框架，帮助你从多个维度理解自己的思考：

<details>
<summary><b>心理与认知分析</b></summary>

- **心智模型识别** - 发现你的思维模式和决策框架
- **认知偏差检测** - 识别思维中的系统性偏差
- **防御机制分析** - 理解潜意识的自我保护机制
- **情绪地图绘制** - 追踪情绪变化的模式和触发因素
- **阴影工作** - 探索被压抑的人格侧面（荣格心理学）
- **CBT 认知重构** - 识别并挑战非理性信念

</details>

<details>
<summary><b>价值与成长分析</b></summary>

- **价值澄清** - 发现你真正重视的核心价值观
- **ACT 疗法框架** - 接纳与承诺疗法的应用
- **成长审计** - 追踪个人成长的轨迹和里程碑
- **学习分析** - 评估知识获取和技能发展

</details>

<details>
<summary><b>系统与战略思维</b></summary>

- **系统思考** - 识别事件间的因果关系和反馈循环
- **反向思维** - 从相反角度审视问题
- **事前验尸** - 预测可能的失败点和风险
- **知识连接** - 发现不同领域知识的交叉点

</details>

<details>
<summary><b>更多分析维度</b></summary>

- 隐藏假设挖掘、决策树分析、时间投资审计
- 关系动态分析、能量管理、创造力模式
- 问题重构、元认知反思、叙事身份
- 以及更多专业框架...

</details>

**智能筛选**：支持按时间范围（最近 7/15/30/100/365 天）、笔记数量（最近 10/50/100 条）或特定标签筛选笔记进行分析。

### 🏷️ AI 智能标签

自动分析笔记内容，智能提取五大类标签：

- 👤 **人物** - 真实姓名、知名人物
- 📚 **作品** - 书籍、电影、音乐等文化作品
- 📍 **地点** - 具体的地理位置
- ⏰ **时间** - 时间节点和时期
- 💡 **主题** - 核心话题和概念

标签管理功能：

- 固定常用标签到顶部
- 重命名标签（批量更新所有笔记）
- 删除标签（可选择是否同时删除相关笔记）
- 按标签筛选和浏览笔记

### 🎤 AI 语音转文字

- 支持多种音频格式（m4a, mp3, wav, webm, opus）
- 实时录音并转写为文字
- 集成 SenseVoiceSmall 模型，识别准确度高
- 一键插入到笔记编辑器

### 📝 核心笔记功能

- **快速创建** - 浮动按钮 + 底部抽屉，随时记录想法
- **自动保存** - 2 秒防抖自动保存，无需手动操作
- **全文搜索** - 快速查找任何笔记内容
- **Markdown 支持** - 富文本渲染，支持格式化显示
- **时间追踪** - 自动记录创建和更新时间
- **统计分析** - 总笔记数、月度笔记、标签统计

### 🎨 用户体验

- **深色模式** - 自动跟随系统主题或手动切换
- **响应式设计** - 适配各种屏幕尺寸
- **流畅动画** - 自然的页面过渡和交互反馈
- **安全区域适配** - 完美支持刘海屏和手势导航

### 依赖项

<details>
<summary>查看完整依赖列表</summary>

**核心框架**

- `react` ^19.1.0
- `react-native` 0.81.5
- `expo` ~54.0.30
- `expo-router` ~6.0.21

**状态与存储**

- `zustand` ^5.0.9
- `@react-native-async-storage/async-storage` 2.2.0
- `expo-sqlite` ~16.0.10

**UI 组件**

- `lucide-react-native` ^0.562.0
- `react-native-markdown-display` ^7.0.2
- `react-native-gesture-handler` ~2.28.0
- `react-native-safe-area-context` ~5.6.0

**功能模块**

- `expo-audio` ~1.1.1 (录音)
- `expo-clipboard` ~8.0.8 (剪贴板)
- `expo-file-system` ~19.0.21 (文件操作)
- `react-native-sse` ^1.2.1 (流式响应)

**开发工具**

- `typescript` ~5.9.2
- `eslint` ^9.25.0

</details>

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- iOS: Xcode 14+ (macOS)
- Android: Android Studio + JDK 17

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/yourusername/getme.git
cd getme
```

2. **安装依赖**

```bash
npm install
```

3. **配置 AI 服务（可选）**

创建 `.env` 文件并添加 API 密钥：

```env
XIAOMI_MIMO_API_KEY=your_xiaomi_api_key
SILICONFLOW_API_KEY=your_siliconflow_api_key
```

> 注意：AI 功能是可选的，不配置也可以正常使用笔记功能。

4. **启动开发服务器**

```bash
# 启动 Expo 开发服务器
npm start

# 或直接运行特定平台
npm run ios      # iOS 模拟器
npm run android  # Android 模拟器/设备
npm run web      # Web 浏览器
```

5. **构建生产版本**

```bash
# Android 预览版本
npm run build:android:preview

# 使用 EAS Build 构建
eas build --platform android
eas build --platform ios
```

## 🔧 开发指南

### 添加新的 AI 洞察提示词

在 [constants/insightPrompts.ts](constants/insightPrompts.ts) 中添加新的提示词：

```typescript
export const INSIGHT_PROMPTS = [
  {
    id: "your-prompt-id",
    title: "你的分析标题",
    description: "简短描述这个分析的作用",
    systemPrompt: "系统提示词，定义 AI 的角色和分析方法",
    userPromptTemplate: "用户提示词模板，{notes} 会被替换为实际笔记内容",
  },
  // ... 其他提示词
];
```

### 添加新的 AI 提供商

1. 在应用的 AI 设置页面点击"添加提供商"
2. 填写提供商信息（名称、API Key、Base URL）
3. 添加支持的模型列表
4. 在各功能中选择默认使用的模型

### 数据库迁移

当需要修改数据库结构时，在 [services/migrations.ts](services/migrations.ts) 中添加新的迁移：

```typescript
const migrations = [
  // 现有迁移...
  {
    version: 3,
    up: async (db: SQLiteDatabase) => {
      // 执行 SQL 语句修改数据库结构
      await db.execAsync(`
        ALTER TABLE notes ADD COLUMN new_field TEXT;
      `);
    },
  },
];
```

### 自定义主题

在 [constants/Colors.ts](constants/Colors.ts) 中修改颜色配置：

```typescript
export const Colors = {
  light: {
    primary: "#10b981", // 主色调
    background: "#ffffff", // 背景色
    text: "#000000", // 文字颜色
    // ... 其他颜色
  },
  dark: {
    // 深色模式配置
  },
};
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 配置规则
- 组件使用函数式组件 + Hooks
- 状态管理优先使用 Zustand
- 提交信息遵循 Conventional Commits 规范

## 🙏 致谢

- [Expo](https://expo.dev/) - 优秀的 React Native 开发框架
- [Zustand](https://github.com/pmndrs/zustand) - 简洁的状态管理库
- [Lucide](https://lucide.dev/) - 精美的图标库
- 所有开源贡献者

## 📮 联系方式

- 项目主页: [https://github.com/qgming/getme](https://github.com/qgming/getme)
- 问题反馈: [Issues](https://github.com/qgming/getme/issues)

---

<div align="center">

**用 AI 理解自己，用笔记记录成长**

Made with ❤️ by Getme Team

</div>
