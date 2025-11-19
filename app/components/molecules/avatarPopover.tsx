import { useAuthStore, type AuthUser } from '@/app/stores/useAuthStore';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { Listbox, ListboxItem } from '@heroui/listbox';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  User,
} from '@heroui/react';
import { LogOut, SettingsIcon, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';
export const UserCard = ({ user }: { user: AuthUser }) => {
  const defaultAvatar = '/image/default_avatar.jpg';
  const clear = useAuthStore(state => state.clear);
  const router = useRouter();
  const t = useTranslations('sidebar.footer');
  const handleAction = (key: React.Key) => {
    switch (key) {
      case 'profile':
        // TODO: Navigate to profile page
        break;
      case 'settings':
        // TODO: Navigate to settings page
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  const handleLogout = async () => {
    try {
      // Gọi API logout để xóa cookies và refresh token trong database
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Xóa state trong store và redirect
      clear();
      router.push(PAGE_ROUTES.LOGIN);
    }
  };

  return (
    <Card className="max-w-[300px] border-none bg-transparent" shadow="none">
      <CardHeader className="justify-between">
        <div className="flex gap-3">
          <Avatar
            src={user.avatar ?? defaultAvatar}
            isBordered
            radius="full"
            size="md"
          />
          <div className="flex flex-col items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {user.name}
            </h4>
            <h5 className="text-small tracking-tight text-default-500">
              {user.email}
            </h5>
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="px-3 py-0">
        <Listbox aria-label="User actions" onAction={handleAction}>
          <ListboxItem
            key="profile"
            className="text-lg"
            startContent={<UserIcon className="w-4 h-4" />}
          >
            {t('profile')}
          </ListboxItem>
          <ListboxItem
            key="settings"
            className="text-lg"
            startContent={<SettingsIcon className="w-4 h-4" />}
          >
            {t('settings')}
          </ListboxItem>
        </Listbox>
      </CardBody>
      <Divider />
      <CardFooter className="px-3 py-2">
        <Button
          className="w-full text-base"
          color="danger"
          size="sm"
          variant="light"
          onPress={handleLogout}
          startContent={<LogOut className="w-4 h-4" />}
        >
          {t('logout')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AvatarPopover() {
  const user = useAuthStore(state => state.user);
  console.log(user);
  if (!user) {
    return null;
  }

  return (
    <Popover placement="right">
      <PopoverTrigger>
        <User
          as="button"
          className="transition-transform"
          description={user.email}
          name={user.name}
          avatarProps={{
            src: user.avatar || '/image/default_avatar.jpg',
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="p-1">
        <UserCard user={user} />
      </PopoverContent>
    </Popover>
  );
}
