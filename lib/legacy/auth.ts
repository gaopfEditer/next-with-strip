import "server-only"

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

import { env } from "@/env.mjs"

const LEGACY_TOKEN_COOKIE = "legacy_token"
const LEGACY_TOKEN_EXPIRES_IN = "7d"

type LegacyTokenPayload = {
  userId: string
  email: string
}

function getJwtSecret() {
  return env.LEGACY_JWT_SECRET ?? env.JWT_SECRET ?? env.NEXTAUTH_SECRET
}

export function signLegacyToken(payload: LegacyTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: LEGACY_TOKEN_EXPIRES_IN,
  })
}

export function verifyLegacyToken(token: string): LegacyTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as LegacyTokenPayload
  } catch {
    return null
  }
}

export function getLegacyTokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  return cookies().get(LEGACY_TOKEN_COOKIE)?.value ?? null
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function legacyAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  }
}

export function getLegacyTokenCookieName() {
  return LEGACY_TOKEN_COOKIE
}
