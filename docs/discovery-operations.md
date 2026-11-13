# Search and AI discovery operations

## Weekly report

The web process writes one privacy-minimised JSON line for recognised AI
crawlers and referrals. It records the source, locale, path and HTTP status; it
does not record an IP address, query string, cookie or full referrer URL.

```sh
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs web --since 168h \
  | sed -n 's/^[^{]*\({.*"message":"discovery visit".*}\)$/\1/p' \
  | jq -s 'group_by([.sourceType,.source,.path,.locale,.status]) | map({sourceType:.[0].sourceType,source:.[0].source,path:.[0].path,locale:.[0].locale,status:.[0].status,visits:length}) | sort_by(-.visits)'
```

Review non-200 responses first, then compare the most crawled entity pages with
Search Console and Bing Webmaster Tools impressions.

## Launch checklist

1. Verify `exploreblackwhale.com` in Google Search Console and Bing Webmaster
   Tools using DNS ownership.
2. Submit `https://exploreblackwhale.com/sitemap.xml` to both services.
3. Confirm that `/robots.txt`, `/llms.txt`, the sitemap, one ability page and one
   event page return 200 to GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot.
4. Configure the public IndexNow key, deploy it, and submit only URLs whose
   catalogue `modifiedAt` changed.
5. Record baselines on launch day, then repeat at 30, 60 and 90 days: discovered
   and indexed URLs, impressions, queries, crawler visits, AI referrals and
   third-party mentions.

## Community outreach

Publish one useful artefact at a time and adapt the message to each community:

- **Reddit:** invite corrections on one sourced dossier or chronology finding;
  disclose that Ginks maintains the site.
- **Fan forums:** explain the evidence or reconstruction method and link the
  exact source register, not only the homepage.
- **Discord:** share a concise visual or question with the directly relevant
  entity URL; do not repeat the same post across channels.
- **Wikis:** propose factual corrections with chapter citations. Add a Black
  Whale link only where editors consider the archive a useful external source.

Do not exchange links, automate submissions or imply endorsement by a
community. Ranking and model citations are observations, never guarantees.
