import { intoConfig, replicateLDES } from "ldes-client";
import { deflate } from "pako";
import { fromUint8Array } from "js-base64";
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
  console.log("---------------------------------------------------------");
  console.log("Calculating mermaid shape preview", url);

  let mermaidUrl = null;
  let gotDescription = false;
  let warning = undefined;
  try {
    const client = createClient(url);

    client.on("description", (info) => {
      gotDescription = true;
      const shapesGraph = info.extractor.shapesGraph;
      if (shapesGraph &&
        (shapesGraph.shapes.namedNodes.size > 0 || shapesGraph.shapes.blankNodes.size > 0)) {
        try {
          const mermaidMarkup = info.extractor.shapesGraph.toMermaid(
            info.shape
          );
          const state = convertMermaidToState(mermaidMarkup);
          mermaidUrl = `https://mermaid.live/view#pako:${state}`;
        } catch (ex) {
          warning = `Failed to convert shapes to mermaid. Reason: \n${ex.message} ${ex.cause}`;
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
      warning,
    };
  } catch (error) {
    if (gotDescription) {
      return {
        url,
        mermaidUrl,
        warning: `LDES is online but an issue was encountered while traversing it: \n${error.message} ${error.cause}`,
      };
    } else {
      return {
        url,
        error: `Failed to fetch LDES feed. Reason: \n${error.message} ${error.cause}`,
      }
    }
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
        warning: null,
        mermaidUrl: null,
      };
    });

    for (let ix = 0; ix < items.length; ix++) {
      const url = items[ix].url;
      const result = await retrieveMermaidPreviewLink(url);
      console.log(`result for ${url}`, result);
      if (result.error) {
        items[ix].status = "offline";
        items[ix].error = result.error;
        continue;
      } else if (result.warning) {
        const item = items[ix];
        items[ix] = {
          ...item,
          ...result,
          status: "warning",
        };
        continue;
      }
      const item = items[ix];
      items[ix] = {
        ...item,
        ...result,
        status: "online",
      };
    }

    return { endpoints: items };
  },
};
