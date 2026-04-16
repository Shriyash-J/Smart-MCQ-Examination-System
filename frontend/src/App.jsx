import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/CreateExam';
import EditExam from './pages/EditExam';
import TakeExam from './pages/TakeExam';
import Results from './pages/Results';
import ExamResults from './pages/ExamResults';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create-exam" element={<CreateExam />} />
            <Route path="edit-exam/:id" element={<EditExam />} />
            <Route path="exam/:id" element={<TakeExam />} />
            <Route path="result/:resultId" element={<Results />} />
            <Route path="results" element={<Results />} />
            <Route path="results/exam/:examId" element={<ExamResults />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;