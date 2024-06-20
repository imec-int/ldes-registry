The LDES Registry is a static page showing the current status of known LDES endpoints.

## Development & Deployment setup

This website is built using [VitePress](https://vitepress.dev/). Please consult the VitePress documentation for more information on how to develop and deploy the website.

The current mode of deployment uses GitHub Pages as [described here](https://vitepress.dev/guide/deploy#github-pages).

## Data loaders

The list of endpoints and their statuses are rendered as part of the `dashboard.md` main page.

The registry page uses [build-time data loading](https://vitepress.dev/guide/data-loading) to fetch information and collect benchmark data for visualization for every endpoint.

Data loaders are defined as separate javascript files, each ending with `.data.js`. The data loader provides a default export of an object with the load() method.

```javascript
// example.data.js
export default {
  load() {
    return { endpoints: [] };
  },
};
```

The objects returned by the data loaders are then used in page templates to visualize the results.

```javascript
<script setup>
import { data as uptimeData } from './uptime.data.js'
const endpoints = uptimeData.endpoints
</script>

<div v-for="endpoint of endpoints">
    ...
</div>
```

For more information, please refer to the [VitePress documentation](https://vitepress.dev/guide/data-loading).

### Uptime

The uptime data loader, defined in `uptime.data.js` aims to collect the status of each endpoint. The status is determined by the HTTP response code. The status is then used to render the endpoint status on the dashboard.

Endpoint availability is checked by making a GET request to the server (fetch) and expecting a successfull request (200). If the request fails, the endpoint is marked as "offline".

This data loader does not check the content of the response or the validity of the LDES stream.

### Metadata

The metadata loader, defined in `metadata.data.js` aims to collect semantic information for the LDES stream behind each endpoint. It does so by using the [JavaScript ldes-client library](https://github.com/rdf-connect/ldes-client) to retrieve shape information from the LDES endpoint and render it as a [MermaidJs](https://mermaid.js.org/) graph.

### Throughput

The throughput data loader, defined in `throughput.data.js` aims to collect throughput information for each endpoint. Since benchmarking requires dedicated hardware, this data loader DOES NOT execute the actual benchmarks. Instead, it looks to load benchmark results from the `benchmarks_data` directory. See the section on running benchmarks for more information on how to execute a new benchmark run.

## Running benchmarks

Benchmarks are designed to be executed separately, optionally on a dedicated hardware. To do so, use your favourite runner. For example, to run the throughput benchmark using [Bun](https://bun.sh):

```bash
npm i
bun benchmarks.js
```

Results of the benchmark are to be written to the corresponding file in the `benchmarks_data` directory. Please note, the structure of these output files is predefined and used by the dashboard when rendering pages for visualization. You can examine `throughput.data.js` and its use in `dashboard.md` for the expected shape.

The `benchmark_throughput.js` measurement consists of partially replicating a stream of LDES data and measuring the time it takes to process the stream. For each endpoint, we replicate as many members as possible within 10 seconds. The throughput is calculated as the number of quads or members processed per second.

The benchmark also supports a mode of running based on number of members, instead of time. This can be useful for endpoints that are slow to process data but are known to contain at least a minbimum number of members.

## Registering a new endpoint

Endpoints are provided a static list of URLs in the `urls.txt` file. To have a new endpoint added, simply open a PR appending the URL to the list (one URL per line). The algorithm handles duplicates but for clarity, please do your best to avoid adding the same URL twice.

You can optionally provide a description using a comma for each endpoint in the following format:

```
https://example.com/endpoint1,Endpoint description
```

If no description is provided, the URL will be used as the description.

For convienience, data loaders can use the provided `urlSource` module e.g.:

```javascript
import { getEndpointUrls } from "./urlSource";
const urls = await getEndpointUrls();
```
