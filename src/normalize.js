const get = require("lodash/get");
const { createRemoteFileNode } = require("gatsby-source-filesystem");

function createHash(obj) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(obj))
    .digest("hex");
}

exports.normalizeRecords = items => {
  return (items || []).map(item => {
    const e = {
      id: get(item, "id"),
      publishedAt: get(item, "snippet.publishedAt"),
      title: get(item, "snippet.title"),
      description: get(item, "snippet.description"),
      videoId: get(item, "contentDetails.videoId"),
      privacyStatus: get(item, "status.privacyStatus"),
      thumbnail: get(
        item,
        "snippet.thumbnails.maxres",
        get(
          item,
          "snippet.thumbnails.standard",
          get(
            item,
            "snippet.thumbnails.high",
            get(
              item,
              "snippet.thumbnails.medium",
              get(item, "snippet.thumbnails.default")
            )
          )
        )
      )
    };

    return e;
  });
};

exports.downloadThumbnails = async ({ items, store, cache, createNode }) =>
  Promise.all(
    items.map(async item => {
      let fileNode;
      if (item.thumbnail && item.thumbnail.url) {
        try {
          fileNode = await createRemoteFileNode({
            url: item.thumbnail.url,
            store,
            cache,
            createNode
          });
        } catch (error) {
          // noop
        }
      }

      if (fileNode) {
        item.localThumbnail___NODE = fileNode.id;
      }

      return item;
    })
  );
