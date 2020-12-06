import axios from "axios";

const clockify = axios.create({
  baseURL: "https://api.clockify.me/api/v1",
  headers: {
    "X-Api-Key": process.env.REACT_APP_CLOCKIFY_SECRET_KEY,
  },
});

export { clockify };
