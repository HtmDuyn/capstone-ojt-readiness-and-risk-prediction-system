import React from "react";
import { DashboardGridIcon } from "@/components/common/icons/AppIcons";
import { Building2, Handshake, Award, UserCheck } from "lucide-react";
import type { NavItem } from "@/types/common.types";

export const QHDN_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Tổng quan",
    path: "/qhdn/dashboard",
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: "Cổng Quan hệ Doanh nghiệp",
      description:
        "Theo dõi chỉ số tiếp nhận OJT, phản hồi của doanh nghiệp đối tác và thống kê theo từng học kỳ.",
      badge: "Phòng QHDN",
      primaryActionLabel: "Xuất báo cáo OJT",
    },
  },
  {
    id: "enterprises",
    label: "Doanh nghiệp & Tuyển dụng",
    path: "/qhdn/enterprises",
    icon: <Building2 size={20} />,
    banner: {
      title: "Quản lý Doanh nghiệp & Vị trí Thực tập",
      description:
        "Quản lý danh sách doanh nghiệp liên kết, vị trí thực tập tuyển dụng và chỉ tiêu số lượng tiếp nhận (quota).",
      badge: "Đối tác & Quota",
      primaryActionLabel: "Import doanh nghiệp",
    },
  },
  {
    id: "ojt-management",
    label: "Quản lý OJT",
    path: "/qhdn/registration-windows",
    icon: <Handshake size={20} />,
    children: [
      {
        id: "registration-windows",
        label: "Tiếp nhận & Duyệt hồ sơ",
        path: "/qhdn/registration-windows",
        icon: <UserCheck size={16} />,
      },
      {
        id: "coordination",
        label: "Theo dõi & Điều phối",
        path: "/qhdn/coordination",
        icon: <Handshake size={16} />,
      },
    ],
    banner: {
      title: "Quản lý & Điều phối OJT",
      description:
        "Tiếp nhận bàn giao từ PĐT, mở đợt đăng ký và điều phối ghép cặp sinh viên vào doanh nghiệp tiếp nhận.",
      badge: "Quản lý OJT",
      primaryActionLabel: "Mở đợt đăng ký OJT",
    },
  },
  {
    id: "evaluations",
    label: "Báo cáo OJT",
    path: "/qhdn/evaluations",
    icon: <Award size={20} />,
    banner: {
      title: "Báo cáo OJT",
      description:
        "Tổng hợp kết quả đánh giá kỹ năng chuyên môn, thái độ và điểm thực tập OJT từ người hướng dẫn doanh nghiệp.",
      badge: "Kết quả OJT",
      primaryActionLabel: "Tải bảng đánh giá",
    },
  },
];
