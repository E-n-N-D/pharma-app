"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import APIServiceManager from "@/services/APIServiceManager";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      const validateToken = async () => {
        try {
          const api = APIServiceManager.getInstance();
          const response = await api.getCurrentUser();

          if (!response.success) {
            // If token is invalid and not on login page, redirect to login
            if (pathname !== "/") {
              router.push("/");
            }
          } else if (pathname === "/") {
            // If token is valid and on login page, redirect to dashboard
            router.push("/dashboard");
          }
        } catch (err) {
          // If token validation fails and not on login page, redirect to login
          if (pathname !== "/") {
            router.push("/");
          }
        } finally {
          setIsLoading(false);
        }
      };

      validateToken();
    }, [router, pathname]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };
}
