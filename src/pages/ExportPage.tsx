import React, { useState } from 'react';
import { Card, Select, Typography, Tag, Divider, Alert } from 'antd';
import { FilePdfOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'ALL — OIK104 & OIK5.12', outputFile: 'ALL RECIPES.pdf' },
  { value: 'OIK104', label: 'OIK104 only', outputFile: 'OIK104 RECIPES.pdf' },
  { value: 'OIK512', label: 'OIK5.12 only', outputFile: 'OIK512 RECIPES.pdf' },
];

export const ExportPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('ALL');
  const selected = FILTER_OPTIONS.find(o => o.value === filter)!;

  const cmd = `cd apps/food-cost-app/Public\npython3.11 generate_pdf_supabase.py --filter ${filter}`;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 780 }}>
      <Title level={3} style={{ color: '#f1f5f9', marginBottom: 4 }}>
        <FilePdfOutlined style={{ marginRight: 10, color: '#f87171' }} />
        PDF Export — Συνταγές Food Cost
      </Title>
      <Text style={{ color: '#6b7280', fontSize: 13 }}>
        Generates a recipe analysis PDF identical to the original format (cover page, category index, one page per recipe).
      </Text>

      <Divider style={{ borderColor: '#1f2937' }} />

      <Card
        style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, marginBottom: 24 }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>
            RESTAURANT FILTER
          </Text>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 300 }}
            options={FILTER_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
          <div>
            <Text style={{ color: '#6b7280', fontSize: 11, display: 'block' }}>OUTPUT FILE</Text>
            <Tag
              style={{
                marginTop: 4,
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#fbbf24',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {selected.outputFile}
            </Tag>
          </div>
          <div>
            <Text style={{ color: '#6b7280', fontSize: 11, display: 'block' }}>FORMAT</Text>
            <Tag
              style={{
                marginTop: 4,
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#34d399',
                fontSize: 12,
              }}
            >
              ReportLab · DejaVuSans · A4
            </Tag>
          </div>
        </div>
      </Card>

      <Card
        style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, marginBottom: 24 }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CodeOutlined style={{ color: '#6b7280' }} />
          <Text style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Run command (from MONOREPO root)
          </Text>
        </div>
        <pre
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#86efac',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {cmd}
        </pre>
      </Card>

      <Alert
        type="info"
        showIcon
        style={{ background: '#1e3a5f22', borderColor: '#1e40af44', marginBottom: 16 }}
        message={
          <Text style={{ color: '#93c5fd', fontSize: 12 }}>
            Requires <code style={{ color: '#fbbf24' }}>pip install reportlab httpx</code> and{' '}
            <code style={{ color: '#fbbf24' }}>DejaVuSans.ttf</code> at{' '}
            <code style={{ color: '#9ca3af' }}>Public/scripts/DejaVuSans.ttf</code>
          </Text>
        }
      />

      <Alert
        type="warning"
        showIcon
        style={{ background: '#78350f22', borderColor: '#92400e44' }}
        message={
          <Text style={{ color: '#fcd34d', fontSize: 12 }}>
            The PDF is generated locally — it reads live data from Supabase at the time you run the script.
            The output file is saved in <code style={{ color: '#9ca3af' }}>apps/food-cost-app/Public/</code>
          </Text>
        }
      />
    </div>
  );
};
