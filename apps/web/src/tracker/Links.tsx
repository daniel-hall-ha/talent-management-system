import { ExternalLink } from 'lucide-react';
import { SiFacebook, SiTiktok, SiYoutube } from 'react-icons/si';

export function LinkList({ links }: { links: string[] }) {
  if (!links.length) return <span className="tracker-muted">No links</span>;
  return <div className="tracker-links">{links.map((link, index) => {
    let host = '';
    let safe = false;
    try { const url = new URL(link); host = url.hostname.toLowerCase().replace(/^www\./, ''); safe = ['http:', 'https:'].includes(url.protocol); } catch { /* Invalid links are shown as text. */ }
    const Icon = host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com' ? SiFacebook
      : host === 'tiktok.com' || host.endsWith('.tiktok.com') ? SiTiktok
      : host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' ? SiYoutube
      : ExternalLink;
    return safe ? <a href={link} target="_blank" rel="noopener noreferrer" key={`${link}-${index}`} title={host || link}><Icon size={17} aria-hidden="true" /><span>{link}</span></a> : <span className="tracker-invalid-link" key={`${link}-${index}`}>{link}</span>;
  })}</div>;
}
