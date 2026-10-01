const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not configured. Please set JWT_SECRET in environment variables.",
  );
}

export const authConfig = {
  jwtSecret,
  accessTokenExpiresIn: "1d",
} as const;