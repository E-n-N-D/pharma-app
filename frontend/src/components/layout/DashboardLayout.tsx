"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Stock", path: "/stock" },
    { label: "Billing", path: "/billing" },
  ];

  const handleLogout = () => {
    const api = APIServiceManager.getInstance();
    api.logout();
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>PharmaApp</h1>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default DashboardLayout;
