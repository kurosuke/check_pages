// Supabase Edge Function: check-runner
// Periodic URL change detection for serialized content monitoring
// Supports HTML scraping, RSS feeds, and Narou API
// Designed for Supabase hosted Edge Functions (service version)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables are auto-injected by Supabase service
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MAX_BATCH = 50;
const TIMEOUT_MS = 12_000;

type DueUrl = {
  id: string;
  project_id: string;
  url: string;
  latest_item_id: string | null;
  latest_item_published_at: string | null;
};

type CheckStatus = "ok" | "changed" | "error";

type FeedType = "narou-api" | "rss" | "html";

type FeedInfo = {
  type: FeedType;
  feedUrl: string;
  ncode?: string;
};

type RssItem = {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
};

/**
 * Detect URL type and return feed info
 */
function detectFeedType(url: string): FeedInfo {
  // なろう小説 (syosetu.com) - use API
  const narouMatch = url.match(/^https?:\/\/ncode\.syosetu\.com\/([^\/]+)\/?$/i);
  if (narouMatch) {
    const ncode = narouMatch[1].toLowerCase();
    return {
      type: "narou-api",
      feedUrl: `https://api.syosetu.com/novelapi/api/?out=json&ncode=${ncode}`,
      ncode,
    };
  }
  
  // カクヨム (kakuyomu.jp) - use RSSHub feed for episode updates
  const kakuyomuMatch = url.match(/^https?:\/\/kakuyomu\.jp\/works\/(\d+)\/?$/i);
  if (kakuyomuMatch) {
    return {
      type: "rss",
      // Official site does not expose an RSS endpoint; RSSHub provides a compatible feed.
      feedUrl: `https://rsshub.app/kakuyomu/episode/${kakuyomuMatch[1]}`,
    };
  }
  
  // Already an RSS URL
  if (url.endsWith('/rss') || url.endsWith('/rss/') || url.endsWith('.rss') || url.endsWith('/feed')) {
    return {
      type: "rss",
      feedUrl: url,
    };
  }
  
  // Default to HTML scraping
  return {
    type: "html",
    feedUrl: url,
  };
}

/**
 * Parse RSS/Atom feed and extract latest item
 */
function parseRssFeed(xml: string): RssItem | null {
  // Try RSS 2.0 format first
  const rssItemMatch = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/i);
  if (rssItemMatch) {
    const itemXml = rssItemMatch[1];
    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || "";
    const guid = itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i)?.[1]?.trim();
    const pubDate = itemXml.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i)?.[1]?.trim();
    
    return {
      id: guid || link || title,
      title,
      link,
      pubDate: pubDate || null,
    };
  }
  
  // Try Atom format
  const atomEntryMatch = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/i);
  if (atomEntryMatch) {
    const entryXml = atomEntryMatch[1];
    const title = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const link = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1]?.trim() || "";
    const id = entryXml.match(/<id[^>]*>([\s\S]*?)<\/id>/i)?.[1]?.trim();
    const updated = entryXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]?.trim();
    const published = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]?.trim();
    
    return {
      id: id || link || title,
      title,
      link,
      pubDate: published || updated || null,
    };
  }
  
  return null;
}

/**
 * Fetch candidate URLs from urls table
 */
async function fetchDueUrls(force = false): Promise<DueUrl[]> {
  console.log(`[check-runner] Fetching due URLs... (force=${force})`);
  
  const { data: allUrls, error: allUrlsErr } = await supabase
    .from("urls")
    .select("id, project_id, url, active, last_checked_at, check_interval_minutes, latest_item_id, latest_item_published_at")
    .eq("active", true);
  
  console.log(`[check-runner] Active URLs from table: ${allUrls?.length ?? 0}`);
  if (allUrlsErr) {
    console.error("[check-runner] Error fetching urls:", JSON.stringify(allUrlsErr));
    throw allUrlsErr;
  }
  
  if (force) {
    console.log(`[check-runner] Force mode: returning all ${allUrls?.length ?? 0} active URLs`);
    return (allUrls ?? []).slice(0, MAX_BATCH) as DueUrl[];
  }
  
  const now = new Date();
  const dueUrls = (allUrls ?? []).filter((u: { last_checked_at: string | null; check_interval_minutes: number | null }) => {
    if (!u.last_checked_at) return true;
    const lastChecked = new Date(u.last_checked_at);
    const intervalMs = (u.check_interval_minutes ?? 1440) * 60 * 1000;
    const dueAt = new Date(lastChecked.getTime() + intervalMs);
    return dueAt <= now;
  }).slice(0, MAX_BATCH);
  
  console.log(`[check-runner] Found ${dueUrls.length} due URLs`);
  return dueUrls as DueUrl[];
}

/**
 * Normalize HTML by removing script/style/noscript tags and collapsing whitespace.
 */
function normalizeHtml(html: string): string {
  let result = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  result = result.replace(/<[^>]+>/g, " ");

  result = result
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Compute SHA-256 hash of text and return as hex string.
 */
async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Run check via Narou API
 */
async function runNarouApiCheck(row: DueUrl, feedInfo: FeedInfo): Promise<void> {
  console.log(`[check-runner] Narou API check for: ${row.url}`);
  const startedAt = new Date().toISOString();
  let status: CheckStatus = "ok";
  let httpStatus: number | null = null;
  let responseMs: number | null = null;
  let errorMessage: string | null = null;
  let contentHash: string | null = null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const t0 = performance.now();
    const res = await fetch(feedInfo.feedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const t1 = performance.now();
    httpStatus = res.status;
    responseMs = Math.round(t1 - t0);
    console.log(`[check-runner] Narou API fetch: status=${httpStatus}, time=${responseMs}ms`);

    if (!res.ok) {
      throw new Error(`HTTP ${httpStatus}`);
    }

    const jsonText = await res.text();
    contentHash = await sha256Hex(jsonText);
    
    // Narou API returns array: first element is count, rest are novels
    const data = JSON.parse(jsonText);
    console.log(`[check-runner] Narou API response:`, JSON.stringify(data));
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error("Novel not found in Narou API");
    }
    
    const novel = data[1]; // First novel data
    // general_lastup is the latest update timestamp (YYYY-MM-DD HH:MM:SS format)
    // general_all_no is the total number of episodes
    const latestItemId = `${novel.ncode}-${novel.general_all_no}`;
    const latestUpdate = novel.general_lastup; // "2024-01-15 12:30:00" format
    
    console.log(`[check-runner] Narou novel: ncode=${novel.ncode}, episodes=${novel.general_all_no}, lastup=${latestUpdate}`);

    // Check if there's an update
    if (row.latest_item_id && latestItemId !== row.latest_item_id) {
      status = "changed";
      console.log(`[check-runner] New episode detected! Old: ${row.latest_item_id}, New: ${latestItemId}`);
    }

    // Insert check record
    const { error: insertErr } = await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      content_hash: contentHash,
    });
    if (insertErr) {
      console.error(`[check-runner] Error inserting check:`, JSON.stringify(insertErr));
    }

    // Parse the datetime string (JST format from Narou API)
    let publishedAt: string | null = null;
    if (latestUpdate) {
      // Convert "YYYY-MM-DD HH:MM:SS" to ISO format (assuming JST)
      const [datePart, timePart] = latestUpdate.split(' ');
      publishedAt = `${datePart}T${timePart}+09:00`;
    }

    // Update URL with latest item info
    const { error: updateErr } = await supabase
      .from("urls")
      .update({
        last_checked_at: new Date().toISOString(),
        latest_item_id: latestItemId,
        latest_item_published_at: publishedAt,
      })
      .eq("id", row.id);
    if (updateErr) {
      console.error(`[check-runner] Error updating URL:`, JSON.stringify(updateErr));
    } else {
      console.log(`[check-runner] URL updated: latest_item_id=${latestItemId}`);
    }

  } catch (err: unknown) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[check-runner] Narou API error: ${errorMessage}`);

    await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      error_message: errorMessage,
    });

    await supabase
      .from("urls")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", row.id);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run check via RSS feed
 */
type RssResult = { ok: boolean; fallbackToHtml: boolean };

async function runRssCheck(row: DueUrl, feedInfo: FeedInfo): Promise<RssResult> {
  console.log(`[check-runner] RSS check for: ${row.url} -> ${feedInfo.feedUrl}`);
  const startedAt = new Date().toISOString();
  let status: CheckStatus = "ok";
  let httpStatus: number | null = null;
  let responseMs: number | null = null;
  let errorMessage: string | null = null;
  let contentHash: string | null = null;
  let fetchedFeedUrl: string | null = null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const candidateFeedUrls = (() => {
      if (feedInfo.feedUrl.includes("rsshub.")) {
        const variants = [
          feedInfo.feedUrl,
          feedInfo.feedUrl.replace("rsshub.app", "rsshub.moeyy.cn"),
          feedInfo.feedUrl.replace("rsshub.app", "rsshub.rssforever.com"),
        ];
        // dedupe
        return variants.filter((v, i, arr) => arr.indexOf(v) === i);
      }
      return [feedInfo.feedUrl];
    })();

    let rssXml: string | null = null;
    let lastError: unknown = null;

    for (const candidate of candidateFeedUrls) {
      try {
        const t0 = performance.now();
        const res = await fetch(candidate, {
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        const t1 = performance.now();
        httpStatus = res.status;
        responseMs = Math.round(t1 - t0);
        console.log(`[check-runner] RSS fetch: url=${candidate}, status=${httpStatus}, time=${responseMs}ms`);

        if (!res.ok) {
          throw new Error(`HTTP ${httpStatus}`);
        }

        rssXml = await res.text();
        fetchedFeedUrl = candidate;
        break; // success
      } catch (err) {
        lastError = err;
        console.warn(`[check-runner] RSS fetch failed for ${candidate}: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    if (!rssXml) {
      throw lastError instanceof Error ? lastError : new Error("Failed to fetch RSS feed");
    }

    contentHash = await sha256Hex(rssXml);
    
    const latestItem = parseRssFeed(rssXml);
    console.log(`[check-runner] Latest RSS item:`, JSON.stringify(latestItem));

    if (!latestItem) {
      throw new Error("Failed to parse RSS feed");
    }

    // Check if there's a new item
    if (row.latest_item_id && latestItem.id !== row.latest_item_id) {
      status = "changed";
      console.log(`[check-runner] New item detected! Old: ${row.latest_item_id}, New: ${latestItem.id}`);
    }

    // Insert check record
    const { error: insertErr } = await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      content_hash: contentHash,
    });
    if (insertErr) {
      console.error(`[check-runner] Error inserting check:`, JSON.stringify(insertErr));
    }

    // Update URL with latest item info
    const { error: updateErr } = await supabase
      .from("urls")
      .update({
        last_checked_at: new Date().toISOString(),
        latest_item_id: latestItem.id,
        latest_item_published_at: latestItem.pubDate ? new Date(latestItem.pubDate).toISOString() : null,
      })
      .eq("id", row.id);
    if (updateErr) {
      console.error(`[check-runner] Error updating URL:`, JSON.stringify(updateErr));
    } else {
      console.log(`[check-runner] URL updated with latest item: ${latestItem.id}`);
    }
    return { ok: true, fallbackToHtml: false };

  } catch (err: unknown) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[check-runner] RSS check error: ${errorMessage}`);
    const fallbackToHtml = feedInfo.feedUrl.includes("kakuyomu");

    await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      error_message: errorMessage,
    });

    if (!fallbackToHtml) {
      await supabase
        .from("urls")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      console.log("[check-runner] Kakuyomu RSS failed; will fallback to HTML scraping.");
    }
    return { ok: false, fallbackToHtml };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run check via HTML scraping (original method)
 */
async function runHtmlCheck(row: DueUrl): Promise<void> {
  console.log(`[check-runner] HTML check for: ${row.url}`);
  const startedAt = new Date().toISOString();
  let status: CheckStatus = "ok";
  let httpStatus: number | null = null;
  let responseMs: number | null = null;
  let errorMessage: string | null = null;
  let contentHash: string | null = null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const t0 = performance.now();
    const res = await fetch(row.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
      },
    });
    const t1 = performance.now();
    httpStatus = res.status;
    responseMs = Math.round(t1 - t0);
    console.log(`[check-runner] HTML fetch: status=${httpStatus}, time=${responseMs}ms`);

    const rawHtml = await res.text();
    const normalized = normalizeHtml(rawHtml);
    contentHash = await sha256Hex(normalized);

    // Compare with last check
    const { data: last, error: lastErr } = await supabase
      .from("checks")
      .select("content_hash")
      .eq("url_id", row.id)
      .in("status", ["ok", "changed"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) throw lastErr;

    if (last?.content_hash && last.content_hash !== contentHash) {
      status = "changed";
      console.log(`[check-runner] Content changed!`);
    }

    const { error: insertErr } = await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      content_hash: contentHash,
    });
    if (insertErr) {
      console.error(`[check-runner] Error inserting check:`, JSON.stringify(insertErr));
    }

  } catch (err: unknown) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[check-runner] HTML check error: ${errorMessage}`);

    await supabase.from("checks").insert({
      url_id: row.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      http_status: httpStatus,
      response_ms: responseMs,
      error_message: errorMessage,
    });
  } finally {
    clearTimeout(timer);
    await supabase
      .from("urls")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", row.id);
  }
}

/**
 * Run a single URL check - automatically selects appropriate method
 */
async function runCheck(row: DueUrl): Promise<void> {
  const feedInfo = detectFeedType(row.url);
  console.log(`[check-runner] Detected feed type: ${feedInfo.type} for ${row.url}`);
  
  switch (feedInfo.type) {
    case "narou-api":
      await runNarouApiCheck(row, feedInfo);
      break;
    case "rss":
      {
        const result = await runRssCheck(row, feedInfo);
        if (!result.ok && result.fallbackToHtml) {
          await runHtmlCheck(row);
        }
      }
      break;
    case "html":
    default:
      await runHtmlCheck(row);
      break;
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  const method = req.method;
  if (method !== "POST" && method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";
    const urlId = url.searchParams.get("url_id");
    console.log(`[check-runner] Request: method=${method}, force=${force}`);
    // Single URL override (manual check)
    if (urlId) {
      console.log(`[check-runner] Single URL mode for url_id=${urlId}`);
      const { data: singleUrl, error: singleErr } = await supabase
        .from("urls")
        .select("id, project_id, url, latest_item_id, latest_item_published_at, active")
        .eq("id", urlId)
        .maybeSingle();

      if (singleErr || !singleUrl) {
        const msg = singleErr?.message || "URL not found";
        return new Response(JSON.stringify({ success: false, error: msg }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!singleUrl.active) {
        return new Response(JSON.stringify({ success: false, error: "URL is inactive" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await runCheck(singleUrl as DueUrl);

      return new Response(
        JSON.stringify({
          success: true,
          processed: 1,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const urls = await fetchDueUrls(force);

    for (const row of urls) {
      await runCheck(row);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: urls.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("check-runner error:", message);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
