/// URL to a file containing a list of LDES endpoints, one per line
const listUrl =
  "https://raw.githubusercontent.com/imec-int/ldes-registry/main/urls.txt";

export default {
  async load() {
    // load the list of URLs as a string
    const listResponse = await fetch(listUrl);
    const listStr = await listResponse.text();

    // split the string into an array of URLs
    // remove duplicates
    const allUrls = listStr.split("\n").filter((url) => url.length > 0);
    const urls = [...new Set(allUrls)];

    // create objects with information we need for the dashboard
    const items = urls.map((url) => {
      return {
        url,
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

    return { endpoints: items };
  },
};
