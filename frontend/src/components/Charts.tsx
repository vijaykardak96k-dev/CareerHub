import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CountPoint } from '../lib/types';
import { EmptyState } from './Ui';

const AXIS = { fontSize: 12, fill: '#64748b' };

export function CountBarChart({
  data,
  name,
  colour = '#2043d6',
}: {
  data: CountPoint[];
  name: string;
  colour?: string;
}) {
  if (data.length === 0) return <EmptyState title="No data yet" description="Charts appear once records exist." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={AXIS} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name={name} fill={colour} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CountLineChart({
  data,
  name,
  colour = '#0f766e',
}: {
  data: CountPoint[];
  name: string;
  colour?: string;
}) {
  if (data.length === 0) return <EmptyState title="No data yet" description="Charts appear once records exist." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} />
        <YAxis tick={AXIS} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" name={name} stroke={colour} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
