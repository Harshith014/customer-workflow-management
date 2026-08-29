const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "accessToken"
  );
};

const request = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message:
        "Invalid server response",
    };
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        "Something went wrong"
    );

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
};

export const api = {
  get: (endpoint) =>
    request(endpoint),

  post: (
    endpoint,
    body
  ) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: (
    endpoint,
    body
  ) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  put: (
    endpoint,
    body
  ) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};

export default api;