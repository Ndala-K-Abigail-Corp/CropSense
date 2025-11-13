import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return context;
}

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenuContext();
  
  if (asChild && typeof children === 'object' && 'props' in children) {
    return {
      ...children,
      props: {
        ...children.props,
        onClick: () => setOpen(!open),
      },
    };
  }
  
  return (
    <div onClick={() => setOpen(!open)} className="cursor-pointer">
      {children}
    </div>
  );
}

interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

export function DropdownMenuContent({ children, className, align = 'end' }: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenuContext();
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);
  
  if (!open) return null;
  
  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 min-w-[8rem] bg-white border border-neutral-200 rounded-lg shadow-lg p-1',
        align === 'end' ? 'right-0' : 'left-0',
        'mt-2',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();
  
  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };
  
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm cursor-pointer rounded-md hover:bg-neutral-100 transition-colors',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-neutral-200 my-1" />;
}

