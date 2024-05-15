## Adding a new endpoint

Endpoints are provided a static list of URLs in the `urls.txt` file. To have a new endpoint added, simply open a PR appending the URL to the list (one URL per line). The algorithm handles duplicates byt for clarity, please do your best to avoid adding the same URL twice.

You can optionally provide a description using a comma for each endpoint in the following format:

```
https://example.com/endpoint1,Endpoint description
```

## Running benchmarks

Benchmarks are designed to be executed separately. To do so, use your favourite runner. For example, to run the throughput benchmark using [Bun](https://bun.sh):

```bash
bun benchmarks.js
```

Results of the benchmark will br written to the corresponding file in the `benchmarks_data` directory. Please note, the structure of these output files is predefined and used by the dashboard when rendering pages for visualization.
