import type { StoredAuthUser } from "@/lib/auth/token-storage";

export function getAuthUserDisplayName(user: StoredAuthUser | null): string {
  if (!user) {
    return "Người dùng";
  }

  if (user.isGuest) {
    return "Khách";
  }

  return user.fullName?.trim() || user.email;
}

export function getAuthUserIdentifier(user: StoredAuthUser | null): string {
  if (!user) {
    return "Không xác định";
  }

  return user.isGuest ? "Phiên khách riêng tư" : user.email;
}

export function getAuthUserRoleLabel(user: StoredAuthUser | null): string {
  if (user?.isGuest) {
    return "Khách";
  }

  switch (user?.role?.toUpperCase()) {
    case "ADMIN":
      return "Quản trị viên";
    case "USER":
      return "Người dùng";
    default:
      return user?.role || "Người dùng";
  }
}

export function getAuthUserInitial(user: StoredAuthUser | null): string {
  return getAuthUserDisplayName(user).charAt(0).toUpperCase() || "U";
}
