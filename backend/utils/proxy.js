const axios = require('axios');

function parseProxyString(proxyString) {
  const trimmed = proxyString.trim();
  
  // Format: http://user:pass@ip:port
  const httpMatch = trimmed.match(/^(https?):\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/);
  if (httpMatch) {
    return {
      protocol: httpMatch[1],
      username: httpMatch[2],
      password: httpMatch[3],
      host: httpMatch[4],
      port: parseInt(httpMatch[5]),
    };
  }
  
  // Format: ip:port:user:pass
  const colonMatch = trimmed.match(/^([^:]+):(\d+):([^:]+):(.+)$/);
  if (colonMatch) {
    return {
      protocol: 'http',
      host: colonMatch[1],
      port: parseInt(colonMatch[2]),
      username: colonMatch[3],
      password: colonMatch[4],
    };
  }
  
  // Format: ip:port
  const simpleMatch = trimmed.match(/^([^:]+):(\d+)$/);
  if (simpleMatch) {
    return {
      protocol: 'http',
      host: simpleMatch[1],
      port: parseInt(simpleMatch[2]),
      username: null,
      password: null,
    };
  }
  
  throw new Error(`Invalid proxy format: ${proxyString}`);
}

function formatProxyUrl(proxy) {
  if (proxy.username && proxy.password) {
    return `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  }
  return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
}

async function testProxy(proxy, timeout = 10000) {
  const proxyUrl = formatProxyUrl(proxy);
  const testUrl = 'http://httpbin.org/ip';
  
  try {
    const startTime = Date.now();
    
    const response = await axios.get(testUrl, {
      proxy: false, // Disable axios built-in proxy
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
      }),
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // Use manual proxy configuration
      ...(proxy.username ? {
        auth: {
          username: proxy.username,
          password: proxy.password,
        }
      } : {}),
    });
    
    const endTime = Date.now();
    const speed = endTime - startTime;
    
    if (response.status === 200 && response.data.origin) {
      return {
        success: true,
        speed,
        ip: response.data.origin,
        error: null,
      };
    } else {
      return {
        success: false,
        speed: null,
        ip: null,
        error: 'Invalid response',
      };
    }
  } catch (error) {
    return {
      success: false,
      speed: null,
      ip: null,
      error: error.message,
    };
  }
}

function detectProxyFormat(proxyString) {
  try {
    const parsed = parseProxyString(proxyString);
    
    if (parsed.username && parsed.password) {
      if (proxyString.includes('://')) {
        return 'http://user:pass@ip:port';
      } else {
        return 'ip:port:user:pass';
      }
    } else {
      return 'ip:port';
    }
  } catch (error) {
    return 'unknown';
  }
}

function parseProxyList(proxyListString) {
  const lines = proxyListString.split('\n').map(line => line.trim()).filter(line => line);
  const results = [];
  const errors = [];
  
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = parseProxyString(lines[i]);
      results.push({
        ...parsed,
        originalString: lines[i],
        format: detectProxyFormat(lines[i]),
      });
    } catch (error) {
      errors.push({
        line: i + 1,
        content: lines[i],
        error: error.message,
      });
    }
  }
  
  return { results, errors };
}

module.exports = {
  parseProxyString,
  formatProxyUrl,
  testProxy,
  detectProxyFormat,
  parseProxyList,
};

