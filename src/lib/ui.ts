/**
 * Inlined UI utilities from packages/ui — keeps food-cost-app self-contained for Vercel.
 */
import type React from 'react';

// ── Colors ──────────────────────────────────────────────────────────────────

const c = {
  bgMain: '#1f2937',
  bgDark: '#111827',
  bgModal: '#1a1a1a',
  bgInput: '#2a2a2a',
  border: '#374151',
  borderMid: '#4b5563',
  borderModal: '#404040',
  textWhite: '#ffffff',
  textLight: '#d1d5db',
  textMuted: '#9ca3af',
  blue: '#60a5fa',
  bluePrimary: '#3b82f6',
  blueDeep: '#2563eb',
  green: '#34d399',
  greenBright: '#22c55e',
  red: '#ef4444',
  redDeep: '#dc2626',
  tableRowEven: '#1f2937',
  tableRowOdd: '#111827',
  tableRowHover: '#4b5563',
} as const;

// ── Dark table CSS ───────────────────────────────────────────────────────────

export const darkTableCSS = `
  .dark-table .table-row-even { background-color: ${c.tableRowEven} !important; }
  .dark-table .table-row-even:hover > td { background-color: ${c.tableRowHover} !important; }
  .dark-table .table-row-odd { background-color: ${c.tableRowOdd} !important; }
  .dark-table .table-row-odd:hover > td { background-color: ${c.tableRowHover} !important; }
  .dark-table .ant-table-thead > tr > th {
    background-color: ${c.bgDark} !important;
    border-bottom: 2px solid ${c.borderMid} !important;
    color: ${c.textLight} !important;
    font-size: 16px !important;
    font-weight: bold !important;
  }
  .dark-table .ant-table-column-sorter { color: ${c.textLight} !important; }
  .dark-table .ant-table-column-sorter-up.active,
  .dark-table .ant-table-column-sorter-down.active { color: ${c.blue} !important; }
  .dark-table .ant-table-filter-trigger { color: ${c.textLight} !important; }
  .dark-table .ant-table-filter-trigger:hover { color: ${c.textWhite} !important; }
  .dark-table .ant-table-filter-trigger.active { color: ${c.blue} !important; }
  .dark-table .ant-table { background: transparent !important; }
  .dark-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid ${c.border} !important;
    background-color: inherit !important;
    padding: 16px 12px !important;
    font-size: 18px !important;
  }
  .dark-table .ant-pagination {
    background-color: ${c.bgDark} !important;
    padding: 16px !important;
    margin: 0 !important;
  }
  .dark-table .ant-pagination .ant-pagination-item {
    background-color: ${c.border} !important;
    border-color: ${c.borderMid} !important;
  }
  .dark-table .ant-pagination .ant-pagination-item a { color: ${c.textLight} !important; }
  .dark-table .ant-pagination .ant-pagination-item-active {
    background-color: ${c.bluePrimary} !important;
    border-color: ${c.bluePrimary} !important;
  }
  .dark-table .ant-pagination .ant-pagination-item-active a { color: white !important; }
  .dark-table .ant-pagination .ant-pagination-prev button,
  .dark-table .ant-pagination .ant-pagination-next button {
    color: ${c.textLight} !important;
    background: ${c.border} !important;
    border-color: ${c.borderMid} !important;
  }
  .dark-table .ant-select-selector {
    background-color: ${c.border} !important;
    border-color: ${c.borderMid} !important;
    color: ${c.textLight} !important;
  }
`;

// ── Dark modal CSS ───────────────────────────────────────────────────────────

export const darkModalCSS = `
  .dark-modal .ant-modal-content { background-color: ${c.bgModal} !important; }
  .dark-modal .ant-modal-header {
    background-color: ${c.bgModal} !important;
    border-bottom: 2px solid ${c.borderModal} !important;
  }
  .dark-modal .ant-modal-body { background-color: ${c.bgModal} !important; padding: 24px !important; }
  .dark-modal .ant-modal-footer {
    background-color: ${c.bgModal} !important;
    border-top: 2px solid ${c.borderModal} !important;
  }
  .dark-modal .ant-modal-title { color: ${c.blue} !important; }
  .dark-modal .ant-modal-close { color: #e0e0e0 !important; }
  .dark-modal .ant-form-item-label > label { color: #e0e0e0 !important; }
  .dark-modal .ant-input {
    background-color: ${c.bgInput} !important;
    border-color: ${c.borderModal} !important;
    color: #ffffff !important;
    font-size: 16px !important;
  }
  .dark-modal .ant-input::placeholder { color: ${c.textMuted} !important; }
  .dark-modal textarea.ant-input {
    color: #ffffff !important;
    background-color: ${c.bgInput} !important;
    border-color: ${c.borderModal} !important;
  }
  .dark-modal .ant-input-number {
    background-color: ${c.bgInput} !important;
    border-color: ${c.borderModal} !important;
  }
  .dark-modal .ant-input-number-input {
    color: #ffffff !important;
    background-color: ${c.bgInput} !important;
  }
  .dark-modal .ant-input-number-prefix { color: ${c.textMuted} !important; }
  .dark-modal .ant-select-selector {
    background-color: #e0e0e0 !important;
    border-color: ${c.borderModal} !important;
  }
  .dark-modal .ant-select-selection-item { color: #1a1a1a !important; font-weight: 500 !important; }
  .dark-modal .ant-picker {
    background-color: ${c.bgInput} !important;
    border-color: ${c.borderModal} !important;
  }
  .dark-modal .ant-picker-input > input { color: #ffffff !important; }
  .ant-select-dropdown { background-color: ${c.bgInput} !important; }
  .ant-select-item { color: #1a1a1a !important; background-color: #e0e0e0 !important; }
  .ant-select-item-option-selected { background-color: ${c.bluePrimary} !important; color: #ffffff !important; }
  .ant-select-item-option-active { background-color: ${c.blue} !important; color: #ffffff !important; }
`;

// ── Table helpers ────────────────────────────────────────────────────────────

export const tableRowClassName = (_: unknown, index: number) =>
  index % 2 === 0 ? 'table-row-even' : 'table-row-odd';

export const tableContainerStyle: React.CSSProperties = {
  background: `linear-gradient(to right, ${c.border}, ${c.borderMid})`,
  borderRadius: '12px',
  border: `1px solid ${c.borderMid}`,
  overflow: 'hidden',
};

export const tableHeaderBarStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: c.bgMain,
  borderBottom: `1px solid ${c.borderMid}`,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '12px',
};
