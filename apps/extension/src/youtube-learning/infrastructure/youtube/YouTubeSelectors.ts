export const YT_SELECTORS = {
  video: {
    player: '#movie_player',
    videoElement: 'video.video-stream.html5-main-video',
    playerContainer: '#player-container',
    playerApi: '#movie_player .ytp-player-content',
  },

  metadata: {
    title: [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1 yt-formatted-string.ytd-watch-metadata',
      '#title h1 yt-formatted-string',
      '.ytd-watch-metadata h1',
    ],
    channelName: [
      '#owner #channel-name yt-formatted-string',
      '#owner ytd-channel-name yt-formatted-string',
      'ytd-video-owner-renderer ytd-channel-name yt-formatted-string',
    ],
    channelLink: '#owner #channel-name a',
    subscriberCount: '#owner-sub-count',
    description: '#description yt-formatted-string',
    infoText: '#info-text yt-formatted-string',
    date: '#info-strings yt-formatted-string',
  },

  sidebar: {
    primary: '#primary',
    secondary: '#secondary',
    related: '#related',
    comments: '#comments',
    commentsSection: '#comment-section',
    liveChat: '#chat-container',
    chat: 'ytd-live-chat-frame',
  },

  controls: {
    playButton: '.ytp-play-button',
    rewind: '.ytp-rewind-button',
    forward: '.ytp-forward-button',
    volume: '.ytp-volume-panel',
    settings: '.ytp-settings-button',
    fullscreen: '.ytp-fullscreen-button',
    theatreButton: '.ytp-size-button',
    miniplayer: '.ytp-miniplayer-button',
    progressBar: '.ytp-progress-bar',
    currentTime: '.ytp-time-current',
    totalTime: '.ytp-time-duration',
    captionToggle: '.ytp-subtitles-button',
    captionMenu: '.ytp-caption-menu',
    speedButton: '.ytp-speed-button',
    autoplay: '.ytp-autonav-toggle-button',
  },

  layout: {
    masthead: '#masthead-container',
    guide: '#guide-container',
    guideButton: '#guide-button',
    topbar: '#topbar',
    header: '#header',
    pageManager: '#page-manager',
    content: '#content',
    columns: '#columns',
    primaryColumn: '#primary',
    secondaryColumn: '#secondary',
    main: '#main',
    footer: '#footer',
    snackbar: '#snackbar',
    notifications: '#notification-count',
  },

  search: {
    container: '#search-container',
    input: '#search-input #search',
    button: '#search-icon-legacy',
    suggestions: '#search-suggestions-container',
  },

  info: {
    infoPanel: '#info-panel',
    infoContents: '#info-contents',
    menu: '#menu-container',
    topLevelButtons: '#top-level-buttons-computed',
    likeButton: '#top-level-buttons-computed ytd-toggle-button-renderer:first-child',
    saveButton: '#top-level-buttons-computed ytd-button-renderer:last-child',
  },

  transcript: {
    panel: '#panels ytd-engagement-panel-section-list-renderer',
    segments: '#segments-container ytd-transcript-segment-renderer',
    segmentText: '.segment-text',
    segmentTimestamp: '.segment-timestamp',
    footer: '#footer ytd-engagement-panel-title-header-renderer',
  },

  shorts: {
    container: 'ytd-shorts',
    shelf: 'ytd-reel-shelf-renderer',
    player: '#shorts-player',
  },

  notification: 'ytd-notification-topbar-button-renderer',

  ytInitialData: '#player-container script',
} as const

export function getVideoElement(): HTMLVideoElement | null {
  return document.querySelector(YT_SELECTORS.video.videoElement)
}
