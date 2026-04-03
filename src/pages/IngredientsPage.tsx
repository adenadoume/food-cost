import React, { useState, useMemo } from 'react';
import { Table, Input, Select, Button, Space, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { darkTableCSS, tableRowClassName, tableContainerStyle, tableHeaderBarStyle } from '../lib/ui';
import { useIngredients } from '../hooks/useIngredients';
import { useSuppliers } from '../hooks/useSuppliers';
import { IngredientFormModal } from '../components/IngredientFormModal';
import { CategoryBadge } from '../components/CategoryBadge';
import { Ingredient } from '../lib/types';
import { INGREDIENT_CATEGORIES } from '../lib/constants';
import { fmt } from '../lib/businessLogic';

const { Text, Title } = Typography;

export const IngredientsPage: React.FC<{ isEditor: boolean }> = ({ isEditor }) => {
  const { ingredients, loading, createIngredient, updateIngredient, deleteIngredient } = useIngredients();
  const { suppliers } = useSuppliers();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);

  const filtered = useMemo(() => {
    let rows = ingredients;
    if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) rows = rows.filter(r => r.category === catFilter);
    return rows;
  }, [ingredients, search, catFilter]);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      render: (v: string) => <Text style={{ color: '#9ca3af', fontSize: 11 }}>{v ?? '-'}</Text>,
    },
    {
      title: 'Ingredient',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name, 'el'),
      render: (v: string) => <Text style={{ color: '#f1f5f9', fontWeight: 500 }}>{v}</Text>,
    },
    {
      title: 'Cost per kg',
      dataIndex: 'cost_per_kg',
      key: 'cost_per_kg',
      width: 120,
      sorter: (a: Ingredient, b: Ingredient) => a.cost_per_kg - b.cost_per_kg,
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#d1d5db' : '#4b5563' }}>
          {v > 0 ? fmt(v) : '—'}
        </Text>
      ),
    },
    {
      title: 'Ingredient Category',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (v: string) => <CategoryBadge category={v} />,
    },
    {
      title: 'Supplier',
      key: 'supplier',
      width: 180,
      render: (_: unknown, row: Ingredient) => {
        const sup = (row as Ingredient & { suppliers?: { name: string } }).suppliers;
        if (!sup) return <Text style={{ color: '#4b5563' }}>—</Text>;
        return (
          <Tag style={{
            backgroundColor: '#1e40af22',
            borderColor: '#3b82f666',
            color: '#93c5fd',
            fontSize: 12,
          }}>
            {sup.name}
          </Tag>
        );
      },
    },
    ...(isEditor ? [{
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, row: Ingredient) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            style={{ color: '#60a5fa' }}
            onClick={() => { setEditIngredient(row); setModalOpen(true); }}
          />
          <Popconfirm
            title="Διαγραφή αυτού του υλικού;"
            description="Θα αφαιρεθεί και από τις συνταγές."
            onConfirm={() => deleteIngredient(row.id)}
            okText="Ναι"
            cancelText="Όχι"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <style>{darkTableCSS}</style>
      <div style={{ padding: '24px 24px 0' }}>
        <Title level={3} style={{ color: '#34d399', marginBottom: 20 }}>INGREDIENTS</Title>
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
              placeholder="Ingredient Category"
              allowClear
              value={catFilter}
              onChange={setCatFilter}
              style={{ width: 220 }}
              options={INGREDIENT_CATEGORIES.map(c => ({ value: c, label: c }))}
            />
            {isEditor && (
              <div style={{ marginLeft: 'auto' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => { setEditIngredient(null); setModalOpen(true); }}
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  Add Ingredient
                </Button>
              </div>
            )}
          </div>

          <Table
            className="dark-table"
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content', y: 'calc(100vh - 220px)' }}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            rowClassName={(row, i) => tableRowClassName(row, i)}
            size="small"
          />
        </div>
      </div>

      {isEditor && (
        <IngredientFormModal
          open={modalOpen}
          ingredient={editIngredient}
          suppliers={suppliers}
          onClose={() => { setModalOpen(false); setEditIngredient(null); }}
          onCreate={createIngredient}
          onUpdate={updateIngredient}
        />
      )}
    </>
  );
};
