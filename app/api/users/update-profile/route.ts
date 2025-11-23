import { verifyAuth } from '@/lib/auth';
import { hasura } from '@/lib/hasura';
import type { UserType } from '@/types/user.type';
import { NextRequest, NextResponse } from 'next/server';

type UpdateUserResponse = {
  updateUserById: {
    affectedRows: number;
    returning: Array<
      Omit<UserType, 'dateOfBirth'> & {
        dateofbirth: string | null;
        id: number;
      }
    >;
  };
};

/**
 * Request body type - uses camelCase (dateOfBirth) to match TypeScript conventions
 * Note: GraphQL schema uses lowercase (dateofbirth), mapping happens in mutation
 */
type UpdateUserBody = {
  name?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null; // camelCase for TypeScript/API
  gender?: '1' | '2' | null;
  avatar?: string | null;
};

// GraphQL user fields fragment for reuse
const USER_FIELDS = `
  id
  name
  email
  phone
  gender
  avatar
  address
  dateofbirth
  githubId
  googleId
  createdAt
  provider
  role
  updatedAt
  deletedAt
`;

/**
 * Validates and normalizes user ID from query parameter
 */
function validateUserId(idParam: string | null): number | NextResponse {
  if (!idParam) {
    return NextResponse.json(
      { success: false, error: 'Missing id parameter' },
      { status: 400 }
    );
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid user id' },
      { status: 400 }
    );
  }

  return id;
}

/**
 * Validates and normalizes email
 */
function validateEmail(email: unknown): string | NextResponse {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    );
  }
  return email.trim();
}

/**
 * Validates and normalizes gender value
 */
function validateGender(gender: unknown): '1' | '2' | null | NextResponse {
  if (gender === '1' || gender === '2') {
    return gender;
  }
  if (gender === null || gender === undefined || gender === '') {
    return null;
  }
  return NextResponse.json(
    {
      success: false,
      error: 'Invalid gender value. Must be "1", "2", or null',
    },
    { status: 400 }
  );
}

/**
 * Builds gender set clause for GraphQL mutation
 */
function buildGenderSetClause(gender: '1' | '2' | null): string {
  return gender !== null
    ? `gender: { set: "${gender}" }`
    : `gender: { set: null }`;
}

/**
 * Maps GraphQL user response to TypeScript UserType
 * Converts dateofbirth (GraphQL lowercase) to dateOfBirth (TypeScript camelCase)
 * Converts id from number to string
 */
function mapUserResponse(
  user: Omit<UserType, 'dateOfBirth' | 'id'> & {
    dateofbirth: string | null;
    id: number;
  }
): UserType {
  return {
    ...user,
    id: String(user.id), // Convert id to string
    dateOfBirth: user.dateofbirth, // Map GraphQL dateofbirth -> TypeScript dateOfBirth
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Validate user ID
    const { searchParams } = new URL(req.url);
    const idValidation = validateUserId(searchParams.get('id'));
    if (idValidation instanceof NextResponse) {
      return idValidation;
    }
    const id = idValidation;

    // Verify that the user is updating their own profile
    const userId = authResult.payload.sub;
    if (id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You can only update your own profile',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    // Note: Request uses camelCase (dateOfBirth), will be mapped to dateofbirth for GraphQL
    const body = (await req.json()) as UpdateUserBody;
    const { name, phone, address, dateOfBirth, gender, avatar } = body;

    // Validate email
    const emailValidation = validateEmail(body.email);
    if (emailValidation instanceof NextResponse) {
      return emailValidation;
    }
    const email = emailValidation;

    // Validate gender
    const genderValidation = validateGender(gender);
    if (genderValidation instanceof NextResponse) {
      return genderValidation;
    }
    const genderValue = genderValidation;

    // Build mutation
    const mutation = `
      mutation UpdateUserProfile(
        $id: Int32!
        $name: String1
        $email: String1!
        $phone: String1
        $address: String1
        $dateofbirth: Date
        $avatar: String1
      ) {
        updateUserById(
          keyId: $id
          preCheck: { deletedAt: { _is_null: true } }
          updateColumns: {
            name: { set: $name }
            email: { set: $email }
            phone: { set: $phone }
            address: { set: $address }
            dateofbirth: { set: $dateofbirth }
            avatar: { set: $avatar }
            ${buildGenderSetClause(genderValue)}
          }
        ) {
          affectedRows
          returning {
            ${USER_FIELDS}
          }
        }
      }
    `;

    // Execute mutation
    // Map dateOfBirth (camelCase) to dateofbirth (GraphQL schema convention)
    const result = await hasura<UpdateUserResponse>(mutation, {
      id,
      name: name?.trim() || null,
      email,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      dateofbirth: dateOfBirth || null, // GraphQL uses lowercase
      avatar: avatar?.trim() || null,
    });

    // Check result
    if (result.updateUserById.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found or has been deleted' },
        { status: 404 }
      );
    }

    const updatedUser = result.updateUserById.returning[0];
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
