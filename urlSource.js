// @ts-check

/**
 * Downloads the list of LDES streams endpoints.
 * @returns {Promise<Array<{url: string, title: string}>>} The array of endpoint URLs with their titles.
 */
export const getEndpointUrls = async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/imec-int/ldes-registry/main/urls.txt"
  );

  const data = await response.text();
  return data
    .split("\n")
    .filter((url) => url.length > 0)
    .map((urlWithTitle) => {
      const parts = urlWithTitle.split(",");
      // title fallback is the url itself
      let item = { url: parts[0], title: parts[1] || parts[0] };
      // trim and replace all " with empty string
      item.url = item.url.trim().replace(/"/g, "");
      return item;
    });
};
