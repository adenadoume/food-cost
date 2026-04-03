import React, { useState, useMemo } from 'react';
import { Table, Input, Button, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { darkTableCSS, tableRowClassName, tableContainerStyle, tableHeaderBarStyle } from 'ui';
import { useSuppliers } from '../hooks/useSuppliers';
import { SupplierFormModal } from '../components/SupplierFormModal';
import { Supplier } from '../lib/types';

const { Text, Title } = Typography;

export const SuppliersPage: React.FC = () => {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  const columns = [
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Supplier, b: Supplier) => a.name.localeCompare(b.name, 'el'),
      render: (v: string) => <Text style={{ color: '#f1f5f9', fontWeight: 500 }}>{v}</Text>,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 140,
      render: (v: string) => <Text style={{ color: '#d1d5db' }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Business Type',
      dataIndex: 'business_type',
      key: 'business_type',
      width: 200,
      render: (v: string) => <Text style={{ color: '#9ca3af', fontSize: 13 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'ΑΦΜ',
      dataIndex: 'tax_id',
      key: 'tax_id',
      width: 120,
      render: (v: string) => <Text style={{ color: '#9ca3af' }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (v: string) => <Text style={{ color: '#9ca3af' }}>{v ?? '—'}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: any, row: Supplier) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            style={{ color: '#60a5fa' }}
            onClick={() => { setEditSupplier(row); setModalOpen(true); }}
          />
          <Popconfirm
            title="Διαγραφή προμηθευτή;"
            onConfirm={() => deleteSupplier(row.id)}
            okText="Ναι"
            cancelText="Όχι"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{darkTableCSS}</style>
      <div style={{ padding: '24px 24px 0' }}>
        <Title level={3} style={{ color: '#fb923c', marginBottom: 20 }}>
          SUPPLIERS
        </Title>
        <div style={tableContainerStyle}>
          <div style={{ ...tableHeaderBarStyle, gap: 12 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#6b7280' }} />}
              placeholder="Search suppliers"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f1f5f9', width: 260 }}
            />
            <div style={{ marginLeft: 'auto' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditSupplier(null); setModalOpen(true); }}
                style={{ backgroundColor: '#3b82f6' }}
              >
                Add Supplier
              </Button>
            </div>
          </div>
          <Table
            className="dark-table"
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 50 }}
            rowClassName={(_, i) => tableRowClassName(i)}
            size="small"
          />
        </div>
      </div>

      <SupplierFormModal
        open={modalOpen}
        supplier={editSupplier}
        onClose={() => { setModalOpen(false); setEditSupplier(null); }}
        onCreate={createSupplier}
        onUpdate={updateSupplier}
      />
    </>
  );
};
