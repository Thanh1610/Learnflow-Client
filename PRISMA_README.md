## Prisma Workflow Guide

Tài liệu này mô tả nhanh cách làm việc với Prisma trong dự án `learnflow-admin`.

### 1. Chuẩn bị môi trường

- Đảm bảo `DATABASE_URL` đã được cấu hình trong file `.env` tại thư mục gốc.
- Cài dependency: `npm install`.

### 2. Đồng bộ schema

```bash
npx prisma db push
```

Sử dụng khi bạn muốn áp dụng schema hiện tại (`prisma/schema.prisma`) trực tiếp lên database mà không tạo migration.

### 3. Tạo migration mới

```bash
npx prisma migrate dev --name your_migration_name
```

- Lệnh này sinh file SQL trong thư mục `prisma/migrations/`.
- Dùng khi muốn ghi lại lịch sử thay đổi schema để đưa lên các môi trường khác.

### 4. Chạy migration trên môi trường khác (CI/Prod)

```bash
npx prisma migrate deploy
```

- Đảm bảo `DATABASE_URL` trỏ đến đúng database cần cập nhật.

### 5. Sinh Prisma Client

```bash
npx prisma generate
```

- Prisma Client sẽ được tạo trong `node_modules/.prisma`.
- Thường được chạy tự động sau `npm install`, nhưng khi chỉnh sửa schema xong mà không chạy migrate/db push thì nên generate lại để tránh lỗi type.

### 6. Prisma Studio

```bash
npx prisma studio
```

- Mở giao diện quản lý DB trong browser.
- Nếu không muốn dùng Prisma Accelerate, thêm cờ `--no-accelerate`.

### 7. Seed dữ liệu (nếu có script)

```bash
npm run db:seed
```

- Kiểm tra `package.json` để biết script seed hiện có.

### 8. Debug nhanh

- `npx prisma validate` để kiểm tra schema hợp lệ.
- `npx prisma format` để format file `schema.prisma`.

### 9. Tips

- Luôn commit file migration kèm code thay đổi để giữ đồng bộ.
- Khi đổi `DATABASE_URL`, nên chạy lại `db push` hoặc `migrate deploy` tùy tình huống.
