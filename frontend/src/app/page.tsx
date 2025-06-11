"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "./login.module.css";
import { withAuth } from "@/components/auth/withAuth";
import Image from "next/image";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const api = APIServiceManager.getInstance();
      const response = await api.login(username, password);

      if (response.success) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageSection} />
      <div className={styles.formSection}>
        <div className={styles.collab}>
          <Image src="/ku_logo.png" alt="collab" width={100} height={100} />
          <div className={styles.collabItem}>
            Developed by <span className={styles.aic}>AIC-KU</span> in collaboration with <span className={styles.hariharpurgadhi}>Hariharpurgadhi Rural Municipality</span>
          </div>
          <Image src="/hariharpurgadhi.jpg" alt="collab" width={100} height={100} />
        </div>
        <div className={styles.loginBox}>
          <h1>PharmaApp</h1>
          <h2>Login</h2>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withAuth(LoginPage);
