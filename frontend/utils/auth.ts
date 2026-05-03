export const getValidToken = () => {
  if (typeof window === 'undefined') return null;

  const auth = localStorage.getItem("auth");

  if (!auth) return null;

  try {
    const parsed = JSON.parse(auth);

    const now = new Date().getTime();

    if (now > parsed.expiry) {
      localStorage.removeItem("auth"); // 🔥 auto delete
      return null;
    }

    return parsed.token;
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
};