import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  FileText, 
  Settings, 
  Users, 
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Activity,
  Bell,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, AppRole, DASHBOARD_ROUTES } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  roles?: AppRole[]; // if undefined, all roles can see it
}

const getMainNavItems = (role: AppRole): NavItem[] => [
  { label: 'Dashboard', icon: LayoutDashboard, path: DASHBOARD_ROUTES[role] },
  { label: 'Documents', icon: FileText, path: '/documents' },
  { label: 'Instances', icon: Activity, path: '/instances' },
  { label: 'Workflows', icon: GitBranch, path: '/workflows', roles: ['admin', 'supervisor'] },
];

const configNavItems: NavItem[] = [
  { label: 'Dashboard Builder', icon: LayoutDashboard, path: '/dashboard-templates', roles: ['admin'] },
  { label: 'Analytics & Charts', icon: Activity, path: '/analytics-config', roles: ['admin'] },
  { label: 'Document Types', icon: FolderOpen, path: '/document-types', roles: ['admin'] },
  { label: 'Roles & Users', icon: Users, path: '/roles', roles: ['admin'] },
  { label: 'Notifications', icon: Bell, path: '/notifications', badge: 3, roles: ['admin'] },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role || 'staff';

  const isActive = (path: string) => {
    if (path.startsWith('/dashboard/')) return location.pathname === path;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const canSee = (item: NavItem) => !item.roles || item.roles.includes(role);

  const mainItems = getMainNavItems(role).filter(canSee);
  const configItems = configNavItems.filter(canSee);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-accent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Workflow className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              DocFlow
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-item",
                isActive(item.path) && "sidebar-item-active"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {configItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="mt-8 mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
                Configuration
              </div>
            )}
            
            <div className={cn("space-y-1", collapsed && "mt-8")}>
              {configItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "sidebar-item",
                    isActive(item.path) && "sidebar-item-active"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Help Section */}
      <div className="px-3 py-4 border-t border-sidebar-accent">
        <Link
          to="/help"
          className="sidebar-item"
          title={collapsed ? "Help & Support" : undefined}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Help & Support</span>}
        </Link>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
