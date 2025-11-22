import { HomeSessionHydrator } from '@/app/components/HomeSessionHydrator';
import { metaObject } from '@/config/site.config';
// TODO: Replace with Hasura implementation
import { Button } from '@heroui/button';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  ...metaObject('Home'),
};

export default async function Home() {
  const users: Array<{
    id: number;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let error: string | null = null;

  // TODO: Replace with Hasura implementation
  error = 'Not implemented - Hasura integration needed';

  const t = await getTranslations('HomePage');

  return (
    <>
      <HomeSessionHydrator />
      <div className="flex flex-col gap-10 p-8">
        <section className="flex flex-wrap items-center gap-4">
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
            className="bg-background/30 after:bg-background/40 relative overflow-visible rounded-full px-12 shadow-sm after:absolute after:inset-0 after:z-[-1] after:rounded-full after:transition after:duration-500 after:content-[''] hover:-translate-y-1 hover:after:scale-150 hover:after:opacity-0"
            size="lg"
          >
            Press me
          </Button>
        </section>

        <section>
          <h1 className="mb-4 text-2xl font-bold">Users from Database</h1>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p>No users yet. Create one using the API at /api/users.</p>
          ) : (
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="rounded border p-4">
                  <p className="font-semibold">{user.name || 'No name'}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
