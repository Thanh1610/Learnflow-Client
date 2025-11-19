import {
  AppSidebarServer,
  DashboardLayout,
} from '@/app/components/organisms/Sidebar';
import { metaObject } from '@/config/site.config';
import prisma from '@/lib/prisma';
import { Button } from '@heroui/button';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  ...metaObject('Home'),
};

export default async function Home() {
  let users: Array<{
    id: number;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let error: string | null = null;

  try {
    users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (e) {
    console.error('Error fetching users:', e);
    error = 'Failed to load users. Make sure your DATABASE_URL is configured.';
  }

  const t = await getTranslations('HomePage');

  return (
    <DashboardLayout sidebar={<AppSidebarServer />}>
      <div className="flex flex-col gap-10 p-8">
        <section className="flex flex-wrap gap-4 items-center">
          <Button color="primary" variant="solid" size="lg">
            {t('title')}
          </Button>
          <Button color="primary" variant="faded">
            Faded
          </Button>
          <Button color="primary" variant="bordered">
            Bordered
          </Button>
          <Button color="primary" variant="light">
            Light
          </Button>
          <Button color="primary" variant="flat">
            Flat
          </Button>
          <Button color="primary" variant="ghost">
            Ghost
          </Button>
          <Button
            disableRipple
            className="relative overflow-visible rounded-full px-12 shadow-sm bg-background/30 hover:-translate-y-1 after:content-[''] after:absolute after:rounded-full after:inset-0 after:bg-background/40 after:z-[-1] after:transition after:duration-500 hover:after:scale-150 hover:after:opacity-0"
            size="lg"
          >
            Press me
          </Button>
        </section>

        <section>
          <h1 className="text-2xl font-bold mb-4">Users from Database</h1>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p>No users yet. Create one using the API at /api/users.</p>
          ) : (
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="border p-4 rounded">
                  <p className="font-semibold">{user.name || 'No name'}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
