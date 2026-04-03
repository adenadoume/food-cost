import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { darkModalCSS } from 'ui';
import { Ingredient, Supplier } from '../lib/types';
import { INGREDIENT_CATEGORIES } from '../lib/constants';

interface Props {
  open: boolean;
  ingredient: Ingredient | null; // null = create mode
  suppliers: Supplier[];
  onClose: () => void;
  onCreate: (values: Partial<Ingredient>) => Promise<void>;
  onUpdate: (id: string, values: Partial<Ingredient>) => Promise<void>;
}

export const IngredientFormModal: React.FC<Props> = ({
  open, ingredient, suppliers, onClose, onCreate, onUpdate
}) => {
  const [form] = Form.useForm();
  const isEdit = !!ingredient;

  useEffect(() => {
    if (open) {
      if (ingredient) {
        form.setFieldsValue({
          name: ingredient.name,
          cost_per_kg: ingredient.cost_per_kg,
          category: ingredient.category,
          supplier_id: ingredient.supplier_id,
          unit_type: ingredient.unit_type,
        });
      } else {
        form.resetFields();
        form.setFieldValue('unit_type', 'kg');
      }
    }
  }, [open, ingredient]);

  async function handleFinish(values: any) {
    try {
      if (isEdit) {
        await onUpdate(ingredient!.id, values);
        message.success('Ενημερώθηκε');
      } else {
        await onCreate(values);
        message.success('Προστέθηκε');
      }
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  return (
    <>
      <style>{darkModalCSS}</style>
      <Modal
        className="dark-modal"
        title={isEdit ? 'Update record' : 'Add new Ingredient'}
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Ingredient" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cost_per_kg" label="Cost per kg">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="€" />
          </Form.Item>
          <Form.Item name="category" label="Ingredient Category" rules={[{ required: true }]}>
            <Select
              options={INGREDIENT_CATEGORIES.map(c => ({ value: c, label: c }))}
              showSearch
            />
          </Form.Item>
          <Form.Item name="supplier_id" label="Supplier">
            <Select
              allowClear
              showSearch
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="unit_type" label="Μονάδα μέτρησης" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'kg', label: 'grm (μετριέται σε γραμμάρια)' },
                { value: 'pcs', label: 'ΤΜΧ (μετριέται σε τεμάχια)' },
              ]}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#3b82f6' }}>
                {isEdit ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
