import { NextResponse } from "next/server";

export async function readJsonBody<T>(request: Request) {
  try {
    const data = (await request.json()) as T;
    return { data, error: null as NextResponse<unknown> | null };
  } catch {
    return {
      data: null as T | null,
      error: NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
    };
  }
}
