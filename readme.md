# Start.GG to CSV

Stupid script to ingest start.gg data and make a csv useable by a publisher program.

You need to create `config.json` and have the following to make this work
```json
{
    "API_KEY": "<Start.gg API Key>"
}
```

## To Run

This is written for [deno](https://github.com/denoland/deno), so install that first, to run you can do the following

```console
deno run --allow-net --allow-read --allow-write main.ts
```