/**
 * liveThreatFeeds.js
 * Actively syncs and checks live global phishing and malware intelligence feeds.
 * Includes OpenPhish real-time feed with in-memory set and periodic background updates.
 */

import fs from 'node:fs';
import path from 'node:path';

class LiveThreatFeedManager {
  constructor() {
    this.activePhishingUrls = new Set();
    this.activePhishingDomains = new Set();
    this.lastUpdated = null;
    this.isUpdating = false;

    // Initial feed fetch in background
    this.updateFeeds();

    // Auto-refresh every 2 hours
    setInterval(() => this.updateFeeds(), 2 * 60 * 60 * 1000);
  }

  async updateFeeds() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      console.log('[ThreatFeeds] Syncing live OpenPhish active phishing database...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('https://openphish.com/feed.txt', {
        headers: { 'User-Agent': 'UrlAnalyser-Threat-Intel/2.0' },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        const urlSet = new Set();
        const domSet = new Set();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && trimmed.startsWith('http')) {
            urlSet.add(trimmed.toLowerCase());
            try {
              const u = new URL(trimmed);
              domSet.add(u.hostname.toLowerCase());
            } catch {}
          }
        }

        this.activePhishingUrls = urlSet;
        this.activePhishingDomains = domSet;
        this.lastUpdated = new Date().toISOString();
        console.log(`[ThreatFeeds] Successfully synced ${this.activePhishingUrls.size} live verified phishing URLs across ${this.activePhishingDomains.size} domains.`);
      }
    } catch (err) {
      console.warn('[ThreatFeeds] Feed sync warning:', err.message);
    } finally {
      this.isUpdating = false;
    }
  }

  checkUrl(urlStr, hostname) {
    const normalizedUrl = (urlStr || '').toLowerCase().trim();
    const normalizedHost = (hostname || '').toLowerCase().trim();

    const isDirectMatch = this.activePhishingUrls.has(normalizedUrl) ||
                          this.activePhishingUrls.has(normalizedUrl.replace(/\/$/, '')) ||
                          this.activePhishingUrls.has(normalizedUrl + '/');

    const isHostMatch = this.activePhishingDomains.has(normalizedHost);

    return {
      feedName: 'OpenPhish Global Community Feed',
      isListed: isDirectMatch || isHostMatch,
      matchType: isDirectMatch ? 'exact-url' : (isHostMatch ? 'domain-wide' : 'none'),
      totalFeedSize: this.activePhishingUrls.size,
      lastSynced: this.lastUpdated
    };
  }
}

export const threatFeedManager = new LiveThreatFeedManager();
