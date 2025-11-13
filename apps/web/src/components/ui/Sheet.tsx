import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within Sheet');
  }
  return context;
}

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function SheetTrigger({ children, asChild }: SheetTriggerProps) {
  const { onOpenChange } = useSheetContext();
  
  if (asChild && typeof children === 'object' && 'props' in children) {
    return {
      ...children,
      props: {
        ...children.props,
        onClick: () => onOpenChange(true),
      },
    };
  }
  
  return (
    <div onClick={() => onOpenChange(true)}>
      {children}
    </div>
  );
}

interface SheetContentProps {
  children: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function SheetContent({ children, side = 'right', className }: SheetContentProps) {
  const { open, onOpenChange } = useSheetContext();
  
  if (!open) return null;
  
  const sideClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-50 bg-white border shadow-lg',
          sideClasses[side],
          className
        )}
      >
        <div className="relative h-full flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          {children}
        </div>
      </div>
    </>
  );
}

