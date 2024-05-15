const { intoConfig, replicateLDES } = require("ldes-client");
import { deflate, inflate } from "pako";
import { toUint8Array, fromUint8Array, toBase64, fromBase64 } from "js-base64";
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

const convertMermaidToState = (state) => {
  const editorState = {
    code: state,
    mermaid: { theme: "default" },
    autoSync: true,
    updateDiagram: true,
    panZoom: false,
    editorMode: "code",
  };
  const json = JSON.stringify(editorState);
  const data = new TextEncoder().encode(json);
  const compressed = deflate(data, { level: 9 });
  return fromUint8Array(compressed, true);
};

/**
 * Calculates a link to the Mermaid preview of the LDES shapes at the given URL.
 */
const retrieveMermaidPreviewLink = async (url) => {
  console.log("Calculating mermaid shape preview", url);
  try {
    const client = createClient(url);

    let mermaidUrl = null;
    client.on("description", (info) => {
      if (info.extractor.shapesGraph) {
        try {
          const mermaidMarkup = info.extractor.shapesGraph.toMermaid(
            info.shape
          );
          const state = convertMermaidToState(mermaidMarkup);
          mermaidUrl = `https://mermaid.live/view#pako:${state}`;
        } catch (ex) {
          console.log("Failed to extract mermaid");
        }
      } else {
        console.log("No mermaid extracted");
      }
    });

    const reader = client.stream({ highWaterMark: 10 }).getReader();

    let el = await reader.read();
    let members = 0;
    const maxMembers = 1;
    while (el) {
      if (el.value) {
        members += 1;
      }

      if (el.done || (maxMembers && members >= maxMembers)) {
        await reader.cancel();
        break;
      }

      el = await reader.read();
    }

    return {
      url,
      mermaidUrl,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default {
  async load() {
    const endpoints = await getEndpointUrls();
    // create objects with information we need for the dashboard
    const items = endpoints.map((endpoint) => {
      return {
        url: endpoint.url,
        title: endpoint.title,
        status: "unknown",
        error: null,
        mermaidUrl: null,
      };
    });

    for (let ix = 0; ix < items.length; ix++) {
      const url = items[ix].url;
      try {
        const result = await retrieveMermaidPreviewLink(url);
        if (!result) {
          items[ix].status = "offline";
          items[ix].error = "Failed to replicate stream.";
          continue;
        }
        const item = items[ix];
        items[ix] = {
          ...item,
          ...result,
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
