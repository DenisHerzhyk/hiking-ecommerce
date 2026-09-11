import axios from "axios";

const ORS_URL =
  "https://api.openrouteservice.org/v2/directions/foot-hiking/geojson";

const REQUEST_TIMEOUT_MS = 20000;
const RETRY_DELAYS_MS = [1000, 3000];
const RETRYABLE_STATUSES = [429, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestRoute = async (coordinates, attempt = 0) => {
  try {
    const response = await axios.post(
      ORS_URL,
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const timedOut = err.code === "ECONNABORTED";
    const retryable = timedOut || RETRYABLE_STATUSES.includes(status);

    if (retryable && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      return requestRoute(coordinates, attempt + 1);
    }
    throw err;
  }
};

export const orsHikingRoute = async (req, res) => {
  const { coordinates } = req.body;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return res.status(400).json({ message: "Two coordinates are required" });
  }

  try {
    const data = await requestRoute(coordinates);
    return res.json(data);
  } catch (err) {
    const status =
      err.response?.status ?? (err.code === "ECONNABORTED" ? 504 : 502);

    console.log("ORS error:", status, err.code ?? "");

    return res
      .status(status)
      .json({ message: "Failed to fetch hiking route", status });
  }
};
