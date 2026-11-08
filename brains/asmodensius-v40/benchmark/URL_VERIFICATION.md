# Benchmark citation URLs (verified 2026-10-29, Asia/Manila)
All 150 rows in projects.tsv have a url column, and each URL was checked by an HTTP fetch this round. curl is blocked in the sandbox.
- arXiv (25): all resolve in the arXiv API, with titles matching.
- DOI: checked with a Crossref batch title match. Five wrong DOIs were replaced: Evoloops, Geb, Ono-Ikegami, Breve and Swarm-bots. GReaNs and Ludobots (Bongard 2013 CACM) now use DOIs.
- Wikipedia: all exist. Missing titles were replaced: Darwinbots now points to the Darwinbots wiki, Echo to John Henry Holland, and Creatures DS to Creatures (video game series).
- Project pages were fetched individually. avida-ed.msu.edu returned a 504 and has moved to avida-ed.github.io. reddit r/ludobots blocks fetches, so it was replaced with a DOI.
url_sources.tsv records the source type for each row.
