import { useEffect, useRef, useState } from 'react';

type Props = { html: string; title: string; expand?: boolean; editable?: boolean; onChange?: (html: string) => void; onReady?: (document: Document, commit: () => void) => void };

export function BriefFrame({ html, title, expand = false, editable = false, onChange, onReady }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const removeInputListener = useRef<(() => void) | null>(null);
  const lastEmitted = useRef<string | null>(null);
  const [source, setSource] = useState(html);
  const [height, setHeight] = useState(1);
  const policy = `<meta data-brief-injected http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">`;
  const defaultTypography = '<style data-brief-injected>body{font-family:Arial,sans-serif;font-size:13px;line-height:1.6}body[contenteditable="true"]{min-height:260px;outline:none;cursor:text}</style>';

  useEffect(() => () => { observer.current?.disconnect(); removeInputListener.current?.(); }, []);
  useEffect(() => {
    if (editable && html !== lastEmitted.current && html !== source) setSource(html);
  }, [editable, html, source]);

  function onLoad() {
    removeInputListener.current?.();
    removeInputListener.current = null;
    observer.current?.disconnect();
    const document = frame.current?.contentDocument;
    if (!document) return;
    if (editable && document.body) {
      const body = document.body;
      body.contentEditable = 'true';
      body.setAttribute('aria-label', title);
      const sync = () => {
        const root = document.documentElement.cloneNode(true) as HTMLElement;
        root.querySelectorAll('[data-brief-injected]').forEach(node => node.remove());
        root.querySelector('body')?.removeAttribute('contenteditable');
        root.querySelector('body')?.removeAttribute('aria-label');
        const next = `${document.doctype ? '<!DOCTYPE html>' : ''}${root.outerHTML}`;
        lastEmitted.current = next;
        onChange?.(next);
      };
      body.addEventListener('input', sync);
      removeInputListener.current = () => body.removeEventListener('input', sync);
      onReady?.(document, sync);
    }
    if (!expand) return;
    const measure = () => setHeight(Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0, 1));
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(document.documentElement);
    if (document.body) observer.current.observe(document.body);
  }

  return <iframe
    ref={frame}
    className={`brief-frame${expand ? ' brief-frame-expanded' : ''}`}
    title={title}
    sandbox={expand || editable ? 'allow-same-origin' : ''}
    srcDoc={policy + defaultTypography + (editable ? source : html)}
    onLoad={onLoad}
    style={expand ? { height: `${height}px` } : undefined}
  />;
}
