import { cn } from '@/lib/utils';
import { Select, SelectItem, type Selection } from '@heroui/react';
import type { ReactNode } from 'react';

type SelectOptionKey = string | number | boolean;

interface CustomSelectOption {
  key: SelectOptionKey;
  label: string;
  endContent?: ReactNode;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  defaultSelectedKey?: SelectOptionKey;
  endContent?: ReactNode;
  label: string;
  placeholder?: string;
  selectionMode: 'single' | 'multiple';
  onSelectionChange?: (keys: Selection) => void;
  className?: string;
  classNames?: {
    trigger?: string;
    [key: string]: string | undefined;
  };
}

export default function CustomSelect({
  options,
  endContent,
  label,
  placeholder,
  selectionMode,
  onSelectionChange,
  defaultSelectedKey,
  className,
}: CustomSelectProps) {
  const normalizedDefaultKey =
    defaultSelectedKey === undefined
      ? undefined
      : defaultSelectedKey.toString();

  return (
    <Select
      className={cn(!className && 'max-w-xs', className)}
      label={label}
      placeholder={placeholder}
      endContent={endContent}
      selectionMode={selectionMode}
      defaultSelectedKeys={
        normalizedDefaultKey ? new Set([normalizedDefaultKey]) : undefined
      }
      onSelectionChange={onSelectionChange}
    >
      {options.map(option => (
        <SelectItem key={option.key.toString()} endContent={option.endContent}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
