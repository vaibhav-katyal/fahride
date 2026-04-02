import crypto from "crypto";

export const generateETag = (data: unknown): string => {
  const jsonString = JSON.stringify(data);
  return crypto.createHash("md5").update(jsonString).digest("hex");
};

export const checkETag = (
  currentETag: string,
  clientETag: string | undefined
): { isModified: boolean; eTag: string } => {
  const isModified = !clientETag || clientETag !== currentETag;
  return { isModified, eTag: currentETag };
};
