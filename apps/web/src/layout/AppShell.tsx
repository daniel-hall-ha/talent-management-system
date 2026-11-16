import type { ReactNode } from 'react';
import { CalendarDays, LogOut, ShieldCheck, UsersRound } from 'lucide-react';
import type { Me } from '../types';
import type { RoutePath } from '../routes';

const menu = [
  { path: '/calendar', title: 'SOW Calendar', permission: 'SOW_VIEW', icon: CalendarDays },
  { path: '/users', title: 'User Management', permission: 'USER_VIEW', icon: UsersRound },
  { path: '/roles', title: 'User Roles', permission: 'ROLE_VIEW', icon: ShieldCheck },
] as const;

type Props = {
  me: Me;
  path: RoutePath;
  navigate: (path: RoutePath) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ me, path, navigate, onLogout, children }: Props) {
  const title = path === '/import' ? 'Import Events' : path === '/add' ? 'New Event' : path.startsWith('/edit?id=') ? 'Edit Event' : path.startsWith('/view?id=') ? 'Event Details' : menu.find(item => item.path === path)?.title || 'Workspace';
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><CalendarDays size={21} /></div><div><strong>Talent Management</strong><small>Workspace</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{menu.filter(item => me.permissions.includes(item.permission)).map(({ path: itemPath, title: itemTitle, icon: Icon }) =>
        <a key={itemPath} href={itemPath} className={path === itemPath ? 'nav active' : 'nav'} onClick={event => { event.preventDefault(); navigate(itemPath); }}><Icon size={18} />{itemTitle}</a>
      )}</nav>
      <div className="sidebar-bottom"><div className="avatar">{me.name.slice(0, 1).toUpperCase()}</div><div className="identity"><strong>{me.name}</strong><small>{me.role}</small></div><button className="icon-button" aria-label="Log out" onClick={onLogout}><LogOut size={18} /></button></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">Workspace <span>/</span> {title}</div><div className="top-user">{me.name.slice(0, 1).toUpperCase()}</div></header><div className="content">{children}</div></main>
  </div>;
}
