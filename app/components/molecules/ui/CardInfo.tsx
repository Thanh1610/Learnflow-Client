'use client';
import Breadcrumbs, {
  type BreadcrumbConfig,
} from '@/app/components/atoms/Breadcrumbs';
import { Card, CardBody, CardFooter, CardHeader, Divider } from '@heroui/react';

type CardInfoProps = {
  breadcrumbs?: BreadcrumbConfig[];
  title: string;
  description?: React.ReactNode;
  rightContent?: React.ReactNode;
};

export default function CardInfo({
  breadcrumbs,
  title,
  description,
  rightContent,
}: CardInfoProps) {
  return (
    <Card className="W-full rounded-none">
      <CardHeader className="flex gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
      </CardHeader>
      <CardBody className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {rightContent && (
          <div className="flex w-full justify-center sm:justify-end">
            {rightContent}
          </div>
        )}
      </CardBody>
      <Divider />
      {!!breadcrumbs?.length && (
        <CardFooter>
          <Breadcrumbs items={breadcrumbs} />
        </CardFooter>
      )}
    </Card>
  );
}
