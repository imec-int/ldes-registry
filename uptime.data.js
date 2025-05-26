import { getEndpointUrls } from "./urlSource";

export default {
  async load() {
    const endpoints = await getEndpointUrls();
    const items = endpoints.map((endpoint) => {
      return {
        url: endpoint.url,
        title: endpoint.title,
        status: "unknown",
        error: null,
      };
    });

    // check if the endpoints are online
    // if the endpoint is online, set the status to "online", otherwise set it to "offline"

    for (let ix = 0; ix < items.length; ix++) {
      const url = items[ix].url;
      try {
        const response = await fetch(url, { method: "GET" });
        if (response.ok) {
          items[ix].status = "online";
        } else {
          items[ix].status = "offline";
          items[ix].error = `${response.status} ${response.statusText}`;
        }
      } catch (error) {
        items[ix].status = "offline";
        items[ix].error = `${error.cause} ${error.message}`;
      }
    }

    const moment = Date();
    return { endpoints: items, moment };
  },
};
