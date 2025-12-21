# GetMe Notes App

A modern React Native notes application optimized with **Expo Router** and **Zustand**.

## 🚀 Features

- ✨ **Expo Router** - File-based routing with type safety
- 🎯 **Zustand** - Modern state management with excellent performance
- 📱 **SQLite** - Local database storage
- 📝 **Markdown Support** - Rich text editing with preview
- 🔍 **Search** - Full-text search functionality
- 🏷️ **Tagging** - Organize notes with tags
- 🎨 **Modern UI** - Clean, responsive design

## 📦 Tech Stack

- **Framework**: Expo + React Native
- **Routing**: Expo Router v6
- **State Management**: Zustand v5
- **Database**: Expo SQLite
- **UI**: React Native + Ionicons
- **Markdown**: react-native-markdown-display

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

3. **Run TypeScript checks**
   ```bash
   npx tsc --noEmit
   ```

4. **Run linting**
   ```bash
   npm run lint
   ```

## 📁 Project Structure

```
app/                    # Expo Router pages
├── _layout.tsx        # Root layout with Zustand initialization
├── index.tsx          # Home screen - notes list
├── note-editor.tsx    # Create/edit notes
├── search.tsx         # Search functionality
└── sidebar.tsx        # Navigation menu

stores/                 # Zustand state management
├── noteStore.ts       # Main store with all logic
└── index.ts           # Public API

services/               # Data layer
└── database.ts        # SQLite operations

components/             # UI components
└── NoteCard.tsx       # Reusable note card

types/                  # TypeScript definitions
└── Note.ts            # Note interface & utilities
```

## 🎯 State Management

The app uses **Zustand** for state management, providing:

- ⚡ **Performance**: Only re-renders when specific state changes
- 🔒 **Type Safety**: Full TypeScript support
- 🎨 **Developer Experience**: Great IDE integration
- 📦 **Maintainability**: Clean separation of concerns

### Example Usage

```typescript
import { useNoteStore } from '../stores';

function MyComponent() {
  // Subscribe to specific state
  const notes = useNoteStore(state => state.notes);
  const createNote = useNoteStore(state => state.createNote);

  return (
    <View>
      {notes.map(note => (
        <Text key={note.id}>{note.title}</Text>
      ))}
    </View>
  );
}
```

## 🛠️ Development

### Code Quality
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Consistent project structure

### Available Scripts
```bash
npm start        # Start Expo development server
npm run android  # Start on Android
npm run ios      # Start on iOS
npm run web      # Start on web
npm run lint     # Run ESLint
```

## 📖 Documentation

- **[Optimization Guide](./OPTIMIZATION.md)** - Detailed migration from Context to Zustand
- **[Store Documentation](./stores/README.md)** - Complete Zustand API reference

## 🎨 Architecture Benefits

### Performance
- 🚀 Minimal re-renders with Zustand selectors
- 📊 Efficient state updates
- 🔄 Optimized database operations

### Developer Experience
- 🔍 Full type inference
- 🎯 Autocomplete support
- 📝 Clear separation of concerns

### Maintainability
- 🏗️ Scalable architecture
- 🧪 Easy to test
- 🔧 Simple to extend

## 🚀 Next Steps

1. Add user authentication
2. Implement cloud sync
3. Add export/import functionality
4. Dark mode support
5. Rich text formatting toolbar

## 📄 License

MIT