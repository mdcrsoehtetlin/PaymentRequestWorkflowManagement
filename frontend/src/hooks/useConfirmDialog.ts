import { useState, useCallback } from 'react';

export interface DialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
}

export interface UseConfirmDialogReturn {
  isOpen: boolean;
  config: DialogConfig | null;
  open: (config: DialogConfig) => void;
  close: () => void;
  confirm: () => Promise<void>;
  isLoading: boolean;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback((dialogConfig: DialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    setIsLoading(false);
  }, []);

  const confirm = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      await config.onConfirm();
      close();
    } finally {
      setIsLoading(false);
    }
  }, [config, close]);

  return { isOpen, config, open, close, confirm, isLoading };
}
