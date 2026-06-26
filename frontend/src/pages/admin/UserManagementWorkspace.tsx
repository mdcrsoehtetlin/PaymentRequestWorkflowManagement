import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { SearchFilterBar, type FilterField } from '../../components/shared/SearchFilterBar';
import { apiClient } from '../../services/api-client';
import { UserFormModal } from './components/UserFormModal';

interface UserRecord {
  userId: number;
  employeeNumber: string;
  fullName: string;
  email: string;
  branch: string;
  roleId: number;
  isActive: boolean;
}

interface UsersResponse {
  data: UserRecord[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

type Filters = Record<string, string>;

/**
 * @description User Account Management workspace component.
 * Displays a paginated grid of system users with search, filter, and actions.
 */
export function UserManagementWorkspace() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    roleId: '',
    isActive: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'reset'>('create');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const [sorting, setSorting] = useState<{ sortBy: string; sortOrder: 'ASC' | 'DESC' }>({
    sortBy: '',
    sortOrder: 'ASC',
  });

  const handleSortChange = (key: string) => {
    setSorting((prev) => {
      if (prev.sortBy === key) {
        return { ...prev, sortOrder: prev.sortOrder === 'ASC' ? 'DESC' : 'ASC' };
      }
      return { sortBy: key, sortOrder: 'ASC' };
    });
    if (sorting.sortBy !== key) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.roleId) params.set('roleId', filters.roleId);
      if (filters.isActive) params.set('isActive', filters.isActive);
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));

      const response = await apiClient.get<UsersResponse>(
        `/admin/users?${params.toString()}`,
      );
      setUsers(response.data.data);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.data.meta.totalItems,
        totalPages: response.data.meta.totalPages,
      }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  const filterFields: FilterField[] = [
    { key: 'keyword', label: t('admin.user_management.filters.keyword'), type: 'text', placeholder: t('admin.user_management.filters.keyword_placeholder') },
    {
      key: 'roleId',
      label: t('admin.user_management.filters.role'),
      type: 'select',
      placeholder: t('common.all'),
      options: [
        { value: '', label: t('common.all') },
        { value: '1', label: t('admin.user_management.role.applicant') },
        { value: '2', label: t('admin.user_management.role.manager') },
        { value: '3', label: t('admin.user_management.role.approver') },
        { value: '4', label: t('admin.user_management.role.accounting') },
        { value: '5', label: t('admin.user_management.role.admin') },
      ],
    },
    {
      key: 'isActive',
      label: t('admin.user_management.filters.status'),
      type: 'select',
      placeholder: t('common.all'),
      options: [
        { value: '', label: t('common.all') },
        { value: 'true', label: t('admin.user_management.status.active') },
        { value: 'false', label: t('admin.user_management.status.inactive') },
      ],
    },
  ];

  const handleApply = (values: Record<string, string | number>) => {
    setFilters({
      keyword: String(values.keyword ?? ''),
      roleId: String(values.roleId ?? ''),
      isActive: String(values.isActive ?? ''),
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClear = () => {
    setFilters({ keyword: '', roleId: '', isActive: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.keyword) params.set('keyword', filters.keyword);
        if (filters.roleId) params.set('roleId', filters.roleId);
        if (filters.isActive) params.set('isActive', filters.isActive);
        params.set('page', String(pagination.page));
        params.set('pageSize', String(pagination.pageSize));

        const response = await apiClient.get<UsersResponse>(
          `/admin/users?${params.toString()}`,
          { signal: controller.signal },
        );
        setUsers(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.data.meta.totalItems,
          totalPages: response.data.meta.totalPages,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch users:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [filters, pagination.page, pagination.pageSize]);

  const handleToggleActive = async (user: UserRecord) => {
    try {
      await apiClient.patch(`/admin/users/${user.userId}/toggle-active`, {
        isActive: !user.isActive,
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleResetPassword = (user: UserRecord) => {
    setSelectedUser(user);
    setModalMode('reset');
    setModalOpen(true);
  };

  const sortedUsers = useMemo(() => {
    if (!sorting.sortBy) return users;
    return [...users].sort((a, b) => {
      const aVal = a[sorting.sortBy as keyof UserRecord];
      const bVal = b[sorting.sortBy as keyof UserRecord];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sorting.sortOrder === 'ASC' ? comparison : -comparison;
    });
  }, [users, sorting]);

  const columns: Column<UserRecord>[] = [
    { key: 'employeeNumber', header: t('admin.user_management.columns.employee_number'), sortable: true },
    { key: 'fullName', header: t('admin.user_management.columns.full_name'), sortable: true },
    { key: 'email', header: t('admin.user_management.columns.email'), sortable: true },
    { key: 'branch', header: t('admin.user_management.columns.branch'), sortable: true },
    {
      key: 'roleId',
      header: t('admin.user_management.columns.role'),
      sortable: true,
      render: (_val, row) => {
        const roleKey = { 1: 'applicant', 2: 'manager', 3: 'approver', 4: 'accounting', 5: 'admin' }[row.roleId];
        return roleKey ? t(`admin.user_management.role.${roleKey}`) : t('admin.user_management.role.unknown');
      },
    },
    {
      key: 'isActive',
      header: t('admin.user_management.columns.status'),
      sortable: true,
      render: (_val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(row);
          }}
          disabled={row.userId === 1}
          className={`px-2 py-1 rounded-full text-xs font-medium border ${
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          } ${row.userId === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
        >
          {row.isActive ? t('admin.user_management.status.active') : t('admin.user_management.status.inactive')}
        </button>
      ),
    },
    {
      key: 'actions',
      header: t('admin.user_management.columns.actions'),
      render: (_val, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={t('admin.user_management.actions.edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetPassword(row);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title={t('admin.user_management.actions.password_reset')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('admin.user_management.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('admin.user_management.description')}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('admin.user_management.create_button')}
        </button>
      </div>

      {/* Search Filters */}
      <SearchFilterBar
        fields={filterFields}
        values={filters}
        onApply={handleApply}
        onClear={handleClear}
      />

      {/* Users Grid */}
      <div className="mb-2 text-sm text-slate-500">
        {t('admin.user_management.registered_count')} ({pagination.totalItems})
      </div>
      <DataTable
        columns={columns}
        data={sortedUsers}
        isLoading={isLoading}
        emptyMessage={t('admin.user_management.empty_message')}
        sorting={{
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder,
          onSortChange: handleSortChange,
        }}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
          onPageSizeChange: (size) =>
            setPagination((prev) => ({ ...prev, pageSize: size, page: 1 })),
        }}
      />

      {/* User Form Modal */}
      <UserFormModal
        key={`${modalMode}-${selectedUser?.userId ?? 'new'}`}
        isOpen={modalOpen}
        mode={modalMode}
        user={selectedUser}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
