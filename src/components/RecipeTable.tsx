import React, { useState, useMemo } from 'react';
import { Table, Input, Select, Button, Dropdown, Typography, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { SearchOutlined, MoreOutlined, BookOutlined } from '@ant-design/icons';
import { darkTableCSS, tableRowClassName, tableContainerStyle, tableHeaderBarStyle } from '../lib/ui';
import { RecipeWithCosts, Recipe, Ingredient } from '../lib/types';
import { CATEGORY_RANK } from '../lib/constants';
import { fmt } from '../lib/businessLogic';
import { EditRecipeModal } from './EditRecipeModal';
import { RecipeIngredientsDrawer } from './RecipeIngredientsDrawer';

const { Text } = Typography;

interface Props {
  recipes: RecipeWithCosts[];
  loading: boolean;
  ingredients: Ingredient[];
  onUpdate: (id: string, values: Partial<Recipe>) => Promise<void>;
  onRefresh: () => void;
  isEditor: boolean;
}

type EditMode = 'name' | 'price' | 'merides' | 'full' | null;

const numCol = (title: string, key: keyof RecipeWithCosts, color = '#d1d5db') => ({
  title,
  key,
  dataIndex: key,
  width: 100,
  sorter: (a: RecipeWithCosts, b: RecipeWithCosts) => (a[key] as number) - (b[key] as number),
  render: (v: number) => (
    <Text style={{ color, fontWeight: key === 'recipe_cost' ? 500 : 400 }}>
      {fmt(v, key === 'final_price')}
    </Text>
  ),
});

export const RecipeTable: React.FC<Props> = ({ recipes, loading, ingredients, onUpdate, onRefresh, isEditor }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [restFilter, setRestFilter] = useState<string | null>(null);
  const [editRecipe, setEditRecipe] = useState<RecipeWithCosts | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [drawerRecipe, setDrawerRecipe] = useState<RecipeWithCosts | null>(null);

  const filtered = useMemo(() => {
    let rows = recipes;
    if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) rows = rows.filter(r => r.category === catFilter);
    if (restFilter) rows = rows.filter(r => r.restaurant.includes(restFilter));
    return [...rows].sort((a, b) => {
      const ra = CATEGORY_RANK[a.category ?? ''] ?? 999;
      const rb = CATEGORY_RANK[b.category ?? ''] ?? 999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name, 'el');
    });
  }, [recipes, search, catFilter, restFilter]);

  const categories = useMemo(() => {
    const cats = [...new Set(recipes.map(r => r.category).filter(Boolean))];
    return cats.sort((a, b) => (CATEGORY_RANK[a!] ?? 999) - (CATEGORY_RANK[b!] ?? 999));
  }, [recipes]);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      render: (v: string) => <Text style={{ color: '#9ca3af', fontSize: 11 }}>{v ?? '-'}</Text>,
    },
    {
      title: 'ΣΥΝΤΑΓΗ',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: RecipeWithCosts, b: RecipeWithCosts) => a.name.localeCompare(b.name, 'el'),
      render: (name: string, row: RecipeWithCosts) => (
        <button
          style={{
            background: 'none', border: 'none', color: '#60a5fa',
            cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: 14, textAlign: 'left',
          }}
          onClick={() => setDrawerRecipe(row)}
        >
          {name}
        </button>
      ),
    },
    {
      title: 'ΚΑΤΗΓΟΡΙΑ',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (v: string) => <Text style={{ color: '#9ca3af', fontSize: 12 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'ΕΣΤΙΑΤΟΡΙΟ',
      dataIndex: 'restaurant',
      key: 'restaurant',
      width: 160,
      render: (rests: string[]) => (
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(rests ?? []).map(r => (
            <Tag key={r} style={{
              backgroundColor: r === 'OIK104' ? '#3b82f622' : '#8b5cf622',
              borderColor:     r === 'OIK104' ? '#3b82f666' : '#8b5cf666',
              color:           r === 'OIK104' ? '#60a5fa'   : '#a78bfa',
              fontWeight: 600, fontSize: 11, borderRadius: 4, margin: 0,
            }}>
              {r === 'OIK512' ? 'OIK5.12' : r}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: 'ΜΕΡΙΔΕΣ',
      dataIndex: 'merides',
      key: 'merides',
      width: 80,
      sorter: (a: RecipeWithCosts, b: RecipeWithCosts) => a.merides - b.merides,
      render: (v: number, row: RecipeWithCosts) =>
        isEditor ? (
          <button
            style={{
              background: 'none', border: 'none', color: '#f1f5f9',
              cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
              fontWeight: 600, fontSize: 13,
            }}
            title="Click to edit merides"
            onClick={() => { setEditRecipe(row); setEditMode('merides'); }}
          >
            {v ?? 1}
          </button>
        ) : (
          <Text style={{ color: '#f1f5f9', fontWeight: 600 }}>{v ?? 1}</Text>
        ),
    },
    numCol('ΚΟΣΤΟΣ',      'recipe_cost',      '#d1d5db'),
    numCol('ΦΠΑ 13%',     'vat_13',           '#9ca3af'),
    numCol('ΣΥΝΟΛΟ',      'total_cost',       '#f1f5f9'),
    numCol('ΣΥΝ.ΜΕΡΙΔΑ', 'total_per_meride', '#60a5fa'),
    numCol('x3',          'price_x3',         '#34d399'),
    numCol('x4',          'price_x4',         '#a78bfa'),
    {
      title: 'PRICE',
      dataIndex: 'final_price',
      key: 'final_price',
      width: 90,
      sorter: (a: RecipeWithCosts, b: RecipeWithCosts) => a.final_price - b.final_price,
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#fbbf24' : '#4b5563', fontWeight: v > 0 ? 600 : 400 }}>
          {v > 0 ? `€${fmt(v)}` : '—'}
        </Text>
      ),
    },
    // Actions column — only for editors; view-only users can still open the drawer via recipe name click
    ...(isEditor ? [{
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, row: RecipeWithCosts) => {
        const items: MenuProps['items'] = [
          {
            key: 'ingredients',
            icon: <BookOutlined />,
            label: 'Ingredients',
            onClick: () => setDrawerRecipe(row),
          },
          { type: 'divider' as const },
          { key: 'name',    label: 'Edit Recipe Name', onClick: () => { setEditRecipe(row); setEditMode('name'); } },
          { key: 'merides', label: 'Merides',          onClick: () => { setEditRecipe(row); setEditMode('merides'); } },
          { key: 'price',   label: 'Edit Price',       onClick: () => { setEditRecipe(row); setEditMode('price'); } },
          { key: 'full',    label: 'Edit All Fields',  onClick: () => { setEditRecipe(row); setEditMode('full'); } },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} style={{ color: '#9ca3af' }} />
          </Dropdown>
        );
      },
    }] : []),
  ];

  return (
    <>
      <style>{darkTableCSS}</style>
      <div style={tableContainerStyle}>
        <div style={{ ...tableHeaderBarStyle, gap: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#6b7280' }} />}
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f1f5f9', width: 260 }}
          />
          <Select
            placeholder="Κατηγορία"
            allowClear
            value={catFilter}
            onChange={setCatFilter}
            style={{ width: 220 }}
            options={categories.map(c => ({ value: c, label: c }))}
          />
          <Select
            placeholder="Εστιατόριο"
            allowClear
            value={restFilter}
            onChange={setRestFilter}
            style={{ width: 150 }}
            options={[
              { value: 'OIK104', label: 'OIK104' },
              { value: 'OIK512', label: 'OIK5.12' },
            ]}
          />
          <div style={{ marginLeft: 'auto' }}>
            <Tag style={{ color: '#9ca3af', background: '#1f2937', borderColor: '#374151' }}>
              {filtered.length} συνταγές
            </Tag>
          </div>
        </div>

        <Table
          className="dark-table"
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['25', '50', '100'] }}
          rowClassName={(row, i) => tableRowClassName(row, i)}
          size="small"
        />
      </div>

      {isEditor && (
        <EditRecipeModal
          recipe={editRecipe}
          mode={editMode}
          onClose={() => { setEditRecipe(null); setEditMode(null); }}
          onSave={onUpdate}
        />
      )}

      <RecipeIngredientsDrawer
        recipe={drawerRecipe}
        open={!!drawerRecipe}
        onClose={() => setDrawerRecipe(null)}
        ingredients={ingredients}
        onCostChanged={onRefresh}
        isEditor={isEditor}
      />
    </>
  );
};
