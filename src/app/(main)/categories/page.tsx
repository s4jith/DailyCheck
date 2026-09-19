'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { useCategories } from '@/hooks/use-categories';
import { LoaderCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function CategoriesPage() {
  const { defaultCategories, userCategories, loading, error, refresh } = useCategories();
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
      toast({ title: 'Success', description: 'Category added successfully.' });
      setNewCategory('');
      await refresh();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add category.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeletingId(categoryId);
    try {
      await api(`/api/categories/${categoryId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Category deleted successfully.' });
      await refresh();
    } catch (err) {
      // The API refuses with a helpful message when the category is in use.
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete category.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Categories"
        description="Group your spending the way you actually think about it."
      />

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., Subscriptions"
                disabled={isSubmitting}
                maxLength={40}
              />
              <Button type="submit" disabled={!newCategory.trim() || isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <PlusCircle />}
                <span className="ml-2 hidden sm:inline">Add</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Default
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {defaultCategories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Custom
                  </h4>
                  {userCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You haven&apos;t added any custom categories yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-1 rounded-full border border-white/8 bg-white/6 py-0.5 pl-3 pr-1 text-sm font-medium"
                        >
                          <span>{cat.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deletingId === cat.id}
                            aria-label={`Delete category ${cat.name}`}
                          >
                            {deletingId === cat.id ? (
                              <LoaderCircle className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
