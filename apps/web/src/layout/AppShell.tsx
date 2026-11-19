import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, ClipboardList, LogOut, ShieldCheck, UsersRound, Database, Menu, X } from 'lucide-react';
import type { Me } from '../types';
import type { RoutePath } from '../routes';
import { InstallAppButton } from './InstallAppButton';

const menu = [
  { path: '/calendar', title: 'SOW Calendar', permissions: ['SOW_VIEW','SOW_VIEW_ALL','SOW_EDIT'], icon: CalendarDays },
  { path: '/tracker', title: 'SOW Tracker', permissions: ['TRACKER_VIEW','TRACKER_VIEW_ALL','TRACKER_EDIT'], icon: ClipboardList },
  { path: '/talents-database', title: 'Talents Database', permissions: ['TALENT_DB_VIEW'], icon: Database },
  { path: '/users', title: 'User Management', permissions: ['USER_VIEW'], icon: UsersRound },
  { path: '/roles', title: 'User Roles', permissions: ['ROLE_VIEW'], icon: ShieldCheck },
] as const;

type Props = {
  me: Me;
  path: RoutePath;
  navigate: (path: RoutePath) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ me, path, navigate, onLogout, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => { setDrawerOpen(false); }, [path]);
  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [drawerOpen]);
  const title = path === '/import' ? 'Import Events' : path === '/add' ? 'New Event' : path.startsWith('/edit?id=') ? 'Edit Event' : path.startsWith('/view?id=') ? 'Event Details' : menu.find(item => item.path === path)?.title || 'Workspace';
  return <div className="shell">
    {drawerOpen && <button className="sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)} />}
    <aside id="app-sidebar" className={`sidebar${drawerOpen ? ' sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-icon"><CalendarDays size={21} /></div><div><strong>Talent Management</strong><small>Workspace</small></div><button className="icon-button sidebar-close" aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{menu.filter(item => item.permissions.some(permission => me.permissions.includes(permission))).map(({ path: itemPath, title: itemTitle, icon: Icon }) =>
        <a key={itemPath} href={itemPath} className={path === itemPath ? 'nav active' : 'nav'} onClick={event => { event.preventDefault(); setDrawerOpen(false); navigate(itemPath); }}><Icon size={18} />{itemTitle}</a>
      )}</nav>
      <div className="sidebar-bottom"><div className="avatar">{me.name.slice(0, 1).toUpperCase()}</div><div className="identity"><strong>{me.name}</strong><small>{me.role}</small></div><button className="icon-button" aria-label="Log out" onClick={onLogout}><LogOut size={18} /></button></div>
    </aside>
    <main className="main"><header className="topbar"><button className="icon-button sidebar-toggle" aria-label="Open navigation menu" aria-controls="app-sidebar" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Menu size={21} /></button><div className="crumb">Workspace <span>/</span> {title}</div><div className="topbar-actions"><InstallAppButton /><div className="top-user">{me.name.slice(0, 1).toUpperCase()}</div></div></header><div className="content">{children}</div></main>
  </div>;
}
