import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('jwt');

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/tasklist/:path*','/kanban/:path*'],
};
