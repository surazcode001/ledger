import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Expenses from './pages/Expenses'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Projects from './pages/projects/Projects'
import ProjectDetail from './pages/projects/ProjectDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={<ProtectedRoute><Home /></ProtectedRoute>}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="ledger" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="categories" element={<Categories />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
