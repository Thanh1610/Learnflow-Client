import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already in use',
        },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 12);

    // Tìm General Department (đã được seed sẵn trong DB)
    const generalDepartment = await prisma.department.findUnique({
      where: { name: GENERAL_DEPARTMENT_NAME },
    });

    if (!generalDepartment) {
      return NextResponse.json(
        {
          success: false,
          error: 'General Department not found',
        },
        { status: 500 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        departments: {
          connect: {
            id: generalDepartment.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}
