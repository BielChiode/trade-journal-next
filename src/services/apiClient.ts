import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // O proxy no package.json cuidará do resto em desenvolvimento
});

// Interceptor para adicionar o token de autenticação em cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient; 