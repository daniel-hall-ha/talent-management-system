import { EditorContent, useEditor } from '@tiptap/react';
import { BriefFrame } from './BriefFrame';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';

type Props = { value: string; onChange: (value: string) => void };

export function RichTextEditor({ value, onChange }: Props) {
  const styledHtml = /<style\b|\sstyle\s*=|<!doctype|<html\b|<table\b|<img\b/i.test(value);
  if (styledHtml) return <div className="rich-text-editor"><p>Styled HTML brief</p><textarea aria-label="Brief HTML source" rows={12} value={value} onChange={event => onChange(event.target.value)} /><BriefFrame html={value} title="Brief preview" /></div>;
  return <BasicRichTextEditor value={value} onChange={onChange} />;
}

function BasicRichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { 'aria-label': 'Details', class: 'rich-text-content' } },
  });
  if (!editor) return null;

  const actions = [
    { label: 'Bold', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Heading', icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Bulleted list', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Undo', icon: Undo2, active: false, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, active: false, run: () => editor.chain().focus().redo().run() },
  ];
  return <div className="rich-text-editor">
    <div className="rich-text-toolbar" role="toolbar" aria-label="Details formatting">
      {actions.map(({ label, icon: Icon, active, run }) => <button key={label} type="button" title={label} aria-label={label} aria-pressed={active} className={active ? 'active' : ''} onClick={run}><Icon size={16} /></button>)}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
