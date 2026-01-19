import { initDatabase } from './index';
import { Note } from '../types/Note';

export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const db = await initDatabase();
    const result = await db.getAllAsync<Note & { tags: string | null }>(
      'SELECT * FROM notes ORDER BY updatedAt DESC'
    );

    return result.map(note => {
      let parsedTags: string[] = [];
      try {
        parsedTags = note.tags ? JSON.parse(note.tags) : [];
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch {
        parsedTags = [];
      }
      return { ...note, tags: parsedTags };
    });
  } catch {
    return [];
  }
};

export const getNoteById = async (id: string): Promise<Note | null> => {
  try {
    if (!id) return null;

    const db = await initDatabase();
    const result = await db.getFirstAsync<Note & { tags: string | null }>(
      'SELECT * FROM notes WHERE id = ?',
      [String(id)]
    );

    if (!result) return null;

    let parsedTags: string[] = [];
    try {
      parsedTags = result.tags ? JSON.parse(result.tags) : [];
      if (!Array.isArray(parsedTags)) parsedTags = [];
    } catch {
      parsedTags = [];
    }

    return { ...result, tags: parsedTags };
  } catch {
    return null;
  }
};

export const saveNote = async (note: Omit<Note, 'createdAt'> & { createdAt?: string }): Promise<Note> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const noteToSave = {
    id: note.id || `note_${Date.now()}`,
    content: note.content || '',
    createdAt: note.createdAt || now,
    updatedAt: now,
    tags: note.tags || [],
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO notes (id, content, createdAt, updatedAt, tags)
     VALUES (?, ?, ?, ?, ?)`,
    [noteToSave.id, noteToSave.content, noteToSave.createdAt, noteToSave.updatedAt, JSON.stringify(noteToSave.tags)]
  );

  return noteToSave;
};

export const deleteNote = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [String(id)]);
};

export const searchNotes = async (query: string): Promise<Note[]> => {
  try {
    if (!query.trim()) return [];

    const db = await initDatabase();
    const searchTerm = `%${query.trim()}%`;

    const result = await db.getAllAsync<Note & { tags: string | null }>(
      `SELECT * FROM notes WHERE content LIKE ? OR tags LIKE ? ORDER BY updatedAt DESC`,
      [searchTerm, searchTerm]
    );

    return result.map(note => {
      let parsedTags: string[] = [];
      try {
        parsedTags = note.tags ? JSON.parse(note.tags) : [];
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch {
        parsedTags = [];
      }
      return { ...note, tags: parsedTags };
    });
  } catch {
    return [];
  }
};

export const getStats = async (): Promise<{
  totalNotes: number;
  monthlyNotes: number;
  taggedNotes: number;
}> => {
  try {
    const db = await initDatabase();

    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes'
    );

    const monthlyResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes WHERE createdAt >= date('now', '-30 days')`
    );

    const taggedResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes WHERE tags IS NOT NULL AND tags != '[]'`
    );

    return {
      totalNotes: totalResult?.count || 0,
      monthlyNotes: monthlyResult?.count || 0,
      taggedNotes: taggedResult?.count || 0,
    };
  } catch {
    return { totalNotes: 0, monthlyNotes: 0, taggedNotes: 0 };
  }
};

export const getNotesByTags = async (
  tags: string[],
  matchMode: 'any' | 'all' = 'any',
  limit: number = 10
): Promise<Note[]> => {
  try {
    if (!tags || tags.length === 0) return [];

    const db = await initDatabase();
    const safeLimit = Math.min(Math.max(1, limit), 50);

    if (matchMode === 'any') {
      // OR logic: note has at least one of the tags
      const conditions = tags.map(() => 'tags LIKE ?').join(' OR ');
      const params = tags.map(tag => `%"${tag}"%`);

      const result = await db.getAllAsync<Note & { tags: string | null }>(
        `SELECT * FROM notes WHERE ${conditions} ORDER BY updatedAt DESC LIMIT ?`,
        [...params, safeLimit]
      );

      return result.map(note => {
        let parsedTags: string[] = [];
        try {
          parsedTags = note.tags ? JSON.parse(note.tags) : [];
          if (!Array.isArray(parsedTags)) parsedTags = [];
        } catch {
          parsedTags = [];
        }
        return { ...note, tags: parsedTags };
      });
    } else {
      // AND logic: note has all of the tags
      // Fetch candidates and filter in JavaScript for accuracy
      const conditions = tags.map(() => 'tags LIKE ?').join(' AND ');
      const params = tags.map(tag => `%"${tag}"%`);

      const result = await db.getAllAsync<Note & { tags: string | null }>(
        `SELECT * FROM notes WHERE ${conditions} ORDER BY updatedAt DESC`,
        params
      );

      // Filter to ensure all tags are present
      const filtered = result.filter(note => {
        let noteTags: string[] = [];
        try {
          noteTags = note.tags ? JSON.parse(note.tags) : [];
          if (!Array.isArray(noteTags)) noteTags = [];
        } catch {
          noteTags = [];
        }
        return tags.every(tag => noteTags.includes(tag));
      });

      return filtered.slice(0, safeLimit).map(note => {
        let parsedTags: string[] = [];
        try {
          parsedTags = note.tags ? JSON.parse(note.tags) : [];
          if (!Array.isArray(parsedTags)) parsedTags = [];
        } catch {
          parsedTags = [];
        }
        return { ...note, tags: parsedTags };
      });
    }
  } catch (error) {
    console.error('getNotesByTags error:', error);
    return [];
  }
};

export const getNotesByTimeRange = async (
  daysAgo: number,
  dateField: 'createdAt' | 'updatedAt' = 'updatedAt',
  limit: number = 10
): Promise<Note[]> => {
  try {
    if (daysAgo < 0) return [];

    const db = await initDatabase();
    const safeLimit = Math.min(Math.max(1, limit), 50);

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db.getAllAsync<Note & { tags: string | null }>(
      `SELECT * FROM notes WHERE ${dateField} >= ? ORDER BY ${dateField} DESC LIMIT ?`,
      [cutoffISO, safeLimit]
    );

    return result.map(note => {
      let parsedTags: string[] = [];
      try {
        parsedTags = note.tags ? JSON.parse(note.tags) : [];
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch {
        parsedTags = [];
      }
      return { ...note, tags: parsedTags };
    });
  } catch (error) {
    console.error('getNotesByTimeRange error:', error);
    return [];
  }
};

export const getAllUniqueTags = async (): Promise<string[]> => {
  try {
    const db = await initDatabase();
    const result = await db.getAllAsync<{ tags: string | null }>(
      'SELECT tags FROM notes WHERE tags IS NOT NULL AND tags != "[]"'
    );

    const tagsSet = new Set<string>();
    result.forEach(row => {
      try {
        const parsedTags = row.tags ? JSON.parse(row.tags) : [];
        if (Array.isArray(parsedTags)) {
          parsedTags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              tagsSet.add(tag);
            }
          });
        }
      } catch {
        // Skip invalid JSON
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('getAllUniqueTags error:', error);
    return [];
  }
};
