import { useEffect, useRef, useState } from 'react';

type Props = { html: string; title: string; expand?: boolean };

export function BriefFrame({ html, title, expand = false }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(1);
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">`;

  useEffect(() => () => observer.current?.disconnect(), []);

  function fitContent() {
    if (!expand) return;
    observer.current?.disconnect();
    const document = frame.current?.contentDocument;
    if (!document) return;
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
    sandbox={expand ? 'allow-same-origin' : ''}
    srcDoc={policy + html}
    onLoad={fitContent}
    style={expand ? { height: `${height}px` } : undefined}
  />;
}
