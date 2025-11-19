## API Catalog

1. **Tác dụng:** Liệt kê nhanh các API đang có trong `learnflow-admin`, giúp tracking và cập nhật tài liệu khi thêm/chỉnh sửa endpoint.

---

### Endpoint hiện có

- **POST /api/auth/register:** Đăng ký người dùng mới qua form client.
- **POST /api/auth/login:** Xác thực người dùng, trả về thông tin cơ bản + `token` JWT và đồng thời set cookie `auth_token` (HTTP-only, hết hạn sau 1h).
- **POST /api/auth/refresh:** Nhận `auth_refresh_token` (HTTP-only cookie), xoay vòng và cấp lại `auth_token` + refresh token mới nếu hợp lệ.
- **GET /api/users:** Lấy danh sách người dùng (sẽ cập nhật chi tiết sau khi implement).
