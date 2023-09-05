import axios from "axios";

export const postToken = (credential: string) => {
  return axios.post("/auth/token", {
    type: "GOOGLE",
    credential,
  });
};

export const postRefresh = (refreshToken: string) => {
  return axios.post("/auth/refresh", {
    refreshToken,
  });
};
