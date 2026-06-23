import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatDate } from '../../utils/format';

type MasterCategory = 'currencies' | 'roles' | 'statuses' | 'payment-types' | 'payment-methods';

const CATEGORIES: { value: MasterCategory; label: string }[] = [
  { value: 'currencies', label: 'Currencies' },
  { value: 'roles', label: 'Roles' },
  { value: 'statuses', label: 'Statuses' },
  { value: 'payment-types', label: 'Payment Types' },
  { value: 'payment-methods', label: 'Payment Methods' },
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
    const hiddenKeys = ['is_editable_state', 'is_terminal_state', 'display_order'];
    const keys = Object.keys(data[0]).filter(
      (k) => !hiddenKeys.includes(k) && !k.endsWith('_id'),
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
        render: (val: unknown) => val ? formatDate(val as string) : '—',
      }),
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Data Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          View system lookup tables
        </p>
      </div>

      {/* Category Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2">
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
        emptyMessage="No data found"
      />
    </div>
  );
}
