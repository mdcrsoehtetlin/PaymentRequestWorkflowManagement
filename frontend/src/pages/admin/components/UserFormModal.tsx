import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { apiClient } from '../../../services/api-client';

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

interface UserFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'reset';
  user: UserRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BRANCHES = ['Yangon', 'Mandalay', 'Naypyidaw'];

const ROLE_OPTIONS = [
  { value: 1, label: '申請者' },
  { value: 2, label: 'マネージャー' },
  { value: 3, label: '承認者' },
  { value: 4, label: '経理' },
  { value: 5, label: '管理者' },
];

/**
 * @description Modal component for creating, editing users, and resetting passwords.
 * Supports three modes: create, edit, and reset.
 */
export function UserFormModal({
  isOpen,
  mode,
  user,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    employeeNumber: '',
    fullName: '',
    email: '',
    branch: 'Yangon',
    roleId: 1,
  });
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        employeeNumber: user.employeeNumber.replace(/^EMP-/, ''),
        fullName: user.fullName,
        email: user.email,
        branch: user.branch,
        roleId: user.roleId,
      });
    } else {
      setFormData({
        employeeNumber: '',
        fullName: '',
        email: '',
        branch: 'Yangon',
        roleId: 1,
      });
    }
    setTemporaryPassword(null);
    setError(null);
    setCopied(false);
  }, [mode, user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const usersRes = await apiClient.get('/admin/users?pageSize=100');
        const existing = usersRes.data.data as { employeeNumber: string }[];
        const maxNum = existing.reduce((max, u) => {
          const m = u.employeeNumber.match(/EMP-\d+-(\d+)/);
          return m ? Math.max(max, parseInt(m[1])) : max;
        }, 0);
        const year = new Date().getFullYear();
        const employeeNumber = `EMP-${year}-${String(maxNum + 1).padStart(3, '0')}`;
        const response = await apiClient.post('/admin/users', {
          ...formData,
          employeeNumber,
        });
        setTemporaryPassword(response.data.temporaryPassword);
      } else if (mode === 'edit' && user) {
        await apiClient.patch(`/admin/users/${user.userId}`, {
          fullName: formData.fullName,
          branch: formData.branch,
          roleId: formData.roleId,
          version: user.version,
        });
        onSuccess();
      } else if (mode === 'reset' && user) {
        const response = await apiClient.post(
          `/admin/users/${user.userId}/reset-password`,
          { version: user.version },
        );
        setTemporaryPassword(response.data.temporaryPassword);
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(
        apiError.response?.data?.message ?? '操作に失敗しました',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const title =
    mode === 'create'
      ? '新規ユーザー登録'
      : mode === 'edit'
        ? 'ユーザー詳細編集'
        : 'パスワードリセット';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {temporaryPassword ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700 mb-2">
                  一時パスワードが生成されました
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded border border-emerald-200">
                    {temporaryPassword}
                  </code>
                  <button
                    onClick={handleCopyPassword}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                    title="コピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                このパスワードは一度しか表示されません。安全な場所に記録してください。
              </p>
              <button
                onClick={onSuccess}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                閉じる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {mode !== 'reset' && (
                <>
                  {mode === 'edit' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        社員番号
                      </label>
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                        <span className="px-2 py-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-300 select-none">EMP-</span>
                        <input
                          type="text"
                          value={formData.employeeNumber}
                          disabled
                          className="w-full px-2 py-2 text-sm text-slate-500 outline-none border-0 bg-slate-50"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      氏名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      disabled={mode === 'edit'}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      拠点 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          branch: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      役割 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.roleId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          roleId: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {mode === 'reset' && user && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{user.fullName}</span> のパスワードをリセットしますか？
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    新しい一時パスワードが生成され、現在のセッションは無効になります。
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {isLoading
                    ? '処理中...'
                    : mode === 'create'
                      ? '登録'
                      : mode === 'edit'
                        ? '変更を保存'
                        : 'リセット'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
