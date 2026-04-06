'use client'
import { Icon } from '@iconify/react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChangeAction: (page: number) => void
    isLoading?: boolean
    maxVisiblePages?: number
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChangeAction,
    isLoading = false,
    maxVisiblePages = 10
}: PaginationProps) {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const delta = 1; // Number of pages to show around current page

        if (totalPages <= 10) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 4) {
                pages.push('...');
            }

            // Calculate range around current page
            let start = Math.max(2, currentPage - delta);
            let end = Math.min(totalPages - 1, currentPage + delta);

            // Adjust range to show more numbers if near the ends
            if (currentPage <= 4) {
                end = 7;
            } else if (currentPage >= totalPages - 3) {
                start = totalPages - 6;
            }

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 3) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-bold text-slate-500">
                แสดงผล หน้า {currentPage} จาก {totalPages}
            </p>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {/* Previous Button */}
                <button
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => onPageChangeAction(currentPage - 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all disabled:opacity-40"
                    aria-label="หน้าก่อนหน้า"
                >
                    <Icon icon="solar:alt-arrow-left-linear" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">
                                ...
                            </span>
                        );
                    }

                    const pageNum = page as number;
                    const isActive = currentPage === pageNum;
                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChangeAction(pageNum)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                isActive 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                {/* Next Button */}
                <button
                    disabled={currentPage === totalPages || isLoading}
                    onClick={() => onPageChangeAction(currentPage + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all disabled:opacity-40"
                    aria-label="หน้าถัดไป"
                >
                    <Icon icon="solar:alt-arrow-right-linear" />
                </button>
            </div>
        </div>
    );
}
