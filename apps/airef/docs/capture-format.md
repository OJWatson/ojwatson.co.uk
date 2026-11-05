# AIRef capture interchange format

The website's JSON import accepts this UTF-8 format. It enters the same editable review step as a share-link capture. Importing a file never publishes it. The archive assigns its UUID, permanent URL, UTC archive time and final JSON hash only after publication.

```json
{
  "schema_version": "1.0",
  "source_url": "https://claude.ai/share/553259d6-1b95-4a7c-85c4-846bc242a453",
  "provider": "claude",
  "title": "Example conversation",
  "captured_at": null,
  "capture_method": "json_import",
  "importer_version": "example-exporter/0.1.0",
  "completeness": "unknown",
  "omissions": ["Completeness has not been independently verified."],
  "messages": [
    { "role": "user", "content": "Example prompt", "timestamp": null, "model": null },
    { "role": "assistant", "content": "Example response", "timestamp": null, "model": null }
  ]
}
```

`provider` is `chatgpt` or `claude` and must match a valid public share URL. `messages` is an ordered array with at least one nonempty message. Markdown, including fenced code, is stored literally in `content`. `timestamp`, `model` and `captured_at` must remain `null` when unknown; an exporter must not guess them. Dates, when known, use ISO 8601 with a timezone. The final archival JSON is limited to 1 MiB, including metadata.

`completeness` is `shared_snapshot`, `partial`, or `unknown`. Use `partial` for known missing material and describe it in `omissions`. Use `unknown` when completeness cannot be established. Neither an imported file nor a hash proves that the transcript matches the provider's original. The website requires explicit acknowledgement of unknown or partial capture before publication.

A future ChatGPT plugin can target this format without changing the storage or reference workflow. If a model assembles the transcript from its available context, it must use `capture_method: "json_import"`, an identifiable `importer_version`, `completeness: "unknown"`, and an omission note stating that this is a model-assisted export whose verbatim accuracy and completeness need user review. It must not reconstruct unavailable earlier turns, hidden reasoning, attachment contents, exact model identifiers or message timestamps. A faithful full-chat export requires direct transcript access; ordinary plugin tool arguments alone do not establish that access.

The importer strips external server receipts and treats imported provenance as submitter-declared. The authoritative runtime validation is in `src/shared.ts`; see `CaptureSchema` and `importJson`.
