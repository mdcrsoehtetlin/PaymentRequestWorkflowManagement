import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { DataTable, type Column } from '../../components/shared/DataTable';

type MasterCategory = 'currencies' | 'roles' | 'statuses' | 'payment-types' | 'payment-methods';

const CATEGORIES: { value: MasterCategory; label: string }[] = [
  { value: 'currencies', label: '通貨' },
  { value: 'roles', label: '役割' },
  { value: 'statuses', label: 'ステータス' },
  { value: 'payment-types', label: '支払タイプ' },
  { value: 'payment-methods', label: '支払方法' },
];

/**
 * @description Master Data Configuration workspace component.
 * Displays read-only lookup tables for system configuration.
 */
export function MasterDataWorkspace() {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('currencies');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/admin/master-data/${activeCategory}`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch master data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeCategory]);

  const getColumns = (): Column<Record<string, unknown>>[] => {
    if (data.length === 0) return [];
    const hiddenKeys = ['is_editable_state', 'is_terminal_state'];
    const categoryHiddenKeys: Record<MasterCategory, string[]> = {
      currencies: [],
      roles: ['role_id'],
      statuses: ['display_order'],
      'payment-types': ['payment_type_id'],
      'payment-methods': ['payment_method_id'],
    };
    const currentHiddenKeys = [...hiddenKeys, ...categoryHiddenKeys[activeCategory]];
    const keys = Object.keys(data[0]).filter(
      (k) => !currentHiddenKeys.includes(k) && (!k.endsWith('_id') || k === `${activeCategory.replace(/-/g, '_').replace(/s$/, '')}_id`),
    );
    return keys.map((key) => ({
      key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      ...(key === 'is_active' && {
        render: (val: unknown) =>
          val ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center">
              <X className="w-3 h-3 text-white stroke-[3]" />
            </div>
          ),
      }),
      ...(key === 'created_date' && {
        render: (val: unknown) => {
          if (!val) return '—';
          const d = new Date(val as string);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${y}-${m}-${day} ${h}:${min}`;
        },
      }),
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">マスターデータ設定</h1>
        <p className="text-sm text-slate-500 mt-1">
          システムのルックアップテーブルを確認できます
        </p>
      </div>

      {/* Category Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Grid */}
      <DataTable
        columns={getColumns()}
        data={data}
        isLoading={isLoading}
        emptyMessage="データがありません"
      />
    </div>
  );
}
