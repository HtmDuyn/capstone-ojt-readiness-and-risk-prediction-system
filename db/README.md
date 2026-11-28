# Hướng dẫn chạy Backend, Frontend và Database

Hướng dẫn này dành cho chạy hệ thống trên máy cá nhân, dùng Supabase PostgreSQL làm database.

## 1. Chuẩn bị

- Cài Node.js và npm.
- Mở terminal tại thư mục gốc repository.
- Không đưa `backend/.env` hoặc `frontend/.env` lên Git; các file này chứa cấu hình riêng của máy.

## 2. Chạy Database trên Supabase

`db/database` là script dựng lại schema và seed data cho các bảng ứng dụng. Script reset các bảng do ứng dụng quản lý và schema lịch sử OJT trước khi dựng lại. Không chạy nếu cần giữ dữ liệu hiện tại.

Runner dùng kết nối PostgreSQL trực tiếp trong `backend/.env`, nên không bị giới hạn kích thước của Supabase SQL Editor. Cấu hình cần có một trong hai dạng:

- `DATABASE_URL` hoặc `SUPABASE_DATABASE_URL`; hoặc
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` và `DB_SSL=true`.

Trong PowerShell, chạy từ thư mục gốc repository:

```powershell
npm --prefix ..\backend run db:backend:reset -- --confirm-reset
```

Nếu terminal đang ở trong thư mục `db`, dùng đường dẫn tương đối lên một cấp:

```powershell
npm --prefix ..\backend run db:backend:reset -- --confirm-reset
```

Lệnh yêu cầu `--confirm-reset` vì nó xóa dữ liệu trong các bảng ứng dụng rồi nạp lại seed. Runner kiểm tra host có phải Supabase trước khi chạy. Script SQL chạy trong transaction; nếu lỗi trước khi commit, thay đổi của lần chạy đó sẽ rollback.

## 3. Chạy Backend

Mở terminal riêng:

```powershell
cd backend
npm install
npm run dev
```

Backend đọc cấu hình từ `backend/.env`, kết nối PostgreSQL rồi chạy API tại:

```text
http://localhost:3000
```

Để đổi port, đặt `PORT` trong `backend/.env`.

## 4. Chạy Frontend

Mở terminal thứ hai. Nếu chưa có `frontend/.env`, tạo từ file mẫu:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Trong `frontend/.env`, đặt API về backend local:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Sau đó chạy:

```powershell
cd frontend
npm install
npm run dev
```

Mở URL Vite in ra trong terminal, mặc định là `http://localhost:5173`.

## 5. Thứ tự chạy thường dùng

1. Chạy reset database nếu cần dựng lại toàn bộ dữ liệu seed.
2. Chạy backend và chờ backend kết nối DB thành công.
3. Chạy frontend rồi mở trang Vite.

Sau khi đã có database phù hợp, các lần khởi động hằng ngày chỉ cần chạy backend và frontend; không cần reset database.

## 6. Khắc phục lỗi thường gặp

- **SQL Editor báo query quá lớn:** dùng lệnh `npm --prefix backend run db:backend:reset -- --confirm-reset` ở trên; không dán toàn bộ `db/database` vào SQL Editor.
- **Backend không kết nối được DB:** kiểm tra host/port/database/user/password và `DB_SSL` trong `backend/.env`.
- **Frontend gọi nhầm API đã deploy:** kiểm tra `frontend/.env`; khi chạy local, `VITE_API_URL` phải là `http://localhost:3000/api`. Khởi động lại Vite sau khi đổi `.env`.
- **Cổng 3000 hoặc 5173 đang được dùng:** dừng tiến trình cũ hoặc đổi `PORT` của backend; Vite sẽ báo nếu phải chọn cổng khác.
