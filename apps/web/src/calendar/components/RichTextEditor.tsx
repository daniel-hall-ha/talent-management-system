import { useEffect, useRef } from 'react';
import { BriefFrame } from './BriefFrame';
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';

type Props = { value: string; onChange: (value: string) => void };
const fontFamilies = ['Arial', 'Georgia', 'Times New Roman', 'Courier New'];
const fontSizes = [12, 13, 14, 16, 18, 20, 24, 28, 32];

export function RichTextEditor({ value, onChange }: Props) {
  const documentRef = useRef<Document | null>(null);
  const commitRef = useRef<(() => void) | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const removeSelectionListener = useRef<(() => void) | null>(null);
  useEffect(() => () => removeSelectionListener.current?.(), []);

  function onReady(document: Document, commit: () => void) {
    removeSelectionListener.current?.();
    documentRef.current = document;
    commitRef.current = commit;
    const saveRange = () => {
      const selection = document.getSelection();
      if (selection?.rangeCount && document.body.contains(selection.anchorNode)) rangeRef.current = selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener('selectionchange', saveRange);
    removeSelectionListener.current = () => document.removeEventListener('selectionchange', saveRange);
  }

  function selectionInFrame() {
    const document = documentRef.current;
    if (!document) return null;
    document.body.focus();
    const selection = document.getSelection();
    const saved = rangeRef.current;
    if (selection && saved && document.body.contains(saved.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(saved.cloneRange());
    }
    return selection;
  }

  function applyTextStyle(property: 'fontFamily' | 'fontSize', value: string) {
    const document = documentRef.current;
    const selection = selectionInFrame();
    if (!document || !selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; start: number; end: number }[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (range.intersectsNode(node) && !node.parentElement?.closest('style,script')) nodes.push({
        node,
        start: range.startContainer === node ? range.startOffset : 0,
        end: range.endContainer === node ? range.endOffset : node.length,
      });
    }
    const wrappers: HTMLSpanElement[] = [];
    for (const { node, start, end } of nodes.reverse()) {
      if (start >= end) continue;
      if (end < node.length) node.splitText(end);
      const selected = start ? node.splitText(start) : node;
      const span = document.createElement('span');
      span.style[property] = value;
      selected.parentNode?.replaceChild(span, selected);
      span.appendChild(selected);
      wrappers.unshift(span);
    }
    if (!wrappers.length) return;
    const selectedRange = document.createRange();
    selectedRange.setStartBefore(wrappers[0]);
    selectedRange.setEndAfter(wrappers[wrappers.length - 1]);
    selection.removeAllRanges();
    selection.addRange(selectedRange);
    rangeRef.current = selectedRange.cloneRange();
    commitRef.current?.();
  }

  function run(command: string, value?: string) {
    const document = documentRef.current;
    if (!document) return;
    selectionInFrame();
    document.execCommand(command, false, value);
    commitRef.current?.();
  }

  const actions = [
    { label: 'Bold', icon: Bold, run: () => run('bold') },
    { label: 'Italic', icon: Italic, run: () => run('italic') },
    { label: 'Heading', icon: Heading2, run: () => run('formatBlock', documentRef.current?.queryCommandValue('formatBlock').toLowerCase() === 'h2' ? 'p' : 'h2') },
    { label: 'Bulleted list', icon: List, run: () => run('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, run: () => run('insertOrderedList') },
    { label: 'Undo', icon: Undo2, run: () => run('undo') },
    { label: 'Redo', icon: Redo2, run: () => run('redo') },
  ];
  return <div className="rich-text-editor">
    <div className="rich-text-toolbar" role="toolbar" aria-label="Details formatting">
      <select aria-label="Font family" title="Select text to change its font" value="" onChange={event => applyTextStyle('fontFamily', event.target.value)}><option value="">Font family</option>{fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}</select>
      <select aria-label="Font size" title="Select text to change its size" value="" onChange={event => applyTextStyle('fontSize', event.target.value)}><option value="">Font size</option>{fontSizes.map(size => <option key={size} value={`${size}px`}>{size}px</option>)}</select>
      {actions.map(({ label, icon: Icon, run }) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={event => event.preventDefault()} onClick={run}><Icon size={16} /></button>)}
    </div>
    <BriefFrame html={value} title="Edit brief" editable onChange={onChange} onReady={onReady} />
  </div>;
}
