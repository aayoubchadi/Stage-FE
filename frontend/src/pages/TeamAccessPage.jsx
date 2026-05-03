import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, Edit2, Plus, Search, Shield, Users } from 'lucide-react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Label } from '../components/ui/label.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { getSession } from '../lib/authStore';
import { buildPermissionMapFromList, PERMISSION_KEYS, PERMISSION_PRESETS } from '../lib/permissions';
import {
  createCompanyEmployee,
  getCompanyContext,
  getCompanyEmployees,
  updateCompanyEmployee,
  updateCompanyEmployeeStatus,
} from '../services/companyApi';

const PERMISSION_DETAILS = {
  'employees.view': {
    label: 'Employees View',
    description: 'List employees in the company database',
  },
  'employees.manage': {
    label: 'Employees Manage',
    description: 'Create, edit, and activate/deactivate employees',
  },
  'inventory.view': {
    label: 'Inventory View',
    description: 'View products and stock levels',
  },
  'inventory.manage': {
    label: 'Inventory Manage',
    description: 'Create and update products',
  },
  'stock.move': {
    label: 'Stock Move',
    description: 'Record stock movement transactions',
  },
  'data.import': {
    label: 'Data Import',
    description: 'Import products from CSV',
  },
  'data.export': {
    label: 'Data Export',
    description: 'Export products to CSV',
  },
  'reports.view': {
    label: 'Reports View',
    description: 'Access reporting views and dashboards',
  },
};

const EMPTY_PERMISSIONS = buildPermissionMapFromList([]);

const DEFAULT_FORM = {
  fullName: '',
  email: '',
  password: '',
  presetKey: '',
  permissions: EMPTY_PERMISSIONS,
};

function titleizePermission(permission) {
  return PERMISSION_DETAILS[permission]?.label || permission.replace(/\./g, ' ');
}

function permissionDescription(permission) {
  return PERMISSION_DETAILS[permission]?.description || '';
}

function permissionMapToList(permissionMap) {
  return PERMISSION_KEYS.filter((permission) => Boolean(permissionMap?.[permission]));
}

function permissionsFromPreset(presetKey) {
  const preset = PERMISSION_PRESETS.find((item) => item.key === presetKey);
  return buildPermissionMapFromList(preset?.permissions || []);
}

function normalizeEmployeeRow(employee) {
  return {
    ...employee,
    fullName: employee.fullName || employee.full_name || '',
    isActive: Boolean(employee.isActive ?? employee.is_active),
    permissionList: Array.isArray(employee.permissionList)
      ? employee.permissionList
      : permissionMapToList(employee.permissions),
  };
}

export default function TeamAccessPage() {
  const [session] = useState(() => getSession());
  const [context, setContext] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const accessToken = session?.accessToken;

  const loadData = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [contextData, employeeData] = await Promise.all([
        getCompanyContext({ accessToken }),
        getCompanyEmployees({ accessToken }),
      ]);

      setContext(contextData || null);
      setEmployees(
        Array.isArray(employeeData?.employees)
          ? employeeData.employees.map(normalizeEmployeeRow)
          : []
      );
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message || 'Unable to load team data.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const capacityLabel = useMemo(() => {
    const active = context?.capacity?.activeEmployees || 0;
    const max = context?.capacity?.maxEmployees || 0;
    return `${active} / ${max}`;
  }, [context]);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesQuery =
        query.length === 0 ||
        String(employee.fullName || '').toLowerCase().includes(query) ||
        String(employee.email || '').toLowerCase().includes(query) ||
        String(employee.role || '').toLowerCase().includes(query);
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && employee.isActive) ||
        (selectedStatus === 'inactive' && !employee.isActive);

      return matchesQuery && matchesStatus;
    });
  }, [employees, searchQuery, selectedStatus]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.isActive).length,
    [employees]
  );

  const adminEmployees = useMemo(
    () => employees.filter((employee) => employee.role === 'company_admin').length,
    [employees]
  );

  const openAddDialog = () => {
    setSelectedEmployee(null);
    setForm(DEFAULT_FORM);
    setIsAddDialogOpen((current) => !current);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setForm(DEFAULT_FORM);
  };

  const openEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setForm({
      fullName: employee.fullName || '',
      email: employee.email || '',
      password: '',
      presetKey: '',
      permissions: buildPermissionMapFromList(employee.permissionList || []),
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    setForm(DEFAULT_FORM);
  };

  const handleAddEmployee = async (event) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const created = await createCompanyEmployee({
        accessToken,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        presetKey: form.presetKey || undefined,
        permissions: form.permissions,
      });

      if (created?.employee?.id) {
        await updateCompanyEmployee({
          accessToken,
          employeeId: created.employee.id,
          fullName: form.fullName,
          permissions: form.permissions,
        });
      }

      setMessage('Employee created successfully.');
      setMessageType('success');
      closeAddDialog();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Unable to create employee.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!accessToken || !selectedEmployee) {
      return;
    }

    setIsUpdating(true);
    setMessage('');
    setMessageType('');

    try {
      await updateCompanyEmployee({
        accessToken,
        employeeId: selectedEmployee.id,
        fullName: form.fullName,
        presetKey: form.presetKey || undefined,
        permissions: form.permissions,
      });

      setMessage('Employee privileges updated.');
      setMessageType('success');
      closeEditDialog();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Unable to update employee privileges.');
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleEmployeeStatus = async (employee) => {
    if (!accessToken) {
      return;
    }

    setIsUpdating(true);
    setMessage('');
    setMessageType('');

    try {
      await updateCompanyEmployeeStatus({
        accessToken,
        employeeId: employee.id,
        isActive: !employee.isActive,
      });

      await loadData();
    } catch (error) {
      setMessage(error.message || 'Unable to update employee status.');
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <PageBackground />
      <Header isDashboard={true} />
      <main className="section section-shell dashboard-page">
        <section className="dashboard-head">
          <p className="eyebrow">Team & Access</p>
          <h1>Manage employee accounts and privileges</h1>
          <p>
            Employee capacity: <strong>{capacityLabel}</strong>
          </p>
        </section>

        {isLoading ? <p className="dashboard-state">Loading team data...</p> : null}
        {!isLoading && message ? <p className={`form-message ${messageType}`}>{message}</p> : null}

        {!isLoading ? (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{employees.length}</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Active</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{activeEmployees}</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">Admins</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{adminEmployees}</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                </div>
                <p className="mt-2 text-3xl font-bold">
                  {employees.filter((employee) => !employee.isActive).length}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openAddDialog} className="!w-full !bg-blue-600 !text-white !hover:bg-blue-700 sm:!w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>

            {isAddDialogOpen ? (
              <section className="rounded-lg border bg-card p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Add New Employee</h3>
                  <p className="text-sm text-muted-foreground">Create a new employee account and assign privileges</p>
                </div>
                <form className="grid gap-4" onSubmit={handleAddEmployee}>
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="presetKey">Preset</Label>
                      <Select
                        value={form.presetKey}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            presetKey: value,
                            permissions: permissionsFromPreset(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Custom only" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom only</SelectItem>
                          {(context?.permissionPresets || Object.values(PERMISSION_PRESETS)).map((preset) => (
                            <SelectItem key={preset.key} value={preset.key}>
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Permissions</Label>
                      <p className="text-xs text-muted-foreground">These are the backend permission keys used by the app.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-lg border p-4">
                    {PERMISSION_KEYS.map((permission) => (
                      <div key={permission} className="flex items-start space-x-3">
                        <Checkbox
                          id={permission}
                          checked={Boolean(form.permissions[permission])}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              permissions: {
                                ...current.permissions,
                                [permission]: Boolean(checked),
                              },
                            }))
                          }
                        />
                        <div className="grid gap-1">
                          <Label htmlFor={permission} className="cursor-pointer font-medium">
                            {titleizePermission(permission)}
                          </Label>
                          <p className="text-sm text-muted-foreground">{permissionDescription(permission)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={closeAddDialog} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
                      {isSubmitting ? 'Creating...' : 'Add Employee'}
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}

            {isEditDialogOpen ? (
              <section className="rounded-lg border bg-card p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Edit Employee</h3>
                  <p className="text-sm text-muted-foreground">Update employee name and privileges</p>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-fullName">Full Name</Label>
                    <Input
                      id="edit-fullName"
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-presetKey">Preset</Label>
                    <Select
                      value={form.presetKey}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          presetKey: value,
                          permissions: permissionsFromPreset(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Custom only" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom only</SelectItem>
                        {(context?.permissionPresets || Object.values(PERMISSION_PRESETS)).map((preset) => (
                          <SelectItem key={preset.key} value={preset.key}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 rounded-lg border p-4">
                    {PERMISSION_KEYS.map((permission) => (
                      <div key={permission} className="flex items-start space-x-3">
                        <Checkbox
                          id={`edit-${permission}`}
                          checked={Boolean(form.permissions[permission])}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              permissions: {
                                ...current.permissions,
                                [permission]: Boolean(checked),
                              },
                            }))
                          }
                        />
                        <div className="grid gap-1">
                          <Label htmlFor={`edit-${permission}`} className="cursor-pointer font-medium">
                            {titleizePermission(permission)}
                          </Label>
                          <p className="text-sm text-muted-foreground">{permissionDescription(permission)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={closeEditDialog} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateEmployee} disabled={isUpdating} className="bg-blue-600 text-white hover:bg-blue-700">
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const displayedPermissions = Array.isArray(employee.permissionList)
                        ? employee.permissionList
                        : [];
                      const visiblePermissions = displayedPermissions.slice(0, 3);
                      const remainingPermissions = Math.max(
                        0,
                        displayedPermissions.length - visiblePermissions.length
                      );

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee.fullName}</p>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                employee.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }
                            >
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {visiblePermissions.map((permission) => (
                                <Badge
                                  key={permission}
                                  variant="secondary"
                                  className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  {titleizePermission(permission)}
                                </Badge>
                              ))}
                              {remainingPermissions > 0 ? <Badge variant="outline">+{remainingPermissions}</Badge> : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(employee)}
                                disabled={isUpdating}
                                className="rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEmployeeStatus(employee)}
                                disabled={isUpdating}
                                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              >
                                {employee.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}
      </main>

    </>
  );
}
