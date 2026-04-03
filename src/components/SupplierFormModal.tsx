import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { darkModalCSS } from 'ui';
import { Supplier } from '../lib/types';

interface Props {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onCreate: (values: Partial<Supplier>) => Promise<void>;
  onUpdate: (id: string, values: Partial<Supplier>) => Promise<void>;
}

export const SupplierFormModal: React.FC<Props> = ({
  open, supplier, onClose, onCreate, onUpdate
}) => {
  const [form] = Form.useForm();
  const isEdit = !!supplier;

  useEffect(() => {
    if (open) {
      if (supplier) form.setFieldsValue(supplier);
      else form.resetFields();
    }
  }, [open, supplier]);

  async function handleFinish(values: any) {
    try {
      if (isEdit) {
        await onUpdate(supplier!.id, values);
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
        title={isEdit ? 'Update Supplier' : 'Add new Supplier'}
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Supplier Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="tax_id" label="ΑΦΜ">
            <Input />
          </Form.Item>
          <Form.Item name="business_type" label="Business Type">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
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
