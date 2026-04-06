export interface UserAccount {
  id?: string;
  name: string;
  email: string;
  phone: string;
  branch?: string;
  year?: string;
  role?: "user" | "admin";
  profileImageUrl?: string;
}

export const AUTH_CHANGED_EVENT = "poolmate-auth-changed";
const API_BASE = import.meta.env.VITE_API_URL || "https://fah-ride-dzg3aqhsfsdqh4fy.centralindia-01.azurewebsites.net/api/v1";

let currentUserMemory: UserAccount | null = null;

const emitAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isCollegeEmail = (email: string) =>
  normalizeEmail(email).endsWith("@chitkara.edu.in");

export const sanitizePhone = (value: string) => value.replace(/\D/g, "");

export const setCurrentUserFromAccount = (account: UserAccount, accessToken?: string) => {
  void accessToken;
  currentUserMemory = {
    id: account.id,
    name: account.name,
    email: normalizeEmail(account.email),
    phone: account.phone,
    branch: account.branch || "",
    year: account.year || "",
    role: account.role || "user",
    profileImageUrl: account.profileImageUrl || "",
  };

  emitAuthChanged();
};

export const getCurrentUser = (): UserAccount | null => {
  return currentUserMemory;
};

const fetchMe = async () => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: { user?: UserAccount };
  };

  return payload.data?.user || null;
};

export const hydrateCurrentUser = async () => {
  const meUser = await fetchMe();
  if (meUser) {
    setCurrentUserFromAccount(meUser);
    return meUser;
  }

  const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    clearSession();
    return null;
  }

  const refreshedUser = await fetchMe();
  if (refreshedUser) {
    setCurrentUserFromAccount(refreshedUser);
    return refreshedUser;
  }

  clearSession();
  return null;
};

export const logoutFromServer = async () => {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
};

export const clearSession = () => {
  currentUserMemory = null;
  emitAuthChanged();
};
