/**
 * App Component
 * Root application component with routing
 * TDD §2, §13: React Router setup
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from '@/lib/trpc-provider';
import { RegionCropContextProvider } from '@/hooks/useRegionCropContext';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  return (
    <TRPCProvider>
      <RegionCropContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route
                path="*"
                element={
                  <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="mb-4 font-heading text-4xl font-bold">
                      404 - Page Not Found
                    </h1>
                    <p className="text-neutral-600">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </RegionCropContextProvider>
    </TRPCProvider>
  );
}

export default App;

