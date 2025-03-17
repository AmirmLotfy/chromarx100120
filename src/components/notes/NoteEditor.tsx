import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Note } from '@/types/note';
import { NoteEditorProps } from './NoteEditorProps';

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel, defaultCategory }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState<string>(note?.category || defaultCategory || 'General');
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral'>(note?.sentiment || 'neutral');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category || defaultCategory || 'General');
      setSentiment(note.sentiment || 'neutral');
      setTags(note.tags?.join(', ') || '');
    }
  }, [note, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onSave({
        title,
        content,
        category,
        sentiment,
        tags: tagArray,
        userId: note?.userId || 'demo-user-id',
        color: note?.color,
        pinned: note?.pinned || false,
        folder: note?.folder,
        bookmarkIds: note?.bookmarkIds
      });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSentimentChange = (value: string) => {
    setSentiment(value as 'positive' | 'negative' | 'neutral');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-medium"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Ideas">Ideas</SelectItem>
              <SelectItem value="Projects">Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={sentiment} onValueChange={handleSentimentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Textarea
          placeholder="Write your note here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px]"
          required
        />
      </div>

      <div>
        <Input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
};

export default NoteEditor;
