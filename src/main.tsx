import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import el_GR from 'antd/locale/el_GR';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={el_GR}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgContainer: '#1f2937',
          colorBgElevated: '#1f2937',
          colorBorder: '#374151',
          colorText: '#f1f5f9',
          colorTextSecondary: '#9ca3af',
          borderRadius: 6,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        components: {
          Table: {
            colorBgContainer: '#111827',
            headerBg: '#111827',
            rowHoverBg: '#374151',
            borderColor: '#1f2937',
          },
          Drawer: {
            colorBgElevated: '#1a1a1a',
          },
          Modal: {
            contentBg: '#1a1a1a',
            headerBg: '#1a1a1a',
          },
          Input: {
            colorBgContainer: '#111827',
            colorBorder: '#374151',
          },
          Select: {
            colorBgContainer: '#111827',
            colorBorder: '#374151',
          },
          Menu: {
            darkItemBg: '#111827',
            darkSubMenuItemBg: '#0f172a',
            darkItemSelectedBg: '#1d4ed8',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
