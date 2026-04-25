import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Users, Shield, UserPlus, Search, MoreHorizontal
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers, mockRoleDefinitions, User, RoleDefinition } from '@/data/mockUsers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const allPermissions = [
  'manage_users', 'manage_workflows', 'manage_settings',
  'approve', 'review', 'upload', 'assign', 'create_po', 'comment', 'view',
];

export default function RolesUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<RoleDefinition[]>(mockRoleDefinitions);
  const [searchUser, setSearchUser] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Viewer', department: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });

  const filteredUsers = users.filter(u =>
    !searchUser || u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleAddUser = () => {
    const newUser: User = {
      id: `user-${Date.now()}`, name: userForm.name, email: userForm.email,
      role: userForm.role, department: userForm.department, status: 'active',
    };
    setUsers([...users, newUser]);
    setShowAddUser(false);
    setUserForm({ name: '', email: '', role: 'Viewer', department: '' });
    toast.success('User added successfully');
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast.success('User removed');
  };

  const openRoleCreate = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleEditor(true);
  };

  const openRoleEdit = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description, permissions: role.permissions });
    setShowRoleEditor(true);
  };

  const handleSaveRole = () => {
    if (editingRole) {
      setRoles(roles.map(r =>
        r.id === editingRole.id ? { ...r, name: roleForm.name, description: roleForm.description, permissions: roleForm.permissions } : r
      ));
      toast.success('Role updated');
    } else {
      setRoles([...roles, {
        id: `role-${Date.now()}`, name: roleForm.name, description: roleForm.description,
        permissions: roleForm.permissions, userCount: 0,
      }]);
      toast.success('Role created');
    }
    setShowRoleEditor(false);
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
    toast.success('Role deleted');
  };

  const togglePermission = (perm: string) => {
    setRoleForm({
      ...roleForm,
      permissions: roleForm.permissions.includes(perm)
        ? roleForm.permissions.filter(p => p !== perm)
        : [...roleForm.permissions, perm],
    });
  };

  return (
    <MainLayout title="Roles & Users" subtitle="Manage user accounts and role-based access">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="w-4 h-4 mr-2" />Roles</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setShowAddUser(true)}><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
          </div>

          <div className="enterprise-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{user.department}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="w-4 h-4 mr-2 text-destructive" />Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{roles.length} roles configured</div>
            <Button onClick={openRoleCreate}><Plus className="w-4 h-4 mr-2" />Create Role</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <div key={role.id} className="enterprise-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                      <p className="text-xs text-muted-foreground">{role.userCount} users</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openRoleEdit(role)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs">{p.replace('_', ' ')}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account and assign a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="john@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} placeholder="Engineering" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={!userForm.name || !userForm.email}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Editor Dialog */}
      <Dialog open={showRoleEditor} onOpenChange={setShowRoleEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit' : 'Create'} Role</DialogTitle>
            <DialogDescription>Define role name, description, and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Approver" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="What this role can do" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 p-4 rounded-lg border border-border">
                {allPermissions.map(perm => (
                  <div key={perm} className="flex items-center gap-2">
                    <Checkbox
                      checked={roleForm.permissions.includes(perm)}
                      onCheckedChange={() => togglePermission(perm)}
                    />
                    <span className="text-sm text-foreground capitalize">{perm.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleEditor(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={!roleForm.name}>{editingRole ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
