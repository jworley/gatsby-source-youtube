# gatsby-source-youtube

A [gatsby](https://www.gatsbyjs.org/) source plugin for fetching videos for a Youtube channel by channel ID.

Learn more about Gatsby plugins and how to use them here: https://www.gatsbyjs.org/docs/plugins/

## Install

`npm install --save gatsby-source-youtube`


## gatsby-config.js

```javascript
plugins: [
  {
    resolve: `gatsby-source-youtube`,
    options: {
      channelId: '<<Youtube channelID eg. UCK8sQmJBp8GCxrOtXWBpyEA >>',
      apiKey: '<< Add your Youtube api key here>>',
      maxVideos: 50 // Defaults to 50
    },
  },
  ...
]
```

## Examples of how to query:

Get all the videos:

```graphql
{
  allYoutubeVideo {
    edges {
      node {
        id
        title
        description
        videoId
        publishedAt
        privacyStatus
      }
    }
  }
}

```

## Schema

`title`
: The title of the Youtube video

`description`
: The description of the Youtube video

`videoId`
: The id for the video on Youtube, can be used to make a url to the video or to embed it

`publishedAt`
: The date the video was published.

`privacyStatus`
: The privacy status of the video, public, private, or unlisted

`thumbnail`
: The information about the largest thumbnail available on Youtube. Sub-properties: `url`, `width`, `height`

`localThumbnail`
: The information about the locally saved thumbnail. Works with `gatsby-image`