'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
import { api } from '@/lib/api';
import { MAX_AVATAR_BYTES } from '@/lib/validations';
import { LoaderCircle } from 'lucide-react';

const profileFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters.').max(50),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { update } = useSession();
  const { profile, loading, refresh } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
    },
  });

  // Populate the form once the profile has loaded.
  useEffect(() => {
    if (profile) {
      form.reset({ displayName: profile.name ?? '' });
    }
  }, [profile, form]);

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: data.displayName }),
      });
      await Promise.all([refresh(), update()]);
      toast({ title: 'Success', description: 'Your profile has been updated.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Unsupported file',
        description: 'Please choose a JPG, PNG, GIF or WebP image.',
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Images must be at most ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB.`,
      });
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ image: dataUrl }),
      });
      await Promise.all([refresh(), update()]);
      toast({ title: 'Success', description: 'Profile picture updated.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload new picture.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Your Profile" description="How you show up in FinanceFlow." />
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center">
              <div className="relative">
                <Avatar className="h-32 w-32 border border-white/10">
                  <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? 'User'} />
                  <AvatarFallback className="bg-primary/12 font-headline text-3xl font-bold text-primary">
                    {profile.name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <LoaderCircle className="animate-spin text-white" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Change Picture
                </label>
              </Button>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                disabled={isUploading}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG, GIF or WebP up to {Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your display name here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
