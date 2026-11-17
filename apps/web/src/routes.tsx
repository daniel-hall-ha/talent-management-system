import { useEffect, useState } from 'react';
import type { Me } from './types';
import { AppShell } from './layout/AppShell';
import { CalendarPage } from './calendar/page';
import { NewEventPage } from './calendar/new/page';
import { ImportEventsPage } from './calendar/new/import';
import { EventPage } from './calendar/[id]/page';
import { UsersPage } from './users/page';
import { RolesPage } from './roles/page';
import { TrackerPage } from './tracker/page';
import { MarketTalentsPage } from './market-talents/page';

export type RoutePath = '/tracker' | '/calendar' | '/add' | '/import' | `/view?id=${string}` | `/edit?id=${string}` | '/users' | '/roles' | '/talents-database';

const routes: { path: RoutePath; permissions: string[] }[] = [
  { path: '/calendar', permissions: ['SOW_VIEW', 'SOW_VIEW_ALL', 'SOW_EDIT'] },
  { path: '/tracker', permissions: ['TRACKER_VIEW', 'TRACKER_VIEW_ALL', 'TRACKER_EDIT'] },
  { path: '/add', permissions: ['SOW_ADD'] },
  { path: '/import', permissions: ['SOW_ADD'] },
  { path: '/users', permissions: ['USER_VIEW'] },
  { path: '/roles', permissions: ['ROLE_VIEW'] },
  { path: '/talents-database', permissions: ['TALENT_DB_VIEW'] },
];

function availablePath(me: Me, requested: string): RoutePath | null {
  const url = new URL(requested, window.location.origin);
  const id = url.searchParams.get('id');
  if (url.pathname === '/view' && id && me.permissions.some(permission => ['SOW_VIEW','SOW_VIEW_ALL','SOW_EDIT'].includes(permission))) return `/view?id=${encodeURIComponent(id)}`;
  if (url.pathname === '/edit' && id && me.permissions.includes('SOW_EDIT') && me.permissions.includes('SOW_VIEW_ALL')) return `/edit?id=${encodeURIComponent(id)}`;
  const match = routes.find(route => route.path === url.pathname && route.permissions.some(permission => me.permissions.includes(permission)));
  return match?.path || routes.find(route => route.permissions.some(permission => me.permissions.includes(permission)))?.path || null;
}

export function Routes({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [path, setPath] = useState<RoutePath | null>(() => availablePath(me, window.location.pathname + window.location.search));
  const can = (permission: string) => me.permissions.includes(permission);

  useEffect(() => {
    function syncFromBrowser() { setPath(availablePath(me, window.location.pathname + window.location.search)); }
    window.addEventListener('popstate', syncFromBrowser);
    return () => window.removeEventListener('popstate', syncFromBrowser);
  }, [me]);
  useEffect(() => {
    if (path && window.location.pathname + window.location.search !== path) window.history.replaceState({}, '', path);
  }, [path]);

  function navigate(next: RoutePath) {
    const allowed = availablePath(me, next);
    if (!allowed) return;
    if (window.location.pathname + window.location.search !== allowed) window.history.pushState({}, '', allowed);
    setPath(allowed);
  }

  if (!path) return <div className="loading">No pages are available for this role.</div>;
  const eventRoute = path.startsWith('/view?id=') || path.startsWith('/edit?id=') ? new URL(path, window.location.origin) : null;
  const eventId = eventRoute?.searchParams.get('id');
  return <AppShell me={me} path={path} navigate={navigate} onLogout={onLogout}>
    {path === '/calendar' && <CalendarPage can={can} navigate={navigate} />}
    {path === '/tracker' && <TrackerPage can={can} />}
    {path === '/add' && <NewEventPage can={can} navigate={navigate} />}
    {path === '/import' && <ImportEventsPage can={can} navigate={navigate} />}
    {eventId && <EventPage key={path} eventId={eventId} mode={eventRoute?.pathname === '/edit' ? 'edit' : 'view'} can={can} navigate={navigate} />}
    {path === '/users' && <UsersPage me={me} can={can} />}
    {path === '/roles' && <RolesPage can={can} />}
    {path === '/talents-database' && <MarketTalentsPage can={can} />}
  </AppShell>;
}
