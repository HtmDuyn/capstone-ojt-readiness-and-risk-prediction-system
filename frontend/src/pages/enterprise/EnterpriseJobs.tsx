import React, { useEffect, useMemo, useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';
import {
  enterpriseService,
  type RecruitmentPost,
  type RecruitmentPostPosition,
} from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';

interface RecruitmentPositionInfo extends RecruitmentPostPosition {
  postTitle: string;
  periodCode?: string;
  postStatus: RecruitmentPost['status'];
  deadlineAt?: string | null;
}

const PAGE_SIZE = 9;
const API_PAGE_SIZE = 100;

const POST_STATUS_LABELS: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đang tuyển',
  REJECTED: 'Bị từ chối',
  CLOSED: 'Đã đóng',
  ARCHIVED: 'Đã lưu trữ',
};

const POST_STATUS_STYLES: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-slate-100 text-slate-600',
};

export const EnterpriseJobs: React.FC = () => {
  // Lấy companyId từ EnterpriseContext (đã load sẵn — không gọi API lại)
  const { companyId } = useEnterprise();
  const [positions, setPositions] = useState<RecruitmentPositionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Chờ companyId sẵn có mới tải dữ liệu
    if (!companyId) return;
    let cancelled = false;

    const loadPositions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Truyền companyId vào API — bắt buộc để backend scope đúng doanh nghiệp
        const firstPage = await enterpriseService.listRecruitmentPosts(companyId, {
          page: 1,
          limit: API_PAGE_SIZE,
        });
        if (!firstPage?.success || !firstPage.data) {
          throw new Error('Không thể tải thông tin vị trí tuyển dụng.');
        }

        const posts = [...firstPage.data.items];
        const totalPages = Math.ceil(firstPage.data.total / firstPage.data.limit);
        for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
          // Truyền companyId cho mọi trang phân trang
          const response = await enterpriseService.listRecruitmentPosts(companyId!, {
            page: currentPage,
            limit: API_PAGE_SIZE,
          });
          if (!response?.success || !response.data) {
            throw new Error(`Không thể tải thông tin vị trí ở trang ${currentPage}.`);
          }
          posts.push(...response.data.items);
        }

        if (!cancelled) {
          setPositions(
            posts.flatMap((post) =>
              (post.positions ?? []).map((position) => ({
                ...position,
                postTitle: post.title,
                periodCode: post.periodCode,
                postStatus: post.status,
                deadlineAt: post.deadlineAt,
              }))
            )
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Không thể tải thông tin vị trí tuyển dụng.';
          setError(message);
          console.error('Failed to load recruitment positions:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPositions();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, companyId]);


  const filteredPositions = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) return positions;
    return positions.filter((position) =>
      [
        position.title,
        position.code,
        position.description,
        position.requirements,
        position.location,
        position.postTitle,
        position.periodCode,
      ]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [positions, searchTerm]);

  const totalPages = Math.ceil(filteredPositions.length / PAGE_SIZE);
  const visiblePositions = filteredPositions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Thông tin Vị trí Tuyển dụng"
        description="Tra cứu vị trí thực tập, yêu cầu và chỉ tiêu tiếp nhận đã được ghi nhận. Trang này chỉ cung cấp thông tin, không hỗ trợ đăng tuyển."
        badge="Thông tin chỉ đọc"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Tìm theo vị trí, mã, yêu cầu hoặc địa điểm..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredPositions.length}</strong> vị trí
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Đang tải thông tin vị trí tuyển dụng...
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <button
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && visiblePositions.length === 0 && (
        <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {searchTerm
              ? 'Không tìm thấy vị trí phù hợp.'
              : 'Chưa có thông tin vị trí tuyển dụng.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Các vị trí đã được ghi nhận sẽ hiển thị tại đây để tra cứu.
          </p>
        </div>
      )}

      {!loading && !error && visiblePositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePositions.map((position) => (
            <article
              key={`${position.id}-${position.postTitle}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                      {position.code}
                    </span>
                    <h2 className="font-bold text-slate-900 text-base mt-0.5">
                      {position.title}
                    </h2>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${POST_STATUS_STYLES[position.postStatus]}`}
                  >
                    {POST_STATUS_LABELS[position.postStatus]}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {position.postTitle}
                  {position.periodCode ? ` · ${position.periodCode}` : ''}
                </p>

                {position.description && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-400 mb-1">
                      Mô tả
                    </h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">
                      {position.description}
                    </p>
                  </div>
                )}

                {position.requirements && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-400 mb-1">
                      Yêu cầu
                    </h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">
                      {position.requirements}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {position.location && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {position.location}
                      {position.workMode ? ` · ${position.workMode}` : ''}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Chỉ tiêu còn lại</span>
                    <span className="font-bold text-slate-900">
                      {position.remainingSlots} / {position.capacity} sinh viên
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-600">
            Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() =>
              setPage((currentPage) => Math.min(totalPages, currentPage + 1))
            }
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EnterpriseJobs;
