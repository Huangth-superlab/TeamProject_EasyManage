// 统一的 API 调用配置
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 包含cookie
  });
};
