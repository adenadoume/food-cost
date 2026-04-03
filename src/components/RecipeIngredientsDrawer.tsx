import React, { useState } from 'react';
import { Drawer, Table, Button, Space, Popconfirm, Modal, Form, Select, InputNumber, Input, Switch, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { darkTableCSS, darkModalCSS } from 'ui';
import { Recipe, RecipeIngredient, Ingredient } from '../lib/types';
import { useRecipeIngredients } from '../hooks/useRecipeIngredients';
import { lineCost, unitLabel, fmt } from '../lib/businessLogic';
import { RestaurantBadge } from './CategoryBadge';

const { Text } = Typography;

interface Props {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onCostChanged: () => void;
}

export const RecipeIngredientsDrawer: React.FC<Props> = ({
  recipe, open, onClose, ingredients, onCostChanged
}) => {
  const { rows, loading, addRow, updateRow, deleteRow } = useRecipeIngredients(recipe?.id ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<RecipeIngredient | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const ingMap = Object.fromEntries(ingredients.map(i => [i.id, i]));

  const drawerCSS = `${darkTableCSS}
    .ri-drawer .ant-drawer-content { background: #1a1a1a !important; }
    .ri-drawer .ant-drawer-header { background: #1a1a1a !important; border-bottom: 1px solid #404040 !important; }
    .ri-drawer .ant-drawer-title { color: #60a5fa !important; font-size: 18px !important; }
    .ri-drawer .ant-drawer-close { color: #d1d5db !important; }
    ${darkModalCSS}
  `;

  const columns = [
    {
      title: 'Συστατικό',
      key: 'ingredient',
      render: (_: any, row: RecipeIngredient) => (
        <Text style={{ color: '#f1f5f9', fontWeight: 500 }}>
          {(row.ingredients as any)?.name ?? '—'}
        </Text>
      ),
    },
    {
      title: 'g / ΤΜΧ',
      dataIndex: 'grams',
      width: 90,
      render: (v: number) => <Text style={{ color: '#d1d5db' }}>{v}</Text>,
    },
    {
      title: 'ΜΜ',
      dataIndex: 'kg_tmx',
      width: 70,
      render: (v: number) => (
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>{unitLabel(v)}</Text>
      ),
    },
    {
      title: 'Κg Cost',
      key: 'kg_cost',
      width: 90,
      render: (_: any, row: RecipeIngredient) => {
        const cpk = (row.ingredients as any)?.cost_per_kg ?? 0;
        return <Text style={{ color: '#d1d5db' }}>{fmt(cpk)}</Text>;
      },
    },
    {
      title: 'Κόστος (€)',
      key: 'line_cost',
      width: 100,
      render: (_: any, row: RecipeIngredient) => {
        const cpk = (row.ingredients as any)?.cost_per_kg ?? 0;
        const lc = lineCost(row.grams, row.kg_tmx, cpk);
        return <Text style={{ color: '#34d399', fontWeight: 600 }}>{fmt(lc)}</Text>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, row: RecipeIngredient) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            style={{ color: '#60a5fa' }}
            onClick={() => {
              setEditRow(row);
              editForm.setFieldsValue({
                ingredient_id: row.ingredient_id,
                grams: row.grams,
                is_pcs: row.kg_tmx === 1,
                comments: row.comments ?? '',
              });
            }}
          />
          <Popconfirm
            title="Διαγραφή;"
            onConfirm={async () => {
              await deleteRow(row.id);
              onCostChanged();
            }}
            okText="Ναι"
            cancelText="Όχι"
          >
            <Button type="text" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalCostRows = rows.reduce((sum, r) => {
    const cpk = (r.ingredients as any)?.cost_per_kg ?? 0;
    return sum + lineCost(r.grams, r.kg_tmx, cpk);
  }, 0);

  async function handleAdd(values: any) {
    try {
      await addRow({
        ingredient_id: values.ingredient_id,
        grams: values.grams,
        kg_tmx: values.is_pcs ? 1 : 1000,
        comments: values.comments || null,
      });
      message.success('Προστέθηκε');
      addForm.resetFields();
      setAddOpen(false);
      onCostChanged();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function handleEdit(values: any) {
    if (!editRow) return;
    try {
      await updateRow(editRow.id, {
        ingredient_id: values.ingredient_id,
        grams: values.grams,
        kg_tmx: values.is_pcs ? 1 : 1000,
        comments: values.comments || null,
      });
      message.success('Ενημερώθηκε');
      setEditRow(null);
      onCostChanged();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  const ingredientOptions = ingredients.map(i => ({
    value: i.id,
    label: `${i.name}${i.cost_per_kg ? ` (€${i.cost_per_kg}/kg)` : ''}`,
  }));

  const ingredientFormFields = (form: any) => (
    <>
      <Form.Item name="ingredient_id" label="Συστατικό" rules={[{ required: true }]}>
        <Select
          showSearch
          options={ingredientOptions}
          filterOption={(input, opt) =>
            (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ backgroundColor: '#2a2a2a' }}
        />
      </Form.Item>
      <Form.Item name="grams" label="Ποσότητα (g / ΤΜΧ)" rules={[{ required: true }]}>
        <InputNumber min={0} step={1} style={{ width: '100%', backgroundColor: '#2a2a2a' }} />
      </Form.Item>
      <Form.Item name="is_pcs" label="Μονάδα" valuePropName="checked">
        <Switch checkedChildren="ΤΜΧ" unCheckedChildren="grm" />
      </Form.Item>
      <Form.Item name="comments" label="Σχόλια">
        <Input style={{ backgroundColor: '#2a2a2a' }} />
      </Form.Item>
    </>
  );

  return (
    <>
      <style>{drawerCSS}</style>
      <Drawer
        className="ri-drawer"
        title={
          <div>
            <div style={{ fontSize: 18, color: '#60a5fa' }}>{recipe?.name}</div>
            {recipe && <RestaurantBadge restaurants={recipe.restaurant} />}
          </div>
        }
        open={open}
        onClose={onClose}
        width={760}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { addForm.resetFields(); setAddOpen(true); }}
            style={{ backgroundColor: '#3b82f6' }}
          >
            Add Ingredient
          </Button>
        }
      >
        <Table
          className="dark-table"
          dataSource={rows}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          rowClassName={(_, i) => i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text style={{ color: '#9ca3af', fontWeight: 600 }}>ΣΥΝΟΛΟ</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <Text style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>
                  {fmt(totalCostRows)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} />
            </Table.Summary.Row>
          )}
        />

        {/* Add Modal */}
        <Modal
          className="dark-modal"
          title="Add new Ingredient"
          open={addOpen}
          onCancel={() => setAddOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={addForm} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
            {ingredientFormFields(addForm)}
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#3b82f6' }}>Add</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          className="dark-modal"
          title="Update record"
          open={!!editRow}
          onCancel={() => setEditRow(null)}
          footer={null}
          destroyOnClose
        >
          <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
            {ingredientFormFields(editForm)}
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setEditRow(null)}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#3b82f6' }}>Update</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Drawer>
    </>
  );
};
