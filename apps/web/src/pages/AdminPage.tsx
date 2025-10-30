/**
 * AdminPage Component
 * Placeholder for admin interface
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 font-heading text-4xl font-bold text-neutral-900">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2 desktop:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>
              Manage agricultural documents and sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Add, edit, and review knowledge base content for the RAG system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Monitor user activity, roles, and permissions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>System usage and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Track query patterns, success rates, and user engagement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

