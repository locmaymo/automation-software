const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { BrowserSession, Profile, Proxy } = require('../backend/models');
const { formatProxyUrl } = require('../backend/utils/proxy');
const path = require('path');
const fs = require('fs').promises;

puppeteer.use(StealthPlugin());

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.pages = new Map();
    this.masterProfile = null;
    this.slaveProfiles = new Set();
    this.lastActivityUpdateTimers = new Map();
  }

  async startBrowser(profileId, options = {}) {
    const profile = await Profile.findByPk(profileId, {
      include: [{ model: Proxy, as: 'proxy' }],
    });
    if (!profile) throw new Error('Profile not found');
    if (this.browsers.has(profileId)) throw new Error('Browser already running');

    const launchOptions = {
      headless: options.headless || false,
      userDataDir: profile.userDataDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    };

    if (profile.proxy) {
      const proxyUrl = formatProxyUrl(profile.proxy);
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
    }

    const fingerprint = profile.fingerprint;
    if (fingerprint.screen) {
      launchOptions.defaultViewport = {
        width: fingerprint.screen.width,
        height: fingerprint.screen.height,
      };
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await this.applyFingerprint(page, fingerprint);

    this.browsers.set(profileId, browser);
    this.pages.set(profileId, page);

    const session = await BrowserSession.create({
      profileId,
      pid: browser.process()?.pid,
      wsEndpoint: browser.wsEndpoint(),
      status: 'running',
      startedAt: new Date(),
      lastActivity: new Date(),
    });

    await profile.update({
      status: 'active',
      lastUsed: new Date(),
    });

    return { browser, page, session, profile };
  }

  async applyFingerprint(page, fingerprint) {
    try {
      await page.setUserAgent(fingerprint.userAgent);
      if (fingerprint.screen) {
        await page.setViewport({
          width: fingerprint.screen.width,
          height: fingerprint.screen.height,
        });
      }
      if (fingerprint.geolocation && fingerprint.geolocation !== 'auto') {
        await page.setGeolocation(fingerprint.geolocation);
      }
      if (fingerprint.timezone) {
        await page.emulateTimezone(fingerprint.timezone);
      }

      if (fingerprint.webGLInfo) {
        await page.evaluateOnNewDocument((webGLInfo) => {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === 37445) return webGLInfo.vendor;
            if (parameter === 37446) return webGLInfo.renderer;
            return getParameter.call(this, parameter);
          };
        }, fingerprint.webGLInfo);
      }

      if (fingerprint.hardwareConcurrency) {
        await page.evaluateOnNewDocument((cores) => {
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => cores,
          });
        }, fingerprint.hardwareConcurrency);
      }

      if (fingerprint.deviceMemory) {
        await page.evaluateOnNewDocument((memory) => {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: () => memory,
          });
        }, fingerprint.deviceMemory);
      }

      if (fingerprint.language) {
        await page.evaluateOnNewDocument((language) => {
          Object.defineProperty(navigator, 'language', {
            get: () => language.split(',')[0],
          });
          Object.defineProperty(navigator, 'languages', {
            get: () => language.split(',').map(l => l.trim()),
          });
        }, fingerprint.language);
      }

      if (fingerprint.platform) {
        await page.evaluateOnNewDocument((platform) => {
          Object.defineProperty(navigator, 'platform', {
            get: () => platform,
          });
        }, fingerprint.platform);
      }

      if (fingerprint.screen) {
        await page.evaluateOnNewDocument((screen) => {
          Object.defineProperty(window.screen, 'width', {
            get: () => screen.width,
          });
          Object.defineProperty(window.screen, 'height', {
            get: () => screen.height,
          });
          Object.defineProperty(window.screen, 'availWidth', {
            get: () => screen.width,
          });
          Object.defineProperty(window.screen, 'availHeight', {
            get: () => screen.height - 40,
          });
        }, fingerprint.screen);
      }
    } catch (err) {
      console.error(`[BrowserManager] Failed to apply fingerprint: ${err.message}`);
    }
  }

  async stopBrowser(profileId) {
    const browser = this.browsers.get(profileId);
    if (!browser) throw new Error('Browser not found');
    if (this.lastActivityUpdateTimers.has(profileId)) {
      clearTimeout(this.lastActivityUpdateTimers.get(profileId));
      this.lastActivityUpdateTimers.delete(profileId);
    }
    await browser.close();
    this.browsers.delete(profileId);
    this.pages.delete(profileId);
    await BrowserSession.update(
      { status: 'stopped', stoppedAt: new Date() },
      { where: { profileId, status: 'running' } }
    );
    await Profile.update({ status: 'inactive' }, { where: { id: profileId } });
  }

  async setMasterProfile(profileId) {
    if (!this.browsers.has(profileId)) throw new Error('Browser not running');
    this.masterProfile = profileId;
    await BrowserSession.update({ isMaster: true }, { where: { profileId } });
    await BrowserSession.update({ isMaster: false }, {
      where: {
        profileId: {
          [require('sequelize').Op.ne]: profileId,
        },
      },
    });
  }

  async addSlaveProfile(profileId) {
    if (!this.browsers.has(profileId)) throw new Error('Browser not running');
    this.slaveProfiles.add(profileId);
  }

  async removeSlaveProfile(profileId) {
    this.slaveProfiles.delete(profileId);
  }

  async executeOnMaster(action, ...args) {
    if (!this.masterProfile || !this.browsers.has(this.masterProfile)) throw new Error('No master profile running');
    const page = this.pages.get(this.masterProfile);
    return this.executeAction(page, action, ...args);
  }

  async executeOnSlaves(action, ...args) {
    const results = [];
    for (const profileId of this.slaveProfiles) {
      if (this.browsers.has(profileId)) {
        const page = this.pages.get(profileId);
        try {
          const result = await this.executeAction(page, action, ...args);
          results.push({ profileId, success: true, result });
        } catch (err) {
          results.push({ profileId, success: false, error: err.message });
        }
      }
    }
    return results;
  }

  async executeAction(page, action, ...args) {
    const profileId = this.getProfileIdByPage(page);
    if (!profileId) return;
    if (this.lastActivityUpdateTimers.has(profileId)) {
      clearTimeout(this.lastActivityUpdateTimers.get(profileId));
    }
    const timer = setTimeout(async () => {
      try {
        await BrowserSession.update({
          currentUrl: page.url(),
          lastActivity: new Date(),
        }, { where: { profileId, status: 'running' } });
      } catch (err) {
        console.error(`[BrowserManager] Failed to update lastActivity: ${err.message}`);
      } finally {
        this.lastActivityUpdateTimers.delete(profileId);
      }
    }, 5000);
    this.lastActivityUpdateTimers.set(profileId, timer);

    switch (action) {
      case 'navigate':
        await page.goto(args[0], { waitUntil: 'networkidle2' });
        break;
      case 'click':
        await page.click(args[0]);
        break;
      case 'type':
        await page.type(args[0], args[1]);
        break;
      case 'wait':
        await page.waitForTimeout(args[0]);
        break;
      case 'waitForSelector':
        await page.waitForSelector(args[0]);
        break;
      case 'getText':
        return await page.$eval(args[0], el => el.textContent);
      case 'screenshot':
        return await page.screenshot({ fullPage: args[0] || false });
      case 'evaluate':
        return await page.evaluate(args[0]);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getProfileIdByPage(page) {
    for (const [profileId, p] of this.pages.entries()) {
      if (p === page) return profileId;
    }
    return null;
  }

  async getBrowserStatus(profileId) {
    const browser = this.browsers.get(profileId);
    const page = this.pages.get(profileId);
    if (!browser || !page) return { status: 'stopped' };
    try {
      return {
        status: 'running',
        url: page.url(),
        title: await page.title(),
        isMaster: this.masterProfile === profileId,
        isSlave: this.slaveProfiles.has(profileId),
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async getAllBrowserStatuses() {
    const statuses = {};
    for (const profileId of this.browsers.keys()) {
      statuses[profileId] = await this.getBrowserStatus(profileId);
    }
    return statuses;
  }

  async cleanup() {
    for (const [profileId, browser] of this.browsers.entries()) {
      try {
        await browser.close();
      } catch (err) {
        console.error(`[BrowserManager] Cleanup failed for ${profileId}: ${err.message}`);
      }
    }
    for (const timer of this.lastActivityUpdateTimers.values()) {
      clearTimeout(timer);
    }
    this.lastActivityUpdateTimers.clear();
    this.browsers.clear();
    this.pages.clear();
    this.masterProfile = null;
    this.slaveProfiles.clear();
    await BrowserSession.update(
      { status: 'stopped', stoppedAt: new Date() },
      { where: { status: 'running' } }
    );
    await Profile.update(
      { status: 'inactive' },
      { where: { status: 'active' } }
    );
  }
}

module.exports = BrowserManager;