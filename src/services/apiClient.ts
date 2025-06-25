import axios, { AxiosError } from "axios";

// Função para obter o token do localStorage
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

// Função para definir o token no localStorage
const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

const apiClient = axios.create({
  baseURL: "/api",
});

// Interceptor para adicionar o token de autenticação em cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag para evitar múltiplas chamadas de refresh simultâneas
let isRefreshing = false;
// Fila de chamadas que falharam e estão esperando o novo token
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para lidar com a renovação de token
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (import("axios").AxiosRequestConfig & { _retry?: boolean });

    // Se o erro não for 401 ou não houver config, rejeita
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // IGNORAR O INTERCEPTOR PARA A ROTA DE LOGIN
    // Se o erro 401 veio da tentativa de login, é um erro de "credenciais inválidas"
    // e deve ser tratado pelo formulário, não pelo refresh de token.
    if (originalRequest.url === '/auth/login') {
      return Promise.reject(error);
    }

    // Evita loop infinito se a rota de refresh também falhar com 401
    if (originalRequest.url === '/auth/refresh') {
        // Futuramente, chamar a função de logout aqui
        console.error("Refresh token is invalid. Logging out.");
        window.location.href = '/login'; // Redirecionamento simples
        return Promise.reject(error);
    }

    if (isRefreshing) {
      // Se já está renovando, adiciona a requisição na fila de espera
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(token => {
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
        }
        return apiClient(originalRequest);
      })
      .catch(err => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post('/api/auth/refresh');
      const newAccessToken = data.accessToken;
      setToken(newAccessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      }
      
      processQueue(null, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      const error = refreshError instanceof Error ? refreshError : new Error('An unknown error occurred');
      processQueue(error, null);
      // Futuramente, chamar a função de logout aqui
      console.error("Could not refresh token. Logging out.");
      window.location.href = '/login'; // Redirecionamento simples
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient; 