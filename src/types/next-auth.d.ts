import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    phone?: string;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string;
    role?: string;
    id?: string;
  }
}
