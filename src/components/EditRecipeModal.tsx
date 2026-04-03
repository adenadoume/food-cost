import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { darkModalCSS } from '../lib/ui';
import { Recipe } from '../lib/types';
import { CATEGORY_ORDER } from '../lib/constants';

interface Props {
  recipe: Recipe | null;
  mode: 'name' | 'price' | 'merides' | 'full' | null;
  onClose: () => void;
  onSave: (id: string, values: Partial<Recipe>) => Promise<void>;
}

const MODAL_TITLES: Record<string, string> = {
  name: 'Edit Recipe Name',
  price: 'Edit Price',
  merides: 'Edit Merides',
  full: 'Edit Recipe',
};

export const EditRecipeModal: React.FC<Props> = ({ recipe, mode, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (recipe && mode) {
      form.setFieldsValue({
        name: recipe.name,
        final_price: recipe.final_price || null,
        merides: recipe.merides,
        category: recipe.category,
        restaurant: recipe.restaurant,
      });
    }
  }, [recipe, mode]);

  async function handleSave(values: any) {
    if (!recipe) return;
    try {
      const payload: Partial<Recipe> = {};
      if (mode === 'name' || mode === 'full') payload.name = values.name;
      if (mode === 'price' || mode === 'full') payload.final_price = values.final_price ?? 0;
      if (mode === 'merides' || mode === 'full') payload.merides = values.merides;
      if (mode === 'full') {
        payload.category = values.category;
        payload.restaurant = values.restaurant;
      }
      await onSave(recipe.id, payload);
      message.success('Ενημερώθηκε');
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
        title={mode ? MODAL_TITLES[mode] : 'Edit Recipe'}
        open={!!recipe && !!mode}
        onCancel={onClose}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          {(mode === 'name' || mode === 'full') && (
            <Form.Item name="name" label="RECIPE NAME" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          {(mode === 'price' || mode === 'full') && (
            <Form.Item name="final_price" label="FINAL PRICE (€)">
              <InputNumber min={0} step={0.5} prefix="€" style={{ width: '100%' }} />
            </Form.Item>
          )}
          {(mode === 'merides' || mode === 'full') && (
            <Form.Item name="merides" label="MERIDES" rules={[{ required: true }]}>
              <InputNumber min={1} step={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
          {mode === 'full' && (
            <>
              <Form.Item name="category" label="Category">
                <Select options={CATEGORY_ORDER.map(c => ({ value: c, label: c }))} />
              </Form.Item>
              <Form.Item name="restaurant" label="Restaurant">
                <Select
                  mode="multiple"
                  options={[
                    { value: 'OIK104', label: 'OIK104' },
                    { value: 'OIK512', label: 'OIK5.12' },
                  ]}
                />
              </Form.Item>
            </>
          )}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#3b82f6' }}>Update</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
