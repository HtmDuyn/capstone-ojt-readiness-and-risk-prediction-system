import React from "react";
import { DashboardGridIcon } from "@/components/common/icons/AppIcons";
import { Bell, Building2, Handshake, Award, UserCheck } from "lucide-react";
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
    label: "Doanh nghiệp đối tác",
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
        label: "Mở đợt đăng ký",
        path: "/qhdn/registration-windows",
        icon: <UserCheck size={16} />,
      },
      {
        id: "coordination",
        label: "Điều phối OJT",
        path: "/qhdn/coordination",
        icon: <Handshake size={16} />,
      },
    ],
    banner: {
      title: "Quản lý & Điều phối OJT",
      description:
        "Mở đợt đăng ký cho sinh viên đã được bàn giao và theo dõi hồ sơ sinh viên gửi trực tiếp đến doanh nghiệp.",
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
        "Công bố điểm cho sinh viên và xuất báo cáo OJT theo học kỳ.",
      badge: "Kết quả OJT",
      primaryActionLabel: "Xuất báo cáo",
    },
  },
  {
    id: "notifications",
    label: "Thông báo",
    path: "/qhdn/notifications",
    icon: <Bell size={20} />,
    banner: {
      title: "Thông báo",
      description: "Theo dõi thông báo được gửi đến tài khoản Quan hệ Doanh nghiệp.",
      badge: "Phòng QHDN",
    },
  },
];
