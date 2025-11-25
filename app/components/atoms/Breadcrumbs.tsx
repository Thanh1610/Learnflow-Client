import { BreadcrumbItem, Breadcrumbs as HeroBreadcrumbs } from '@heroui/react';
import type { Key, ReactNode } from 'react';

export type BreadcrumbConfig = {
  key?: Key;
  label: ReactNode;
  href?: string;
  isCurrent?: boolean;
};

type BreadcrumbVariant = 'solid' | 'bordered' | 'light';

type HeroBreadcrumbsProps = React.ComponentProps<typeof HeroBreadcrumbs>;

type BreadcrumbsProps = Omit<HeroBreadcrumbsProps, 'children' | 'variant'> & {
  items?: BreadcrumbConfig[];
  renderItem?: (item: BreadcrumbConfig, index: number) => ReactNode;
  children?: ReactNode;
  variant?: BreadcrumbVariant;
};

export default function Breadcrumbs({
  items,
  children,
  renderItem,
  variant,
  ...props
}: BreadcrumbsProps) {
  const content =
    children ??
    items?.map((item, index) =>
      renderItem ? (
        renderItem(item, index)
      ) : (
        <BreadcrumbItem
          key={item.key ?? item.href ?? index}
          href={item.href}
          isCurrent={item.isCurrent}
        >
          {item.label}
        </BreadcrumbItem>
      )
    );

  return (
    <HeroBreadcrumbs {...props} variant={variant} underline="always">
      {content}
    </HeroBreadcrumbs>
  );
}
