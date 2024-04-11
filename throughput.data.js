process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const { intoConfig, replicateLDES } = require("ldes-client");

/**
 *
 * Downloads the list of LDES streams to be tested from
 * https://raw.githubusercontent.com/imec-int/ldes-registry/main/urls.txt
 * @returns {Promise<string[]>} A promise that resolves to a deduplicated array of endpoint URLs.
 */
const getEndpointUrls = async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/imec-int/ldes-registry/main/urls.txt",
  );

  // this parsing should be similar to https://github.com/imec-int/ldes-registry/blob/main/loader.data.js#L13C5-L14C40
  const data = await response.text();
  const allUrls = data.split("\n").filter((url) => url.length > 0);
  const urls = [...new Set(allUrls)];

  return urls;
};

/**
 * Creates a LDES client instance for the given URL
 * @param {string} url - URL to the root of an LDES.
 * @returns {Object} An instance of a client capable of replicating the LDES.
 */
const createClient = (url) => {
  const client = replicateLDES(
    intoConfig({
      url,
      onlyDefaultGraph: true,
    }),
  );
  return client;
};

/**
 * Measures the time needed to replicate a stream of data from a given URL.
 * @param {string} url - The LDES endpoint to replicate
 * @param {number} maxMembers - Optionally, the maximum number of members to replicate.
 * @returns {Promise<Object>} - Returns an object including the `url`, `quads`, `members` and `durationSec`
 */
const replicateStrem = async (url, maxMembers) => {
  console.log("Replicating stream from", url);
  try {
    const client = createClient(url);

    // requeset current high-resolution time for benchmarking
    const start = process.hrtime.bigint();

    const reader = client.stream({ highWaterMark: 10 }).getReader();
    let el = await reader.read();
    let quads = 0;
    let members = 0;
    while (el) {
      if (el.value) {
        quads += el.value.quads.length;
        members += 1;
      }

      if (el.done || (maxMembers && members >= maxMembers)) {
        await reader.cancel();
        break;
      }

      el = await reader.read();
    }

    // requeset current high-resolution time for benchmarking
    const end = process.hrtime.bigint();

    return {
      url,
      quads,
      members,
      durationSec: Number(end - start) / 1e6 / 1000,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default {
  async load() {
    const urls = await getEndpointUrls();
    // create objects with information we need for the dashboard
    const items = urls.map((url) => {
      return {
        url,
        status: "unknown",
        error: null,
        quads: 0,
        members: 0,
        durationSec: 0,
        throughputQuands: 0,
        throughputMembers: 0,
      };
    });

    for (let ix = 0; ix < items.length; ix++) {
      const url = items[ix].url;
      try {
        const result = await replicateStrem(url, 30);
        if (!result) {
          items[ix].status = "offline";
          items[ix].error = "Failed to replicate stream.";
          continue;
        }
        const item = items[ix];
        items[ix] = {
          ...item,
          ...result,
          throughputQuands: Number(
            (result.quads / result.durationSec).toFixed(1),
          ),
          throughputMembers: Number(
            (result.members / result.durationSec).toFixed(1),
          ),
          status: "online",
        };
      } catch (error) {
        items[ix].status = "offline";
        items[ix].error = `${error.cause} ${error.message}`;
      }
    }

    return { endpoints: items };
  },
};
