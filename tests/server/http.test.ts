import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { HttpBodyError, corsAllowOrigin, readJsonBody } from '../../server/http';

function fakeReq(chunks: Buffer[]): IncomingMessage {
  return Readable.from(chunks) as unknown as IncomingMessage;
}

describe('readJsonBody', () => {
  it('parses a small JSON body', async () => {
    const body = await readJsonBody(fakeReq([Buffer.from('{"text":"안녕"}')]));
    expect(body).toEqual({ text: '안녕' });
  });

  it('rejects oversized bodies before parsing', async () => {
    const big = Buffer.alloc(100, 97);
    await expect(readJsonBody(fakeReq([big]), 50)).rejects.toBeInstanceOf(HttpBodyError);
    await expect(readJsonBody(fakeReq([big]), 50)).rejects.toMatchObject({ status: 413 });
  });
});

describe('corsAllowOrigin', () => {
  it('echoes unrestricted origins', () => {
    expect(corsAllowOrigin('https://localhost:5173', null)).toBe('https://localhost:5173');
    expect(corsAllowOrigin(undefined, null)).toBe('*');
  });

  it('only echoes allowlisted origins when restricted', () => {
    expect(corsAllowOrigin('https://app.example', ['https://app.example'])).toBe('https://app.example');
    expect(corsAllowOrigin('https://evil.example', ['https://app.example'])).toBeNull();
  });
});
