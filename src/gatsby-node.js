const axios = require("axios");
const get = require("lodash/get");
const normalize = require("./normalize");

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

exports.sourceNodes = async (
  { boundActionCreators, store, cache, createNodeId },
  { channelId, playlistId, apiKey, maxVideos=50 }
) => {
  const { createNode } = boundActionCreators;

  var api = getApi();
  
  try {
    const isChannel = !! channelId;
    const channelOrPlaylistId = isChannel ? channelId : playlistId;
    const requestEndpoint = isChannel ? "channels" : "playlists";
    const requestUrl = `${requestEndpoint}?part=contentDetails&id=${channelOrPlaylistId}&key=${apiKey}`;
    const channelResp = await api.get(requestUrl);

    const channelData = channelResp.data.items[0];
    if (!!channelData) {
      const uploadsId = isChannel 
        ? get(channelData, "contentDetails.relatedPlaylists.uploads")
        : playlistId;
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
      videos = normalize.createGatsbyIds(videos, createNodeId);
      videos = await normalize.downloadThumbnails({
        items: videos,
        store,
        cache,
        createNode
      });
      normalize.createNodesFromEntities(videos, createNode);
    }

    return;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

