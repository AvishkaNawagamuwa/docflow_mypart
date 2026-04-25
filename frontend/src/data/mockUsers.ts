export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export const mockUsers: User[] = [
  { id: 'user-1', name: 'John Smith', email: 'john.smith@company.com', role: 'Department Manager', department: 'Engineering', status: 'active' },
  { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'Finance Approver', department: 'Finance', status: 'active' },
  { id: 'user-3', name: 'Mike Wilson', email: 'mike.w@company.com', role: 'Procurement Officer', department: 'Procurement', status: 'active' },
  { id: 'user-4', name: 'Robert Chen', email: 'robert.c@company.com', role: 'CFO', department: 'Finance', status: 'active' },
  { id: 'user-5', name: 'Emily Brown', email: 'emily.b@company.com', role: 'CEO', department: 'Executive', status: 'active' },
  { id: 'user-6', name: 'Alice Cooper', email: 'alice.c@company.com', role: 'User', department: 'Operations', status: 'active' },
  { id: 'user-7', name: 'David Lee', email: 'david.l@company.com', role: 'Procurement Officer', department: 'Procurement', status: 'inactive' },
  { id: 'user-8', name: 'Carol Davis', email: 'carol.d@company.com', role: 'Legal Reviewer', department: 'Legal', status: 'active' },
];

export const mockRoleDefinitions: RoleDefinition[] = [
  { id: 'role-1', name: 'Admin', description: 'Full system access including configuration and user management', permissions: ['manage_users', 'manage_workflows', 'manage_settings', 'approve', 'review'], userCount: 2 },
  { id: 'role-2', name: 'Department Manager', description: 'Can approve documents and manage department workflows', permissions: ['approve', 'review', 'upload', 'assign'], userCount: 3 },
  { id: 'role-3', name: 'Finance Approver', description: 'Financial document approval authority', permissions: ['approve', 'review', 'upload'], userCount: 2 },
  { id: 'role-4', name: 'Procurement Officer', description: 'Manages procurement documents and workflows', permissions: ['upload', 'review', 'create_po'], userCount: 4 },
  { id: 'role-5', name: 'Legal Reviewer', description: 'Reviews and approves legal documents', permissions: ['review', 'approve', 'comment'], userCount: 2 },
  { id: 'role-6', name: 'Viewer', description: 'Read-only access to documents and workflow status', permissions: ['view'], userCount: 8 },
];
