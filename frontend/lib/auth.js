export const getStoredToken =
  () => {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    return localStorage.getItem(
      "accessToken"
    );
  };

export const setStoredToken =
  (token) => {
    localStorage.setItem(
      "accessToken",
      token
    );
  };

export const removeStoredToken =
  () => {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "currentUser"
    );
  };

export const getStoredUser =
  () => {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    const value =
      localStorage.getItem(
        "currentUser"
      );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

export const setStoredUser =
  (user) => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );
  };