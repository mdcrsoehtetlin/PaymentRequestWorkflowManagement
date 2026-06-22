import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Edit2, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
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
  version: number;
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

interface Filters {
  keyword: string;
  roleId: string;
  isActive: string;
}

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const fetchUsers = useCallback(async () => {
    const f = filtersRef.current;
    const p = paginationRef.current;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.keyword) params.set('keyword', f.keyword);
      if (f.roleId) params.set('roleId', f.roleId);
      if (f.isActive) params.set('isActive', f.isActive);
      params.set('page', String(p.page));
      params.set('pageSize', String(p.pageSize));

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
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, pagination.page, pagination.pageSize, fetchUsers]);

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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-end gap-4">
          <div className="w-60">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              キーワード
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, keyword: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="社員番号または氏名で検索"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              役割
            </label>
            <select
              value={filters.roleId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, roleId: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">すべて</option>
              <option value="1">申請者</option>
              <option value="2">マネージャー</option>
              <option value="3">承認者</option>
              <option value="4">経理</option>
              <option value="5">管理者</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ステータス
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, isActive: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">すべて</option>
              <option value="true">有効</option>
              <option value="false">無効</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="mb-2 text-sm text-slate-500">
        登録ユーザー数 ({pagination.totalItems})
      </div>
      <DataTable
        columns={columns}
        data={sortedUsers as unknown as Record<string, unknown>[]}
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
