import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  CoffeeOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { OIK104MenuPage } from './pages/OIK104MenuPage';
import { OIK512MenuPage } from './pages/OIK512MenuPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { SuppliersPage } from './pages/SuppliersPage';

const { Header, Content, Sider } = Layout;

const NAV_ITEMS = [
  { key: '/oik104', label: 'OIK104 MENU', icon: <CoffeeOutlined /> },
  { key: '/oik512', label: 'OIK5.12 MENU', icon: <CoffeeOutlined /> },
  { key: '/ingredients', label: 'INGREDIENTS', icon: <ShoppingOutlined /> },
  { key: '/suppliers', label: 'SUPPLIERS', icon: <TeamOutlined /> },
];

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

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
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: '#0f172a' }}>
        <Content style={{ background: '#0f172a', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/oik104" replace />} />
            <Route path="/oik104" element={<OIK104MenuPage />} />
            <Route path="/oik512" element={<OIK512MenuPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);
