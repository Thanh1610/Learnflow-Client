import { useSidebar } from '@/app/components/organisms/Sidebar/SidebarContext';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import type { UserType } from '@/types/user.type.ts';
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
import { Loader2, LogOut, SettingsIcon, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
export const UserCard = ({ user }: { user: UserType | null }) => {
  const defaultAvatar = '/image/default_avatar.jpg';
  const clear = useAuthStore(state => state.clear);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
      // Xóa state trong store và redirect
      clear();
      router.push(PAGE_ROUTES.LOGIN);
    }
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayAvatar = user?.avatar || defaultAvatar;

  return (
    <Card className="max-w-[300px] border-none bg-transparent" shadow="none">
      <CardHeader className="justify-between">
        <div className="flex gap-3">
          <Avatar src={displayAvatar} isBordered radius="full" size="md" />
          <div className="flex flex-col items-start justify-center">
            <h4 className="text-small text-default-600 leading-none font-semibold">
              {displayName}
            </h4>
            {displayEmail && (
              <h5 className="text-small text-default-500 tracking-tight">
                {displayEmail}
              </h5>
            )}
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="px-3 py-0">
        <Listbox aria-label="User actions" onAction={handleAction}>
          <ListboxItem
            key="profile"
            className="text-lg"
            startContent={<UserIcon className="h-4 w-4" />}
          >
            {t('profile')}
          </ListboxItem>
          <ListboxItem
            key="settings"
            className="text-lg"
            startContent={<SettingsIcon className="h-4 w-4" />}
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
          isDisabled={isLoading}
          startContent={
            isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )
          }
        >
          {t('logout')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AvatarPopover() {
  const user = useAuthStore(state => state.user);
  const { isOpen, isMobile } = useSidebar();
  const isCollapsed = !isOpen && !isMobile;
  const defaultAvatar = '/image/default_avatar.jpg';

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayAvatar = user?.avatar || defaultAvatar;

  return (
    <Popover placement="right">
      <PopoverTrigger>
        {isCollapsed ? (
          <Avatar
            src={displayAvatar}
            isBordered
            radius="lg"
            size="sm"
            as="button"
            className="transition-transform"
          />
        ) : (
          <User
            as="button"
            className="transition-transform"
            description={displayEmail || undefined}
            name={displayName}
            avatarProps={{
              src: displayAvatar,
            }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="p-1">
        <UserCard user={user} />
      </PopoverContent>
    </Popover>
  );
}
