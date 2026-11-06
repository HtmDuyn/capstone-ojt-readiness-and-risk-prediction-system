import type { CurriculumDetail } from '@/types/education/curriculum.types';
import { curriculumService } from './curriculum.service';
const getString = (value: unknown) => value == null ? '' : String(value).trim();
export const resolveCurriculumCourseIds =
      async (
        courseCodes: string[],
        curriculumDetail: CurriculumDetail | null,
      ) => {
        const uniqueCodes =
          Array.from(
            new Set(
              courseCodes
                .map(
                  (code) =>
                    code.trim(),
                )
                .filter(Boolean),
            ),
          );

        const cache =
          new Map<
            string,
            number
          >();

        /*
         * Tận dụng data đã có trên màn hiện tại.
         */
        curriculumDetail?.courses.forEach(
          (course) => {
            cache.set(
              course.courseCode
                .trim()
                .toLowerCase(),
              course.courseId,
            );
          },
        );

        curriculumDetail?.combos.forEach(
          (combo) => {
            combo.courses.forEach(
              (course) => {
                cache.set(
                  course.courseCode
                    .trim()
                    .toLowerCase(),
                  course.courseId,
                );
              },
            );
          },
        );

        const unresolved =
          uniqueCodes.filter(
            (code) =>
              !cache.has(
                code.toLowerCase(),
              ),
          );

        /*
         * Không gọi cùng lúc quá nhiều API.
         */
        const concurrency =
          6;

        for (
          let index = 0;
          index <
          unresolved.length;
          index +=
            concurrency
        ) {
          const batch =
            unresolved.slice(
              index,
              index +
                concurrency,
            );

          const results =
            await Promise.all(
              batch.map(
                async (
                  code,
                ) => {
                  const response =
                    await curriculumService.searchCourses(
                      {
                        page: 1,
                        limit: 20,
                        search:
                          code,
                      },
                    );

                  const found =
                    response.data.items.find(
                      (
                        item,
                      ) =>
                        item.code
                          .trim()
                          .toLowerCase() ===
                        code.toLowerCase(),
                    );

                  if (!found) {
                    throw new Error(
                      `Không tìm thấy môn "${code}" trong danh mục môn học.`,
                    );
                  }

                  return {
                    code,
                    id:
                      found.id,
                  };
                },
              ),
            );

          results.forEach(
            (item) => {
              cache.set(
                item.code.toLowerCase(),
                item.id,
              );
            },
          );
        }

        return cache;
      };

    /* =====================================================
       PARSE WORKBOOK
       ===================================================== */

