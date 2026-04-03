import React, { useState } from 'react';
import { Card, Select, Typography, Tag, Divider, Button, Space } from 'antd';
import { FilePdfOutlined, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const API_BASE = 'https://agop-os.agop.pro';

const FILTER_OPTIONS = [
  { value: 'ALL',    label: 'ALL — OIK104 & OIK5.12', outputFile: 'ALL RECIPES.pdf' },
  { value: 'OIK104', label: 'OIK104 only',             outputFile: 'OIK104 RECIPES.pdf' },
  { value: 'OIK512', label: 'OIK5.12 only',            outputFile: 'OIK512 RECIPES.pdf' },
];

export const ExportPage: React.FC = () => {
  const [filter, setFilter]     = useState<string>('ALL');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const selected = FILTER_OPTIONS.find(o => o.value === filter)!;

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/food-cost/pdf?filter=${filter}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Server error ${res.status}: ${msg}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = selected.outputFile;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680 }}>
      <Title level={3} style={{ color: '#f1f5f9', marginBottom: 4 }}>
        <FilePdfOutlined style={{ marginRight: 10, color: '#f87171' }} />
        PDF Export — Συνταγές Food Cost
      </Title>
      <Text style={{ color: '#6b7280', fontSize: 13 }}>
        Generates a recipe analysis PDF with cover page, category index and one page per recipe.
      </Text>

      <Divider style={{ borderColor: '#1f2937' }} />

      <Card
        style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, marginBottom: 24 }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>
            RESTAURANT FILTER
          </Text>
          <Select
            value={filter}
            onChange={v => { setFilter(v); setError(null); }}
            style={{ width: 300 }}
            options={FILTER_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <Text style={{ color: '#6b7280', fontSize: 11, display: 'block' }}>OUTPUT FILE</Text>
            <Tag style={{
              marginTop: 4,
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#fbbf24',
              fontWeight: 600,
              fontSize: 13,
            }}>
              {selected.outputFile}
            </Tag>
          </div>
          <div>
            <Text style={{ color: '#6b7280', fontSize: 11, display: 'block' }}>FORMAT</Text>
            <Tag style={{
              marginTop: 4,
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#34d399',
              fontSize: 12,
            }}>
              ReportLab · A4 · Greek
            </Tag>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
            onClick={handleExport}
            disabled={loading}
            style={{
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              fontWeight: 600,
              height: 44,
              paddingInline: 32,
            }}
          >
            {loading ? 'Generating PDF…' : `Export ${filter === 'ALL' ? 'ALL' : filter} PDF`}
          </Button>
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            background: '#7f1d1d33',
            border: '1px solid #ef444444',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}
      </Card>

      <div style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.8 }}>
        <Text style={{ color: '#374151', fontSize: 12 }}>
          PDF is generated live from Supabase via the Oracle VM API ({API_BASE}).
          Sorting: OIK104 recipes first → shared → OIK5.12, then by category and name.
        </Text>
      </div>
    </div>
  );
};
