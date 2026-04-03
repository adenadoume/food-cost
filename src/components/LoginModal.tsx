import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { darkModalCSS } from '../lib/ui';
import { useAuth } from '../lib/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ open, onClose }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();

  async function handleSubmit(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    const err = await login(values.email, values.password);
    setLoading(false);
    if (err) {
      setError('Invalid credentials');
    } else {
      form.resetFields();
      onClose();
    }
  }

  function handleClose() {
    form.resetFields();
    setError(null);
    onClose();
  }

  return (
    <>
      <style>{darkModalCSS}</style>
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={380}
        className="dark-modal"
        title={
          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 16 }}>
            Editor Login
          </span>
        }
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Email required' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#6b7280' }} />}
              placeholder="Email"
              autoComplete="email"
              style={{ background: '#2a2a2a', borderColor: '#404040', color: '#fff', height: 40 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Password required' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6b7280' }} />}
              placeholder="Password"
              autoComplete="current-password"
              style={{ background: '#2a2a2a', borderColor: '#404040', color: '#fff', height: 40 }}
            />
          </Form.Item>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16, background: '#7f1d1d33', borderColor: '#ef444444', color: '#fca5a5' }}
            />
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 40, fontWeight: 600 }}
          >
            Login
          </Button>
        </Form>
      </Modal>
    </>
  );
};
