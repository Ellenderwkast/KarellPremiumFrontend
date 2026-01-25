import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ContentsDashboard, ContentsList, NewContent, EditContent } from '../admin/contents';

export default function AdminContentsRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return (
    <Routes>
      <Route path="/admin/contents" element={<ContentsDashboard />} />
      <Route path="/admin/contents/dashboard" element={<ContentsDashboard />} />
      <Route path="/admin/contents/list" element={<ContentsList />} />
      <Route path="/admin/contents/new" element={<NewContent />} />
      <Route path="/admin/contents/edit/:id" element={<EditContent />} />
      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/admin/contents" replace />} />
    </Routes>
  );
}
