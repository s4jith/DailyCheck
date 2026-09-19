'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoaderCircle, PlusCircle, ReceiptText } from 'lucide-react';
import { ExpenseForm } from './expense-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Expense, ExpenseVersion, NewExpense } from '@/lib/types';
import { getColumns } from './columns';
import { PageHeader } from '../PageHeader';
import { Input } from '../ui/input';
import { useExpenses } from '@/hooks/use-expenses';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatInr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { CategoryIcon } from '@/components/CategoryIcon';

export function ExpensesDataTable() {
  const { expenses, loading, error, refresh } = useExpenses();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [historyTarget, setHistoryTarget] = React.useState<Expense | null>(null);
  const [historyVersions, setHistoryVersions] = React.useState<ExpenseVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const addExpense = async (expense: NewExpense) => {
    try {
      await api('/api/expenses', { method: 'POST', body: JSON.stringify(expense) });
      toast({ title: 'Success', description: 'Expense added.' });
      setOpen(false);
      await refresh();
      return true;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add expense.',
      });
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/expenses/${deleteTarget.id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Expense deleted.' });
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete expense.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const editExpense = async (expense: NewExpense) => {
    if (!editTarget) return false;
    try {
      await api(`/api/expenses/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(expense),
      });
      toast({ title: 'Success', description: 'Expense updated.' });
      setOpenEdit(false);
      setEditTarget(null);
      await refresh();
      return true;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update expense.',
      });
      return false;
    }
  };

  React.useEffect(() => {
    if (!historyTarget) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const data = await api<ExpenseVersion[]>(`/api/expenses/${historyTarget.id}/history`);
        setHistoryVersions(data);
      } catch (err) {
        setHistoryError(err instanceof Error ? err.message : 'Failed to load history.');
      } finally {
        setLoadingHistory(false);
      }
    };
    void fetchHistory();
  }, [historyTarget]);

  const columns = React.useMemo(() => getColumns({
    onEdit: (expense) => {
      setEditTarget(expense);
      setOpenEdit(true);
    },
    onViewHistory: (expense) => {
      setHistoryTarget(expense);
    },
    onDelete: setDeleteTarget
  }), []);

  const table = useReactTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="animate-rise w-full">
      <PageHeader title="Expenses" description="Every transaction you have logged.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="max-sm:hidden">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-[425px] sm:mx-0 sm:w-full">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription className="sr-only">Form to add a new expense</DialogDescription>
            </DialogHeader>
            <ExpenseForm onSubmit={addExpense} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center pb-4">
        <Input
          placeholder="Filter by description…"
          value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('description')?.setFilterValue(event.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="surface-edge hidden overflow-hidden rounded-lg border border-white/6 bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  No expenses match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {loading ? (
          <div className="py-12 text-center">
            <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const expense = row.original;
            return (
              <div
                key={row.id}
                className="surface-edge rounded-lg border border-white/6 bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/8 bg-white/5 text-muted-foreground">
                    <CategoryIcon category={expense.category} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{expense.description}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {expense.category}
                      {expense.date ? ` \u00b7 ${format(expense.date, 'MMM d, yyyy')}` : ''}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-sm font-semibold">
                    {formatInr(expense.amount)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  {row
                    .getVisibleCells()
                    .filter((cell) => cell.column.id === 'actions')
                    .map((cell) => (
                      <div key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="No expenses yet"
            description="Log your first expense and it will show up here."
          />
        )}
      </div>

      {/* Responsive Pagination */}
      <div className="flex flex-col items-center justify-between space-y-2 py-4 sm:flex-row sm:space-x-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-20"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-20"
          >
            Next
          </Button>
        </div>

        <div className="tabular hidden text-sm text-muted-foreground sm:block">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </div>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.description}" (${formatInr(deleteTarget.amount)}) will be permanently deleted.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expense Dialog */}
      <Dialog open={openEdit} onOpenChange={(isOpen) => {
        setOpenEdit(isOpen);
        if (!isOpen) setEditTarget(null);
      }}>
        <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-[425px] sm:mx-0 sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription className="sr-only">Form to edit an existing expense</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <ExpenseForm initialValues={editTarget} onSubmit={editExpense} />
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyTarget !== null} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setHistoryTarget(null);
          setHistoryVersions([]);
        }
      }}>
        <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-[650px] sm:mx-0 sm:w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Version History</DialogTitle>
            <DialogDescription>
              {historyTarget ? `Previous versions for "${historyTarget.description}"` : 'Previous versions'}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="py-8 text-center">
              <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : historyError ? (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
              {historyError}
            </div>
          ) : historyVersions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No previous versions found for this expense.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-white/8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Changed On</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Expense Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyVersions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(version.updatedAt), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[150px] truncate" title={version.description}>
                        {version.description}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{version.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatInr(version.amount)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(version.date), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
