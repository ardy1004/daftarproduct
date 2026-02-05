import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface ProductDataTableProps {
  products: Product[];
  selectedProductIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onGenerateRating: (product: Product) => void;
}

export function ProductDataTable({
  products,
  selectedProductIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onGenerateRating,
}: ProductDataTableProps) {

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? products.map(p => p.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedProductIds, id]
      : selectedProductIds.filter(selectedId => selectedId !== id);
    onSelectionChange(newSelection);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedProductIds.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Komisi</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Video URL</TableHead>
            <TableHead>Dikirim Dari</TableHead>
            <TableHead>Toko</TableHead>
            <TableHead className="hidden md:table-cell">Price</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.length ? (
            products.map((product) => (
              <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                <TableCell>
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={(checked) => handleRowSelect(product.id, !!checked)}
                    aria-label={`Select row ${product.id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{product.product_id || 'N/A'}</TableCell>
                <TableCell className="font-medium">{product.product_name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.rating || 'N/A'}</TableCell>
                <TableCell>{product.commission ? formatPrice(product.commission) : 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{(product as any).item || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{(product as any).video_url ? '✓' : 'N/A'}</TableCell>
                <TableCell>{product.dikirim_dari || 'N/A'}</TableCell>
                <TableCell>{product.toko || 'N/A'}</TableCell>
                <TableCell className="hidden md:table-cell">{formatPrice(product.price)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onEdit(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onGenerateRating(product)}>
                        <Star className="mr-2 h-4 w-4" />
                        Generate Rating
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onDelete(product)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={12} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}