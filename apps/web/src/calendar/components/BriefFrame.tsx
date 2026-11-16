type Props = { html: string; title: string };

export function BriefFrame({ html, title }: Props) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">`;
  return <iframe className="brief-frame" title={title} sandbox="" srcDoc={policy + html} />;
}
