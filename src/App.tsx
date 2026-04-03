import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Tooltip } from 'antd';
import {
  CoffeeOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FilePdfOutlined,
  LockOutlined,
  UnlockOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './lib/auth';
import { LoginModal } from './components/LoginModal';
import { OIK104MenuPage } from './pages/OIK104MenuPage';
import { OIK512MenuPage } from './pages/OIK512MenuPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExportPage } from './pages/ExportPage';

const { Content, Sider } = Layout;

const NAV_ITEMS = [
  { key: '/oik104',      label: 'OIK104 MENU',  icon: <CoffeeOutlined /> },
  { key: '/oik512',      label: 'OIK5.12 MENU', icon: <CoffeeOutlined /> },
  { key: '/ingredients', label: 'INGREDIENTS',   icon: <ShoppingOutlined /> },
  { key: '/suppliers',   label: 'SUPPLIERS',     icon: <TeamOutlined /> },
  { key: '/export',      label: 'EXPORT PDF',    icon: <FilePdfOutlined /> },
];

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEditor, user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const selected = NAV_ITEMS.find(n => location.pathname.startsWith(n.key))?.key ?? '/oik104';

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#111827',
          borderRight: '1px solid #1f2937',
          overflow: 'auto',
          height: '100vh',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60a5fa',
          fontSize: collapsed ? 16 : 14,
          fontWeight: 700,
          borderBottom: '1px solid #1f2937',
          letterSpacing: 1,
        }}>
          {collapsed ? 'FC' : 'FOOD COST'}
        </div>

        {/* Nav */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          style={{ background: '#111827', borderRight: 'none', marginTop: 8 }}
          items={NAV_ITEMS.map(n => ({
            key: n.key,
            icon: n.icon,
            label: n.label,
            onClick: () => navigate(n.key),
          }))}
        />

        {/* Auth button at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 56,           // above the collapse trigger
          left: 0,
          right: 0,
          padding: collapsed ? '8px 4px' : '8px 16px',
          borderTop: '1px solid #1f2937',
        }}>
          {isEditor ? (
            <Tooltip title={collapsed ? `Logout (${user?.email})` : user?.email} placement="right">
              <Button
                type="text"
                block
                icon={<LogoutOutlined style={{ color: '#34d399' }} />}
                onClick={() => logout()}
                style={{
                  color: '#34d399',
                  background: '#34d39911',
                  border: '1px solid #34d39933',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: 8,
                  height: 36,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {!collapsed && 'EDITOR MODE'}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title={collapsed ? 'Editor Login' : ''} placement="right">
              <Button
                type="text"
                block
                icon={<LockOutlined style={{ color: '#6b7280' }} />}
                onClick={() => setLoginOpen(true)}
                style={{
                  color: '#6b7280',
                  border: '1px solid #1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: 8,
                  height: 36,
                  fontSize: 12,
                }}
              >
                {!collapsed && 'Login to Edit'}
              </Button>
            </Tooltip>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: '#0f172a' }}>
        {/* Read-only banner */}
        {!isEditor && (
          <div style={{
            background: '#1f2937',
            borderBottom: '1px solid #374151',
            padding: '6px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#6b7280',
            fontSize: 12,
          }}>
            <LockOutlined style={{ fontSize: 11 }} />
            View-only mode —
            <button
              onClick={() => setLoginOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
              }}
            >
              Login to edit
            </button>
          </div>
        )}
        {isEditor && (
          <div style={{
            background: '#052e16',
            borderBottom: '1px solid #14532d',
            padding: '6px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#4ade80',
            fontSize: 12,
          }}>
            <UnlockOutlined style={{ fontSize: 11 }} />
            Editor mode — {user?.email}
          </div>
        )}

        <Content style={{ background: '#0f172a', minHeight: '100vh' }}>
          <Routes>
            <Route path="/"            element={<Navigate to="/oik104" replace />} />
            <Route path="/oik104"      element={<OIK104MenuPage isEditor={isEditor} />} />
            <Route path="/oik512"      element={<OIK512MenuPage isEditor={isEditor} />} />
            <Route path="/ingredients" element={<IngredientsPage isEditor={isEditor} />} />
            <Route path="/suppliers"   element={<SuppliersPage isEditor={isEditor} />} />
            <Route path="/export"      element={<ExportPage />} />
          </Routes>
        </Content>
      </Layout>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Layout>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </BrowserRouter>
);
