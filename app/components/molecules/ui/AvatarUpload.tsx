'use client';

import defaultAvatar from '@/public/image/default_avatar.jpg';
import { Button, Card, CardBody, Image } from '@heroui/react';
import { Icon } from '@iconify/react';
import imageCompression from 'browser-image-compression';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  avatar: string;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
}

export default function AvatarUpload(props: AvatarUploadProps) {
  const { avatar, onFileSelect, isLoading = false } = props;
  const t = useTranslations('ProfilePage');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevAvatarRef = useRef<string>(avatar);
  const previewRef = useRef<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB before compression)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsCompressing(true);

    try {
      // Compress image before upload
      const options = {
        maxSizeMB: 1, // Maximum size in MB (after compression)
        maxWidthOrHeight: 1920, // Maximum width or height
        useWebWorker: true, // Use web worker for better performance
        fileType: file.type, // Preserve original file type
      };

      const compressedFile = await imageCompression(file, options);

      // Show preview of compressed image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);

      // Notify parent component about compressed file selection
      onFileSelect?.(compressedFile);
    } catch (error) {
      console.error('Image compression error:', error);
      setIsCompressing(false);
      toast.error(t('form.compressionFailed'));
      // Reset input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Fallback: use original file if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect?.(file);
    }
  };

  // Clear preview when avatar prop changes (after successful upload)
  // Use ref to track previous avatar value and preview to avoid cascading renders
  useEffect(() => {
    if (prevAvatarRef.current !== avatar) {
      const currentPreview = previewRef.current;
      if (avatar && currentPreview && currentPreview.startsWith('data:')) {
        setTimeout(() => {
          setPreview(null);
        }, 0);
      }
      prevAvatarRef.current = avatar;
    }
  }, [avatar]);

  const handleClose = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-[520px]" {...props}>
      <Button
        isIconOnly
        className="absolute top-2 right-2 z-20"
        radius="full"
        size="sm"
        variant="light"
        onClick={handleClose}
      >
        <Icon
          className="text-default-400"
          icon="iconamoon:close-thin"
          width={24}
        />
      </Button>
      <CardBody className="flex flex-row flex-wrap p-0 sm:flex-nowrap">
        <div
          className="relative mx-auto h-auto w-full max-w-[160px] flex-none cursor-pointer overflow-hidden rounded-lg sm:mx-0 sm:max-w-[180px] md:max-w-[200px] lg:w-48"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleImageClick}
        >
          <Image
            removeWrapper
            alt="Avatar"
            className="h-auto w-full object-cover object-top"
            src={preview || avatar || defaultAvatar.src}
            isLoading={isLoading}
          />
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-black/50 transition-opacity duration-200 ${
              isHovered || isLoading || isCompressing
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            <Icon icon="solar:camera-bold" className="text-white" width={28} />
            <span className="mt-1 text-xs font-medium text-white">
              {isLoading || isCompressing
                ? isCompressing
                  ? t('form.compressing')
                  : t('form.uploading')
                : preview
                  ? t('form.updateImage')
                  : t('form.selectImage')}
            </span>
          </div>
        </div>
        <div className="px-4 py-5">
          <h3 className="text-large font-medium">
            {t('form.uploadInfo.title')}
          </h3>
          <div className="text-small text-default-400 flex flex-col gap-2 pt-2">
            <p className="flex items-center gap-2">
              <Icon
                icon="solar:file-check-bold"
                className="text-default-500"
                width={16}
              />
              {t('form.uploadInfo.maxSize')}
            </p>
            <p className="flex items-center gap-2">
              <Icon
                icon="solar:gallery-bold"
                className="text-default-500"
                width={16}
              />
              {t('form.uploadInfo.supportedFormats')}
            </p>
            <p className="flex items-start gap-2 pt-1">
              <Icon
                icon="solar:info-circle-bold"
                className="text-primary mt-0.5"
                width={16}
              />
              <span>{t('form.uploadInfo.note')}</span>
            </p>
          </div>
        </div>
      </CardBody>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}
