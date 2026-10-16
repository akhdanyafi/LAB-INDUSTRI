import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { contentTypeFor, isPrivate, repoOpen } from '@/lib/repo-storage';

function getContentType(absolutePath: string) {
    const ext = path.extname(absolutePath).toLowerCase();

    if (ext === '.pdf') return 'application/pdf';
    if (ext === '.doc') return 'application/msword';
    if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === '.ppt') return 'application/vnd.ms-powerpoint';
    if (ext === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (ext === '.xls') return 'application/vnd.ms-excel';
    if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.svg') return 'image/svg+xml';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.mp4') return 'video/mp4';
    if (ext === '.webm') return 'video/webm';
    if (ext === '.mov') return 'video/quicktime';

    return 'application/octet-stream';
}

async function resolveFile(params: Promise<{ path: string[] }>) {
    const urlParams = await params;
    const filePathArray = urlParams.path || [];

    if (filePathArray.some((segment: string) => segment.includes('..'))) {
        throw new Error('INVALID_PATH');
    }

    const relativePath = filePathArray.join('/');
    if (isPrivate(relativePath)) throw new Error('INVALID_PATH');
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    const fileStat = await stat(absolutePath);

    return {
        absolutePath,
        fileStat,
        contentType: getContentType(absolutePath),
    };
}

/** File disimpan di Repositori Lab; hanya file yang belum/gagal dipindah yang masih dibaca dari disk lokal. */
async function fromRepository(request: NextRequest, params: Promise<{ path: string[] }>, head: boolean) {
    const segments = (await params).path || [];
    if (segments.some((segment: string) => segment.includes('..'))) return new NextResponse('Invalid Path', { status: 400 });
    const rel = segments.join('/');
    if (isPrivate(rel)) return new NextResponse('File Not Found', { status: 404 });
    const upstream = await repoOpen(rel, { range: request.headers.get('range'), head });
    if (!upstream) return null;
    const headers: Record<string, string> = {
        'Content-Type': contentTypeFor(rel),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'Accept-Ranges': 'bytes',
    };
    for (const h of ['content-length', 'content-range']) {
        const v = upstream.headers.get(h);
        if (v) headers[h] = v;
    }
    return new NextResponse(head ? null : upstream.body, { status: upstream.status, headers });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const remote = await fromRepository(request, params, false);
        if (remote) return remote;
        const { absolutePath, fileStat, contentType } = await resolveFile(params);
        const fileSize = fileStat.size;
        const rangeHeader = request.headers.get('range');

        const baseHeaders = {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            'Accept-Ranges': 'bytes',
        };

        if (rangeHeader) {
            const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);

            if (!match) {
                return new NextResponse('Invalid Range', {
                    status: 416,
                    headers: {
                        ...baseHeaders,
                        'Content-Range': `bytes */${fileSize}`,
                    },
                });
            }

            const start = Number(match[1]);
            const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
            const end = Math.min(requestedEnd, fileSize - 1);

            if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) {
                return new NextResponse('Range Not Satisfiable', {
                    status: 416,
                    headers: {
                        ...baseHeaders,
                        'Content-Range': `bytes */${fileSize}`,
                    },
                });
            }

            const chunkSize = end - start + 1;
            const stream = createReadStream(absolutePath, { start, end });

            return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
                status: 206,
                headers: {
                    ...baseHeaders,
                    'Content-Length': String(chunkSize),
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                },
            });
        }

        const stream = createReadStream(absolutePath);

        return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
            headers: {
                ...baseHeaders,
                'Content-Length': String(fileSize),
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_PATH') {
            return new NextResponse('Invalid Path', { status: 400 });
        }

        return new NextResponse('File Not Found', { status: 404 });
    }
}

export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const remote = await fromRepository(request, params, true);
        if (remote) return remote;
        const { fileStat, contentType } = await resolveFile(params);

        return new NextResponse(null, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(fileStat.size),
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_PATH') {
            return new NextResponse('Invalid Path', { status: 400 });
        }

        return new NextResponse(null, { status: 404 });
    }
}
