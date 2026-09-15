import React, { useState } from "react";
import { Bell, CheckCircle2, Globe, Settings, Shield } from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";

const AdminSettings: React.FC = () => {
  const [systemName, setSystemName] = useState("OJT Readiness");
  const [language, setLanguage] = useState("Tiếng Việt");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    "Sinh viên": {
      system: true,
      email: true,
    },
    "Phòng Đào tạo": {
      system: true,
      email: true,
    },
    "Phòng Quan hệ Doanh nghiệp": {
      system: true,
      email: true,
    },
    "Doanh nghiệp": {
      system: true,
      email: true,
    },
    "Quản trị viên": {
      system: true,
      email: false,
    },
  });

  return (
    <div className="space-y-6">
      <PageBanner
        title="Cài đặt Chung"
        description="Cấu hình các tham số toàn cục của hệ thống OJT Readiness."
        badge="System Settings"
      />

      {/* Thông tin hệ thống */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Settings size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Thông tin hệ thống
            </h2>
            <p className="text-sm text-slate-500">
              Các thông tin cấu hình chung của hệ thống.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tên hệ thống
            </label>

            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Ngôn ngữ
            </label>

            <div className="relative">
              <Globe
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Cấu hình thông báo */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Bell size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cấu hình thông báo
            </h2>

            <p className="text-sm text-slate-500">
              Cấu hình kênh thông báo cho từng vai trò người dùng.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vai trò
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Thông báo trong hệ thống
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Thông báo Email
                </th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(notificationSettings).map(([role, settings]) => (
                <tr
                  key={role}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                    {role}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          [role]: {
                            ...prev[role as keyof typeof prev],
                            system: !settings.system,
                          },
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        settings.system ? "bg-orange-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          settings.system ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          [role]: {
                            ...prev[role as keyof typeof prev],
                            email: !settings.email,
                          },
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        settings.email ? "bg-orange-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          settings.email ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bảo trì hệ thống */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Shield size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Trạng thái hệ thống
            </h2>

            <p className="text-sm text-slate-500">
              Cấu hình trạng thái hoạt động chung của hệ thống.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Chế độ bảo trì
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Tạm ngưng hoạt động hệ thống để thực hiện bảo trì.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative h-6 w-11 rounded-full transition ${
                maintenanceMode ? "bg-orange-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  maintenanceMode ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4">
            <CheckCircle2
              size={17}
              className={
                maintenanceMode ? "text-orange-500" : "text-emerald-500"
              }
            />

            <span className="text-sm font-medium text-slate-600">
              {maintenanceMode
                ? "Hệ thống đang ở chế độ bảo trì"
                : "Hệ thống đang hoạt động bình thường"}
            </span>
          </div>
        </div>
      </section>

      {/* Lưu */}
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          <CheckCircle2 size={17} />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
