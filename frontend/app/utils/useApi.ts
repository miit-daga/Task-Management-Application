import axios from 'axios';
import { useRouter } from 'next/navigation';

const useApi = () => {
    const router = useRouter();

    // Create an Axios instance with a base URL and credentials enabled
    // This instance will be used for all API calls made with this hook
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
        withCredentials: true,
    });

    // Interceptor for handling responses globally
    // If a 401 Unauthorized error is received, redirect the user to the login page
    api.interceptors.response.use(
        response => response,
        error => {
            // Check if the error response has a status of 401
            // If so, redirect to the login page
            if (error.response && error.response.status === 401) {
                
                router.push('/login');
            }
            return Promise.reject(error);
        }
    );
    // Return the configured Axios instance for use in API calls
    return api;
};

export default useApi;
