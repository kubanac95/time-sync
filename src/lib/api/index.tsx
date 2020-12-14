import axios from "axios";

const clockify = axios.create({
  baseURL: "https://api.clockify.me/api/v1",
  headers: {
    "X-Api-Key": process.env.REACT_APP_CLOCKIFY_SECRET_KEY,
  },
});

const activecollab = axios.create({
  baseURL: `https://app.activecollab.com/119944/api/v1`,
  headers: {
    "Content-Type": "application/json",
    "X-Angie-AuthApiToken": "40-jZwg3WRbsVBNkJFnHIdLLp6KCQ1N5aroJ1gG9zdC",
  },
});

export { clockify, activecollab };
