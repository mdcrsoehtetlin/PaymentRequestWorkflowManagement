import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    { key: 'keyword', label: 'キーワード', type: 'text', placeholder: '社員番号または氏名で検索' },
    {
      key: 'roleId',
      label: '役割',
      type: 'select',
      placeholder: 'すべて',
      options: [
        { value: '', label: 'すべて' },
        { value: '1', label: '申請者' },
        { value: '2', label: 'マネージャー' },
        { value: '3', label: '承認者' },
        { value: '4', label: '経理' },
        { value: '5', label: '管理者' },
      ],
    },
    {
      key: 'isActive',
      label: 'ステータス',
      type: 'select',
      placeholder: 'すべて',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '有効' },
        { value: 'false', label: '無効' },
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { key: 'employeeNumber', header: '社員番号', sortable: true },
    { key: 'fullName', header: '氏名', sortable: true },
    { key: 'email', header: 'メールアドレス', sortable: true },
    { key: 'branch', header: '拠点', sortable: true },
    {
      key: 'roleId',
      header: '役割',
      sortable: true,
      render: (_val, row) => {
        const roleMap: Record<number, string> = {
          1: '申請者',
          2: 'マネージャー',
          3: '承認者',
          4: '経理',
          5: '管理者',
        };
        return roleMap[row.roleId] ?? '不明';
      },
    },
    {
      key: 'isActive',
      header: 'ステータス',
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
          {row.isActive ? '有効' : '無効'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (_val, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="編集"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetPassword(row);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="パスワードリセット"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ユーザーアカウント管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            アプリケーションユーザーの管理、役割の割り当て、アクセスの切り替え
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新規ユーザー登録
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
        登録ユーザー数 ({pagination.totalItems})
      </div>
      <DataTable
        columns={columns}
        data={sortedUsers}
        isLoading={isLoading}
        emptyMessage="ユーザーが見つかりません"
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
