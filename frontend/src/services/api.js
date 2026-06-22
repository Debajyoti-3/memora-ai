import axios from "axios";

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://memora-ai-9i3n.onrender.com/api/v1",
  withCredentials: true, // Enable automatically passing cookies for cross-origin credentials
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth Services
export const authAPI = {
  signup: async (fullName, email, password) => {
    const response = await api.post("/auth/signup", { fullName, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

// Message & Conversation Services
export const messageAPI = {
  createConversation: async () => {
    const response = await api.post("/message/create-conversation");
    return response.data;
  },
  getConversations: async () => {
    const response = await api.get("/message/get-conversations");
    return response.data;
  },
  getMessages: async (conversationId) => {
    const response = await api.get(`/message/get-message/${conversationId}`);
    return response.data;
  },
  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/message/send-message/${conversationId}`, { content });
    return response.data;
  },
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/message/delete-conversation/${conversationId}`);
    return response.data;
  },
};

export default api;
