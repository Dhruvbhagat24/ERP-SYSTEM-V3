import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const authService = {
    login: async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { username, password });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Login failed');
        }
    },

    signup: async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/signup`, userData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Signup failed');
        }
    }
};

export default authService;