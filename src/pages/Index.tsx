import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import CategoryPage from './CategoryPage';
import MeetingDetail from './MeetingDetail';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Login />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/meeting/:meetingId" element={<MeetingDetail />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;
