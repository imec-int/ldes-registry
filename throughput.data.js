/**
 *
 * Downloads the latest benchmark results from benchmarks_data/throughput.json
 * https://raw.githubusercontent.com/imec-int/ldes-registry/main/benchmarks_data/throughput.json
 * @returns {Promise<object[]>} A promise that resolves to a list of benchmark results.
 */
const getLatestBenchmarks = async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/imec-int/ldes-registry/main/benchmarks_data/throughput.json"
  );

  // this parsing should be similar to https://github.com/imec-int/ldes-registry/blob/main/loader.data.js#L13C5-L14C40
  const items = await response.json();
  return items;
};

export default {
  async load() {
    const items = await getLatestBenchmarks();
    return { endpoints: items };
  },
};
