import axios from "axios";

const clockify = axios.create({
  baseURL: "https://api.clockify.me/api/v1",
  headers: {
    "X-Api-Key": process.env.REACT_APP_CLOCKIFY_SECRET_KEY,
  },
});

const activecollab = axios.create({
  baseURL: `https://app.activecollab.com/${process.env.REACT_APP_ACTIVECOLLAB_CLIENT_ID}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    "X-Angie-AuthApiToken": process.env.REACT_APP_ACTIVECOLLAB_SECRET_KEY,
  },
});

export { clockify, activecollab };
