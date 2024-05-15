# About

Endpoint availability is checked by making a GET request to the server and expecting a successfull request (200). If the request fails, the endpoint is marked as "offline".

Throughput is measured by replaying a stream of LDES data and measuring the time it takes to process the stream. For each endpoint, we replicate as many members as possible within 10 seconds. The throughput is calculated as the number of quads or members processed per second.

## Adding a new endpoint

Add known LDES endpoints to `urls.txt`, one per line with the correct protocol (e.g. https://). On each line, provide the endpoint url followed by the title (description of the endpoint) separated by a comma e.g.

```
https://example.com/endpoint1,Endpoint 1
```

## Resources

- Catalog of known streams can be found at: https://www.vlaanderen.be/datavindplaats/catalogus?text.LIKE=ldes&order_relevance=asc
- For telraam: https://telraam.net/#9/51.0470/3.7206, cannot identify where the LDES is located, and if it is public.
