import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import CategoryPage from './CategoryPage';
import MeetingDetail from './MeetingDetail';
import AppLayout from '@/components/AppLayout';
import ParticipantsPage from './ParticipantsPage';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl px-8 py-6 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-slate-600 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/meeting/:meetingId" element={<MeetingDetail />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;
