import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: number; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify và decode JWT token
 * @param token JWT token string
 * @returns Decoded payload hoặc null nếu invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret);

    // jwt.verify có thể trả về string hoặc object
    if (typeof decoded === 'string') {
      return null;
    }

    // Kiểm tra xem decoded có đủ các field cần thiết không
    const payload = decoded as unknown as JWTPayload;
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification error:', error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired');
    } else if (error instanceof jwt.NotBeforeError) {
      console.error('JWT token not active');
    } else {
      console.error('Unknown JWT error:', error);
    }
    return null;
  }
}

/**
 * Tạo JWT access token
 * @param payload Payload chứa user info
 * @param expiresIn Thời gian hết hạn (seconds), mặc định 15 phút
 * @returns JWT token string
 */
export function signToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: number = 15 * 60
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, secret, { expiresIn });
}
