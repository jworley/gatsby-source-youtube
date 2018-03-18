const axios = require("axios");
const get = require("lodash/get");
const crypto = require("crypto");
const normalize = require("./normalize");

function createHash(obj) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(obj))
    .digest("hex");
}

function getApi() {
  const rateLimit = 500;
  let lastCalled = null;

  const rateLimiter = call => {
    const now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit;
      const wait = lastCalled - now;
      if (wait > 0) {
        return new Promise(resolve => setTimeout(() => resolve(call), wait));
      }
    }
    lastCalled = now;
    return call;
  };

  const api = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3/"
  });

  api.interceptors.request.use(rateLimiter);

  return api;
}

function processDatum(datum, kind) {
  const type = `Youtube${kind}`;
  const id = `${type}-${datum.id}`;
  const contentDigest = createHash(datum);

  return {
    ...datum,
    id,
    originalID: `${datum.id}`,
    parent: "__SOURCE__",
    children: [],
    internal: { type, contentDigest }
  };
}

exports.sourceNodes = async (
  { boundActionCreators, store, cache },
  { channelId, apiKey, maxVideos=50 }
) => {
  const { createNode } = boundActionCreators;

  var api = getApi();

  try {
    const channelResp = await api.get(
      `channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );

    const channelData = channelResp.data.items[0];
    if (!!channelData) {
      const uploadsId = get(
        channelData,
        "contentDetails.relatedPlaylists.uploads"
      );
      let videos = [];
      let pageSize = Math.min(50, maxVideos);

      let videoResp = await api.get(
        `playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=${pageSize}&playlistId=${uploadsId}&key=${apiKey}`
      );
      videos.push(...videoResp.data.items);

      while (videoResp.data.nextPageToken && videos.length < maxVideos) {
        pageSize = Math.min(50, maxVideos - videos.length);
        let nextPageToken = videoResp.data.nextPageToken;
        videoResp = await api.get(
          `playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=${pageSize}&pageToken=${nextPageToken}&playlistId=${uploadsId}&key=${apiKey}`
        );
        videos.push(...videoResp.data.items);
      }

      videos = normalize.normalizeRecords(videos);
      videos = await normalize.downloadThumbnails({
        items: videos,
        store,
        cache,
        createNode
      });
      videos.forEach(datum => createNode(processDatum(datum, "Video")));
    }

    return;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
