import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const algorithm = "pbkdf2_sha256";
const iterations = 120000;
const keyLength = 32;
const digest = "sha256";

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return `${algorithm}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [storedAlgorithm, storedIterations, salt, expectedHash] = storedHash.split("$");

  if (storedAlgorithm !== algorithm || !storedIterations || !salt || !expectedHash) {
    return false;
  }

  const actualHash = pbkdf2Sync(
    password,
    salt,
    Number(storedIterations),
    keyLength,
    digest
  ).toString("hex");

  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}
