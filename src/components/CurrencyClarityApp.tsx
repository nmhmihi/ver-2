
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { Settings, PlusCircle, Edit3, Trash2, TrendingUp, Sigma, RotateCcw, History, UserCheck, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks/use-transactions';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';


const transactionSchema = z.object({
  senderName: z.string().trim().min(1, { message: "Tên người gửi không được để trống" }),
  twdAmount: z.string().optional(),
  feeTwd: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;


interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { senderName: string; twdAmount: number; feeTwd: number | undefined; }) => void;
  defaultValues: Partial<TransactionFormData & { twdAmount: number | undefined, feeTwd: number | undefined }>;
  isEdit?: boolean;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({ isOpen, onOpenChange, onSubmit, defaultValues, isEdit = false }) => {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      senderName: defaultValues?.senderName || '',
      twdAmount: defaultValues?.twdAmount !== undefined ? String(defaultValues.twdAmount) : '',
      feeTwd: defaultValues?.feeTwd !== undefined ? String(defaultValues.feeTwd) : '100',
    }
  });
  
  const feeOptions = [100];
  const [showCustomFeeInput, setShowCustomFeeInput] = useState(() => {
    const initialFee = Number(defaultValues?.feeTwd);
    return !isNaN(initialFee) && !feeOptions.includes(initialFee);
  });
  
  const handleSubmit: SubmitHandler<TransactionFormData> = (data) => {
    const numericData = {
      senderName: data.senderName,
      twdAmount: data.twdAmount && data.twdAmount.trim() !== '' ? Number(data.twdAmount) : 0,
      feeTwd: data.feeTwd && data.feeTwd.trim() !== '' ? Number(data.feeTwd) : undefined,
    };
    if (isNaN(numericData.twdAmount)) {
      form.setError("twdAmount", { type: "manual", message: "Số tiền không hợp lệ" });
      return;
    }
    onSubmit(numericData);
    onOpenChange(false);
  };

  const handleFeeChange = (value: string) => {
    if (value === 'other') {
      setShowCustomFeeInput(true);
      form.setValue('feeTwd', '');
    } else {
      setShowCustomFeeInput(false);
      form.setValue('feeTwd', value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 top-[25%]" hideCloseButton={!isEdit}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} autoComplete="off">
            <DialogHeader className="p-0">
               {!isEdit && (
                <div className="bg-muted flex items-center justify-center py-0 w-full rounded-t-lg my-0">
                  <h1 className="text-2xl font-semibold tracking-wider text-muted-foreground/80 font-headline py-0.5">NMHMIHI</h1>
                </div>
              )}
              <div className="px-6">
                <DialogTitle className={cn("text-lg font-semibold", { 'sr-only': !isEdit })}>
                  {isEdit ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {isEdit ? 'Sửa chi tiết giao dịch của bạn.' : 'Thêm một giao dịch mới vào danh sách của bạn.'}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="px-6 grid gap-2">
               <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Nhập tên người gửi" {...field} autoComplete="off" className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twdAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                          type="number" 
                          placeholder="Số tiền người gửi (có thể âm)" 
                          {...field}
                          autoComplete="off"
                          className="rounded-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feeTwd"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div>
                        {showCustomFeeInput ? (
                          <Input
                            type="number"
                            placeholder="Phí gửi"
                             {...field}
                             onBlur={(e) => {
                               field.onBlur();
                               const feeValue = Number(e.target.value);
                               if (!isNaN(feeValue) && feeOptions.includes(feeValue)) {
                                 setShowCustomFeeInput(false);
                               }
                            }}
                            autoFocus
                            autoComplete="off"
                            className="rounded-lg"
                          />
                        ) : (
                          <Select
                            onValueChange={handleFeeChange}
                            value={String(field.value)}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Chọn hoặc nhập phí" />
                            </SelectTrigger>
                            <SelectContent>
                              {feeOptions.map((fee) => (
                                <SelectItem key={fee} value={String(fee)}>
                                  {fee.toLocaleString()} TWD
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Khác...</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="px-6 py-4">
              {isEdit && (
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="rounded-lg">Hủy</Button>
                </DialogClose>
              )}
              <Button type="submit" className="rounded-lg">Lưu giao dịch</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function CurrencyClarityApp() {
  const { exchangeRate, updateExchangeRate, isLoading: isRateLoading } = useExchangeRate();
  const { 
    transactions, 
    addTransaction, 
    editTransaction,
    deleteTransaction, 
    resetTransactions, 
    restoreLastDeleted,
    lastDeletedBatch,
    toggleTransactionTag,
    isLoading: isTransactionsLoading 
  } = useTransactions(undefined, exchangeRate);
  
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [tempRate, setTempRate] = useState<string>("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isResetRevenueDialogOpen, setIsResetRevenueDialogOpen] = useState(false);
  const [isFeeVisible, setIsFeeVisible] = useState(true);

  useEffect(() => {
    const storedVisibility = localStorage.getItem('feeVisibility_v1');
    if (storedVisibility !== null) {
      setIsFeeVisible(JSON.parse(storedVisibility));
    }
  }, []);

  useEffect(() => {
    if (!isRateLoading) {
      setTempRate(String(exchangeRate));
    }
  }, [exchangeRate, isRateLoading]);
  
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      try {
        const dateA = parseISO(a.timestamp);
        const dateB = parseISO(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        console.error("Failed to parse transaction date for sorting:", e);
        return 0;
      }
    });
  }, [transactions]);
  
  const handleAddTransactionSubmit = (data: { senderName: string; twdAmount: number; feeTwd: number | undefined; }) => {
    const fee = data.feeTwd !== undefined && data.feeTwd > 0 ? data.feeTwd : 0;
    addTransaction({...data, feeTwd: fee});
  };
  
  const handleEditTransactionSubmit = (data: { senderName: string; twdAmount: number; feeTwd: number | undefined; }) => {
    if (!editingTransaction) return;
    const fee = data.feeTwd !== undefined && data.feeTwd > 0 ? data.feeTwd : 0;
    editTransaction(editingTransaction.id, {...data, feeTwd: fee}, editingTransaction.exchangeRate);
  };
  
  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (deletingTransactionId) {
      deleteTransaction([deletingTransactionId]);
      setDeletingTransactionId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.length > 0) {
      deleteTransaction(selectedTransactions);
      setSelectedTransactions([]);
    }
  };
  
  const handleResetConfirm = () => {
    resetTransactions();
    setSelectedTransactions([]);
    setIsResetRevenueDialogOpen(false);
  };
  
  const handleRestoreConfirm = () => {
    restoreLastDeleted();
  };

  const handleToggleFeeVisibility = () => {
    const newVisibility = !isFeeVisible;
    setIsFeeVisible(newVisibility);
    localStorage.setItem('feeVisibility_v1', JSON.stringify(newVisibility));
  };

  const overallTotals = useMemo(() => {
    const totals = sortedTransactions.reduce((acc, curr) => {
      acc.totalTwd += curr.twdAmount;
      acc.totalFeeTwd += curr.feeTwd;
      acc.totalVnd += curr.vndAmount;
      return acc;
    }, { totalTwd: 0, totalFeeTwd: 0, totalVnd: 0 });
    return totals;
  }, [sortedTransactions]);

  const selectedTotals = useMemo(() => {
    if (selectedTransactions.length === 0) {
        return { totalTwd: 0, totalVnd: 0 };
    }
    return sortedTransactions
    .filter(t => selectedTransactions.includes(t.id))
    .reduce((acc, curr) => {
        acc.totalTwd += curr.twdAmount;
        acc.totalVnd += curr.vndAmount;
        return acc;
    }, { totalTwd: 0, totalVnd: 0 });
  }, [selectedTransactions, sortedTransactions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(sortedTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, id]);
    } else {
      setSelectedTransactions(prev => prev.filter(tId => tId !== id));
    }
  };

  if (isRateLoading || isTransactionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const showRestoreButton = lastDeletedBatch.length > 0;
  const showDeleteSelectedButton = selectedTransactions.length > 0;
  const showResetButton = transactions.length > 0 && !showDeleteSelectedButton;

  return (
    <main className="min-h-screen flex justify-center pb-4 bg-background">
      <div className="container mx-auto px-2 pb-2 max-w-5xl">

        <div className="text-center py-0 mt-0 mb-0">
          <h1 className="text-3xl font-bold tracking-wider text-primary/80 font-headline drop-shadow-sm leading-none">NMHMIHI</h1>
        </div>

        <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <label htmlFor="exchangeRateInput" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Tỷ giá (1 TWD = {exchangeRate.toLocaleString()} VND):</label>
          </div>
          <div className="flex items-center space-x-2 flex-grow">
            <Input
              id="exchangeRateInput"
              type="number"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
              placeholder="Nhập tỷ giá mới"
              aria-label="Tỷ giá TWD sang VND"
              className="flex-grow h-10 rounded-lg"
              autoComplete="off"
            />
            <Button 
              onClick={() => {
                const newRate = parseFloat(tempRate);
                if (!isNaN(newRate) && newRate > 0) {
                  updateExchangeRate(newRate);
                }
              }}
              className="h-10 px-4 rounded-lg shrink-0"
              size="sm"
            >
              Cập nhật
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <Card className="shadow-md border-none bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden">
                 <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-primary/5">
                  <CardTitle className="flex items-center text-base font-bold font-headline text-foreground/80">
                    <Sigma className="mr-2 h-5 w-5 text-primary" /> Tổng kết
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pt-4 pb-6">
                  <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground font-medium">Tổng TWD:</span>
                        <span className="font-bold text-lg">{overallTotals.totalTwd.toLocaleString()} TWD</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground font-medium">Tổng VND:</span>
                        <span className="font-bold text-lg text-primary">{overallTotals.totalVnd.toLocaleString()} VND</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground font-medium">Tổng Phí (TWD):</span>
                          <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full" onClick={handleToggleFeeVisibility}>
                                {isFeeVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">Ẩn/Hiện tổng phí</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isFeeVisible ? 'Ẩn tổng phí' : 'Hiện tổng phí'}</p>
                            </TooltipContent>
                          </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-bold text-lg">{isFeeVisible ? `${overallTotals.totalFeeTwd.toLocaleString()} TWD` : '********'}</span>
                      </div>
                  </div>

                  {selectedTransactions.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-accent/30 border border-accent">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground font-medium">Đã chọn:</span>
                            <span className="font-bold text-lg text-accent-foreground">{selectedTotals.totalTwd.toLocaleString()} TWD</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground font-medium">VND tương ứng:</span>
                            <span className="font-bold text-lg text-primary">{selectedTotals.totalVnd.toLocaleString()} VND</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="w-full md:w-2/3">
              <Card className="shadow-md border-none bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-primary/5">
                  <CardTitle className="flex items-center text-base font-bold font-headline text-foreground/80">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Lịch sử giao dịch
                  </CardTitle>
                   <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="rounded-full px-4 shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm mới
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pt-4 pb-6">
                  {sortedTransactions.length > 0 ? (
                      <TooltipProvider>
                      <div className="overflow-x-auto rounded-xl border border-border/50">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="px-4 py-3 w-[1%]">
                                <Checkbox
                                    checked={sortedTransactions.length > 0 && selectedTransactions.length === sortedTransactions.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Chọn tất cả"
                                  />
                              </TableHead>
                              <TableHead className="px-4 py-3 font-bold">Người gửi</TableHead>
                              <TableHead className="text-right px-4 py-3 font-bold">TWD</TableHead>
                              <TableHead className="text-right px-4 py-3 font-bold">VND</TableHead>
                              <TableHead className="text-right px-4 py-3 font-bold">Phí</TableHead>
                              <TableHead className="text-right px-4 py-3 font-bold">Tỷ giá</TableHead>
                              <TableHead className="px-4 py-3 font-bold">Thời gian</TableHead>
                              <TableHead className="text-right px-4 py-3 w-[1%] whitespace-nowrap font-bold">Hành động</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedTransactions.map(t => (
                              <TableRow 
                                key={t.id} 
                                data-state={selectedTransactions.includes(t.id) ? "selected" : ""}
                                className={cn(
                                  "transition-all duration-200 border-b border-border/30",
                                  t.tag === 'other' ? 'bg-destructive/5 hover:bg-destructive/10 data-[state=selected]:bg-destructive/15' : 'hover:bg-muted/30 data-[state=selected]:bg-primary/5'
                                )}
                              >
                                <TableCell className="px-4 py-3">
                                    <Checkbox
                                      checked={selectedTransactions.includes(t.id)}
                                      onCheckedChange={(checked) => handleSelectOne(t.id, !!checked)}
                                      aria-label="Chọn giao dịch"
                                    />
                                </TableCell>
                                <TableCell className="font-bold px-4 py-3">{t.senderName}</TableCell>
                                <TableCell className={cn("text-right px-4 py-3 font-medium", t.twdAmount < 0 && "text-destructive")}>{t.twdAmount.toLocaleString()}</TableCell>
                                <TableCell className={cn("text-right font-bold px-4 py-3", t.vndAmount < 0 ? "text-destructive" : "text-primary")}>{t.vndAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right px-4 py-3 text-muted-foreground">{t.feeTwd.toLocaleString()}</TableCell>
                                <TableCell className="text-right px-4 py-3 text-muted-foreground">{t.exchangeRate.toLocaleString()}</TableCell>
                                <TableCell className="px-4 py-3 text-xs text-muted-foreground">{t.timestamp ? format(parseISO(t.timestamp), 'dd/MM/yy HH:mm') : ''}</TableCell>
                                <TableCell className="text-right space-x-1 px-4 py-3">
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" onClick={() => toggleTransactionTag(t.id)} aria-label="Đánh dấu" className="p-0 h-8 w-8 rounded-full hover:bg-accent">
                                            <UserCheck className={cn("h-4 w-4", t.tag === 'other' ? 'text-accent-foreground' : 'text-muted-foreground')} />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p>{t.tag === 'other' ? 'Đánh dấu là của bạn' : 'Đánh dấu là chuyển hộ'}</p>
                                      </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" onClick={() => openEditDialog(t)} aria-label="Sửa" className="p-0 h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                            <Edit3 className="h-4 w-4" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p>Sửa giao dịch</p>
                                      </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" onClick={() => setDeletingTransactionId(t.id)} aria-label="Xóa" className="p-0 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p>Xóa giao dịch</p>
                                      </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      </TooltipProvider>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 opacity-40">
                      <History className="h-12 w-12 mb-2 text-muted-foreground" />
                      <p className="text-center font-medium">Chưa có giao dịch nào!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
        
        <div className="mt-6">
          <Card className="shadow-md border-none bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-primary/5">
              <CardTitle className="flex items-center text-base font-bold font-headline text-foreground/80">
                <Settings className="mr-2 h-5 w-5 text-primary" /> Quản lý dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4 px-6 pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    {showRestoreButton && (
                        <Button onClick={handleRestoreConfirm} variant="outline" className="w-full rounded-xl border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all">
                          <History className="mr-2 h-5 w-5 text-primary" /> Khôi phục {lastDeletedBatch.length} mục đã xóa
                        </Button>
                    )}
                    {showDeleteSelectedButton && (
                      <Button onClick={handleDeleteSelected} variant="destructive" className="w-full rounded-xl shadow-sm hover:shadow-md transition-all">
                          <Trash2 className="mr-2 h-5 w-5" /> Xóa {selectedTransactions.length} mục đã chọn
                        </Button>
                    )}
                    {showResetButton && (
                        <Button onClick={() => setIsResetRevenueDialogOpen(true)} variant="outline" className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-all">
                          <RotateCcw className="mr-2 h-5 w-5" /> Làm mới toàn bộ
                        </Button>
                    )}
                    {!showRestoreButton && !showDeleteSelectedButton && !showResetButton && (
                        <p className="text-sm text-center text-muted-foreground font-medium py-2 w-full italic">Hệ thống đang hoạt động ổn định.</p>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
        
        <footer className="text-center py-10 text-sm text-muted-foreground/60 font-medium">
          <span suppressHydrationWarning>© {new Date().getFullYear()}</span> bản quyền thuộc về nmhmihi Minh Hiển
        </footer>

        {isAddDialogOpen && (
          <TransactionDialog
            key="add-transaction"
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSubmit={handleAddTransactionSubmit}
            defaultValues={{ feeTwd: 100 }}
            isEdit={false}
          />
        )}

        {editingTransaction && isEditDialogOpen && (
          <TransactionDialog
            key={editingTransaction.id}
            isOpen={isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTransaction(null);
              }
              setIsEditDialogOpen(open);
            }}
            onSubmit={handleEditTransactionSubmit}
            defaultValues={{
              senderName: editingTransaction.senderName,
              twdAmount: editingTransaction.twdAmount,
              feeTwd: editingTransaction.feeTwd,
            }}
            isEdit={true}
          />
        )}
        
        <Dialog open={!!deletingTransactionId} onOpenChange={(open) => {if(!open) setDeletingTransactionId(null)}}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa giao dịch này không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeletingTransactionId(null)} className="rounded-xl">Hủy</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-xl">Xóa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isResetRevenueDialogOpen} onOpenChange={setIsResetRevenueDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Làm mới toàn bộ dữ liệu?</DialogTitle>
              <DialogDescription>
                Hành động này sẽ xóa tất cả các giao dịch hiện tại. Bạn vẫn có thể khôi phục lại chúng sau đó nếu cần.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsResetRevenueDialogOpen(false)} className="rounded-xl">Hủy</Button>
              <Button variant="destructive" onClick={handleResetConfirm} className="rounded-xl">Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
