// @ts-check
const { intoConfig, replicateLDES, Client } = require("ldes-client");
const fs = require("fs");

/**
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
 * @returns {Client} An instance of a client capable of replicating the LDES.
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
 * The login for obtaining members is based on https://github.com/pietercolpaert/ldes-benchmark/tree/main/throughput
 * @param {string} url - The LDES endpoint to replicate
 * @param {number} timeoutMs - Optionally, maximum duration to replicate.
 * @returns {Promise<Object>} - Returns an object including the `url`, `quads`, `members` and `durationSec`
 */
const replicateStrem = (url, timeoutMs) => {
  return new Promise(async (res) => {
    console.log("Replicating stream from", url);
    let timeout = false;

    if (timeoutMs) {
      setTimeout(() => {
        timeout = true;
      }, timeoutMs);
    }

    try {
      const client = createClient(url);
      client.on("error", () => res(null));

      // requeset current high-resolution time for benchmarking
      const start = process.hrtime.bigint();

      const stream = client.stream({ highWaterMark: 10 });
      const reader = stream.getReader();

      let el = await reader.read();
      let quads = 0;
      let members = 0;
      while (el) {
        if (el.value) {
          quads += el.value.quads.length;
          members += 1;
        }

        el = await reader.read();
        if (timeout) {
          await reader.cancel();
          break;
        }
      }

      // requeset current high-resolution time for benchmarking
      const end = process.hrtime.bigint();

      res({
        url,
        quads,
        members,
        durationSec: Number(end - start) / 1e6 / 1000,
      });
    } catch (error) {
      console.log(error);
      res(null);
    }
  });
};

const writeResults = (items, filename) => {
  const data = JSON.stringify(items, null, 2);

  // Write data to file
  fs.writeFile(filename, data, (err) => {
    if (err) {
      console.error("Error writing file", err);
    } else {
      console.log(`Successfully wrote file at ${filename}`);
    }
  });
};

export default {
  async run() {
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
        // warmpup, and if it fails, let it fail
        const result = (await replicateStrem(url, 10000)) &&
          (await replicateStrem(url, 10000));
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
        console.log(
          items[ix].url,
          "Quads/second",
          items[ix].throughputQuands,
          "Members/Second",
          items[ix].throughputMembers,
          "Duration",
          result.durationSec,
        );
      } catch (error) {
        items[ix].status = "offline";
        items[ix].error = `${error.cause} ${error.message}`;
      }
    }

    writeResults(items, "./benchmarks_data/throughput.json");
  },
};
