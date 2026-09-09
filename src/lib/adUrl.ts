const TRACKER_HOSTS = [
  "doubleclick.net",
  "googleadservices.com",
  "googlesyndication.com",
  "adform.net",
  "adnxs.com",
  "adsrvr.org",
  "smartadserver.com",
  "ad.gemius.pl",
  "adocean.pl",
  "gemius.pl",
];

/** True for ad-serving/click-tracking URLs that AdBlock strips from the DOM. */
export const isAdTrackerUrl = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRACKER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return /doubleclick|adform|adocean|adnxs|gemius/i.test(url);
  }
};
