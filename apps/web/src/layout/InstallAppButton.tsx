import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '../components/Modal';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); setInstructions(false); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', done); };
  }, []);

  async function install() {
    if (!prompt) { setInstructions(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === 'accepted') setInstalled(true);
  }

  if (installed) return null;
  return <>
    <button className="install-app-button" type="button" onClick={() => void install()}><Download size={16} /><span>Install web app</span></button>
    {instructions && <Modal title="Install web app" onClose={() => setInstructions(false)}>
      {isIos ? <p>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p> : <p>Use your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>. If that option is unavailable, open this site in Chrome, Edge, or Safari over HTTPS.</p>}
    </Modal>}
  </>;
}
