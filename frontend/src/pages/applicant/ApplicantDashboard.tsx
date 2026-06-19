
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import Dashboard from './dashboard';
import Form from './form';
import Detail from './detail';

export function ApplicantDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/form" element={<Form />} />
        <Route path="/request/:id" element={<Detail />} />
      </Routes>
    </DashboardLayout>
  );
}
