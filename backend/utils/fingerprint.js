const crypto = require('crypto');

// Danh sách các User Agent thực tế
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
];

const PLATFORMS = [
  'Windows 11',
  'Windows 10',
  'macOS',
  'Linux',
];

const WEBGL_VENDORS = [
  'Google Inc. (AMD)',
  'Google Inc. (NVIDIA)',
  'Google Inc. (Intel)',
];

const WEBGL_RENDERERS = [
  'ANGLE (AMD, AMD Radeon R7 430 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
];

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
];

const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Asia/Manila',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
];

const LANGUAGES = [
  'vi-VN,vi;q=0.9,en;q=0.8',
  'en-US,en;q=0.9',
  'zh-CN,zh;q=0.9,en;q=0.8',
  'ja-JP,ja;q=0.9,en;q=0.8',
  'ko-KR,ko;q=0.9,en;q=0.8',
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomFingerprint() {
  const platform = getRandomElement(PLATFORMS);
  const userAgent = getRandomElement(USER_AGENTS);
  const screen = getRandomElement(SCREEN_RESOLUTIONS);
  const webglVendor = getRandomElement(WEBGL_VENDORS);
  const webglRenderer = getRandomElement(WEBGL_RENDERERS);
  const timezone = getRandomElement(TIMEZONES);
  const language = getRandomElement(LANGUAGES);
  
  // Generate random hardware specs
  const cpuCores = getRandomElement([4, 6, 8, 12, 16]);
  const memory = getRandomElement([4, 8, 16, 32]);
  
  // Generate random MAC address (disabled by default)
  const macAddress = Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');

  const fingerprint = {
    platform,
    userAgent,
    proxy: null, // Will be set when proxy is assigned
    webRTC: 'altered',
    canvas: 'real',
    webGL: 'real',
    webGLInfo: {
      vendor: webglVendor,
      renderer: webglRenderer,
    },
    webGPU: 'real',
    clientRects: 'real',
    timezone: timezone,
    language: language,
    geolocation: 'auto',
    cpu: `${cpuCores} cores`,
    memory: `${memory} GB`,
    macAddress: 'OFF', // Disabled by default
    deviceName: 'OFF', // Disabled by default
    audio: 'real',
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: 24,
      pixelDepth: 24,
    },
    mediaDevices: 'real',
    doNotTrack: 'off',
    // Additional fingerprint properties
    hardwareConcurrency: cpuCores,
    deviceMemory: memory,
    colorGamut: 'srgb',
    reducedMotion: 'no-preference',
    forcedColors: 'none',
    // Unique identifier for this fingerprint
    fingerprintId: crypto.randomUUID(),
  };

  return fingerprint;
}

function validateFingerprint(fingerprint) {
  const required = [
    'platform', 'userAgent', 'webRTC', 'canvas', 'webGL', 
    'webGLInfo', 'timezone', 'language', 'cpu', 'memory', 'screen'
  ];
  
  for (const field of required) {
    if (!fingerprint[field]) {
      return false;
    }
  }
  
  return true;
}

function isUniqueFingerprint(fingerprint, existingFingerprints) {
  return !existingFingerprints.some(existing => 
    existing.fingerprintId === fingerprint.fingerprintId ||
    (existing.userAgent === fingerprint.userAgent && 
     existing.screen.width === fingerprint.screen.width &&
     existing.screen.height === fingerprint.screen.height &&
     existing.webGLInfo.renderer === fingerprint.webGLInfo.renderer)
  );
}

function rollFingerprint(existingFingerprint) {
  // Keep some properties but regenerate others
  const newFingerprint = generateRandomFingerprint();
  
  // Optionally keep the same platform/timezone for consistency
  if (Math.random() > 0.3) {
    newFingerprint.platform = existingFingerprint.platform;
    newFingerprint.timezone = existingFingerprint.timezone;
  }
  
  return newFingerprint;
}

module.exports = {
  generateRandomFingerprint,
  validateFingerprint,
  isUniqueFingerprint,
  rollFingerprint,
};

