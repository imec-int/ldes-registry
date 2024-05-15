// @ts-check
const { intoConfig, replicateLDES } = require("ldes-client");
const fs = require("fs");
import { getEndpointUrls } from "./urlSource.js";

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
    })
  );
  return client;
};

/**
 * Measures the time needed to replicate a stream of data from a given URL.
 * The login for obtaining members is based on https://github.com/pietercolpaert/ldes-benchmark/tree/main/throughput
 * @param {string} url - The LDES endpoint to replicate
 * @param {number} maxMembers - The maximum number of members to replicate, set to 0 to replicate all members.
 * @param {number} maxDurationSeconds - Optionally, the maximum amount of time in seconds to consume members from the stream.
 * @returns {Promise<Object>} - Returns an object including the `url`, `quads`, `members` and `durationSec`
 */
const replicateStrem = async (url, maxMembers, maxDurationSeconds) => {
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

      // abort if we've reached the end of the stream or the maximum number of members
      if (el.done || (maxMembers && members >= maxMembers)) {
        console.info("reached end of stream or maximum number of members");
        await reader.cancel();
        break;
      }

      // abort if we've reached the maximum duration
      if (
        maxDurationSeconds &&
        Number(process.hrtime.bigint() - start) / 1e6 / 1000 >
          maxDurationSeconds
      ) {
        console.info("reached maximum duration");
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
    const endpoints = await getEndpointUrls();
    // create objects with information we need for the dashboard
    const items = endpoints.map((endpoint) => {
      return {
        url: endpoint.url,
        title: endpoint.title,
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
        // wakeup the endpoint
        const response = await fetch(url, { method: "GET" });
        if (response.ok) {
          // benchmark the stream for 10 seconds, to give servers the chance to cache the results
          await replicateStrem(url, 0, 10);
          // benchmark the stream for 10 seconds to get the actual results
          const result = await replicateStrem(url, 0, 10);
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
              (result.quads / result.durationSec).toFixed(1)
            ),
            throughputMembers: Number(
              (result.members / result.durationSec).toFixed(1)
            ),
            status: "online",
          };
        } else {
          items[ix].status = "offline";
          items[ix].error = `${response.status} ${response.statusText}`;
        }
      } catch (error) {
        items[ix].status = "offline";
        items[ix].error = `${error.cause} ${error.message}`;
      }
    }

    writeResults(items, "./benchmarks_data/throughput.json");
  },
};
