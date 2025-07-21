// apiConfig.js
import { createContext, useContext } from "react";

export const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';
export const ApiContext = createContext(API_BASE_URL);
export const useApi = () => useContext(ApiContext);
