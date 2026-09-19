'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Expense } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Edit, History, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatInr } from '@/lib/utils';

interface ColumnsProps {
  onEdit: (expense: Expense) => void;
  onViewHistory: (expense: Expense) => void;
  /** Called with the expense the user wants to delete (confirmation happens in the parent). */
  onDelete: (expense: Expense) => void;
}

export const getColumns = ({ onEdit, onViewHistory, onDelete }: ColumnsProps): ColumnDef<Expense>[] => [
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 px-3 text-xs font-medium uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="pl-4 font-medium">{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      return <Badge variant="outline">{category}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 px-3 text-xs font-medium uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('date') as Date;
      return (
        <div className="tabular whitespace-nowrap pl-4 text-muted-foreground">
          {date instanceof Date && isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : '—'}
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 px-3 text-xs font-medium uppercase tracking-wider"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number;
      return <div className="tabular pr-4 text-right font-semibold">{formatInr(amount)}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewHistory(expense)}>
                <History className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(expense)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
