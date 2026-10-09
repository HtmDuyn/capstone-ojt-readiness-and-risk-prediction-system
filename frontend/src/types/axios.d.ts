declare module 'axios' {
  export type AxiosError<T = unknown> = Error & {
    response?: {
      status?: number;
      data?: T;
    };
    status?: number;
    data?: T;
  };

  export type AxiosResponse<T = any> = {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: InternalAxiosRequestConfig;
  };

  export type InternalAxiosRequestConfig = {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, string>;
    data?: any;
    params?: any;
    timeout?: number;
    [key: string]: any;
  };

  export interface AxiosInstance {
    defaults: {
      headers?: Record<string, string>;
    };
    interceptors: {
      request: {
        use: (
          onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
          onRejected?: (error: AxiosError) => any
        ) => void;
      };
      response: {
        use: (
          onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
          onRejected?: (error: AxiosError) => any
        ) => void;
      };
    };
    get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>>;
    [key: string]: any;
  }

  const axios: AxiosInstance & {
    create(config?: any): AxiosInstance;
  };

  export default axios;
}
