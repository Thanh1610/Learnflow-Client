import { hasura } from '@/lib/hasura';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const GENERAL_DEPARTMENT_NAME = 'General Department';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing fields',
        },
        { status: 400 }
      );
    }

    // 1. Kiểm tra email đã tồn tại chưa (chỉ check user chưa bị xóa)
    const checkEmailQuery = `
      query CheckEmail($email: String1!) {
        user(where: { _and: [{ email: { _eq: $email } }, { deletedAt: { _is_null: true } }] }) {
          id
        }
      }
    `;

    const emailCheckResult = await hasura<{
      user: Array<{ id: number }>;
    }>(checkEmailQuery, { email });

    if (emailCheckResult.user && emailCheckResult.user.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
        },
        { status: 400 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tìm hoặc tạo General Department
    const findDepartmentQuery = `
      query FindDepartment($name: String1!) {
        department(where: { _and: [{ name: { _eq: $name } }, { deletedAt: { _is_null: true } }] }) {
          id
        }
      }
    `;

    const departmentResult = await hasura<{
      department: Array<{ id: number }>;
    }>(findDepartmentQuery, { name: GENERAL_DEPARTMENT_NAME });

    let departmentId: number;

    if (departmentResult.department && departmentResult.department.length > 0) {
      departmentId = departmentResult.department[0].id;
    } else {
      // Tạo General Department nếu chưa có
      const now = new Date().toISOString();
      const createDepartmentMutation = `
        mutation CreateDepartment($objects: [InsertDepartmentObjectInput!]!) {
          insertDepartment(objects: $objects) {
            returning {
              id
            }
          }
        }
      `;

      const createDeptResult = await hasura<{
        insertDepartment: { returning: Array<{ id: number }> };
      }>(createDepartmentMutation, {
        objects: [{ name: GENERAL_DEPARTMENT_NAME, updatedAt: now }],
      });

      if (
        !createDeptResult.insertDepartment.returning ||
        createDeptResult.insertDepartment.returning.length === 0
      ) {
        throw new Error('Failed to create General Department');
      }

      departmentId = createDeptResult.insertDepartment.returning[0].id;
    }

    // 4. Tạo user mới
    // Build user object with required fields
    // Use ISO string format for timestamp (same as successful test)
    const now = new Date().toISOString();
    const userObject: Record<string, unknown> = {
      email,
      password: hashedPassword,
      role: 'USER',
      provider: 'EMAIL_PASSWORD',
      updatedAt: now,
    };

    // Only include name if provided and not empty
    if (name && name.trim()) {
      userObject.name = name;
    }

    const createUserMutation = `
      mutation CreateUser($objects: [InsertUserObjectInput!]!) {
        insertUser(objects: $objects) {
          returning {
            id
            email
            name
          }
        }
      }
    `;

    try {
      const createUserResult = await hasura<{
        insertUser: {
          returning: Array<{ id: number; email: string; name: string | null }>;
        };
      }>(createUserMutation, {
        objects: [userObject],
      });

      if (
        !createUserResult.insertUser.returning ||
        createUserResult.insertUser.returning.length === 0
      ) {
        throw new Error('Failed to create user');
      }

      const newUser = createUserResult.insertUser.returning[0];
      const userId = newUser.id;

      // 5. Gán user vào General Department
      try {
        const linkUserDepartmentMutation = `
          mutation LinkUserDepartment($objects: [InsertUserDepartmentsObjectInput!]!) {
            insertUserDepartments(objects: $objects) {
              returning {
                A
                B
              }
            }
          }
        `;

        await hasura(linkUserDepartmentMutation, {
          objects: [{ a: userId, b: departmentId }],
        });
      } catch (linkError) {
        console.error('Failed to link user to department:', linkError);
        // Continue even if linking fails - user is already created
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        },
        { status: 201 }
      );
    } catch (createUserError) {
      throw createUserError;
    }
  } catch (err) {
    console.error('Register error:', err);
    console.error('Full error details:', JSON.stringify(err, null, 2));
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Server error',
      },
      { status: 500 }
    );
  }
}
