import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Only initialize Sentry if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    
    // Set sample rates
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0, // 10% of sessions in prod
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Integrations
    integrations: [
      // React Router integration
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      
      // Session Replay for debugging
      new Sentry.Replay({
        maskAllText: true, // Privacy: mask all text by default
        blockAllMedia: true, // Privacy: block all media
      }),
    ],
    
    // Performance monitoring
    enableTracing: true,
    
    // Filter out common non-error events
    beforeSend(event, hint) {
      // Don't send events for canceled requests
      if (hint.originalException instanceof DOMException && 
          hint.originalException.message.includes('abort')) {
        return null;
      }
      
      // Filter out Firebase auth errors that are expected
      if (hint.originalException instanceof Error) {
        const message = hint.originalException.message;
        if (message.includes('auth/popup-closed-by-user') ||
            message.includes('auth/cancelled-popup-request')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'cropsense-web',
      },
    },
  });
  
  console.log('✅ Sentry initialized');
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data,
  });
}

/**
 * Start a new transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

/**
 * Create an error boundary for a specific component tree
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export { Sentry };

