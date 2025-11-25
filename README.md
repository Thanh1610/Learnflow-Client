## Learnflow Admin

Next.js + Prisma + Postgres admin panel. Thực hiện tuần tự các bước dưới đây để chạy dự án.

## Yêu cầu trước khi chạy

1. Cài Node.js 18+.
2. Tạo hoặc cấp quyền truy cập tới một database Postgres cố định (có host, port, user, password rõ ràng) để dùng cho dự án.
3. Tạo file `.env` ở thư mục gốc, thêm biến `DATABASE_URL` tương ứng với instance đó và không commit file này lên git.
4. Khai báo thêm biến `JWT_SECRET` để ký token đăng nhập (ưu tiên chuỗi ngẫu nhiên đủ dài, tối thiểu 32 ký tự).

Mẫu `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learnflow"
JWT_SECRET="change-me-to-a-long-random-string"
```

## Cài đặt phụ thuộc

```bash
npm install
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:4000](http://localhost:4000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Learnflow-Admin
