const express = require('express');
const { Proxy } = require('../models');
const { parseProxyList, testProxy } = require('../utils/proxy');
const router = express.Router();

// Get all proxies
router.get('/', async (req, res) => {
  try {
    const proxies = await Proxy.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(proxies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get proxy statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await Proxy.count();
    const working = await Proxy.count({ where: { status: 'working' } });
    const failed = await Proxy.count({ where: { status: 'failed' } });
    const untested = await Proxy.count({ where: { status: 'untested' } });
    const assigned = await Proxy.count({ where: { isAssigned: true } });
    
    res.json({
      total,
      working,
      failed,
      untested,
      assigned,
      available: working - assigned,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add single proxy
router.post('/', async (req, res) => {
  try {
    const { host, port, username, password, protocol = 'http', notes } = req.body;
    
    // Check if proxy already exists
    const existing = await Proxy.findOne({ where: { host, port } });
    if (existing) {
      return res.status(400).json({ error: 'Proxy already exists' });
    }
    
    const proxy = await Proxy.create({
      host,
      port,
      username,
      password,
      protocol,
      notes,
    });
    
    res.status(201).json(proxy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add multiple proxies from text
router.post('/bulk', async (req, res) => {
  try {
    const { proxyList } = req.body;
    const { results, errors } = parseProxyList(proxyList);
    
    const created = [];
    const duplicates = [];
    const failed = [];
    
    for (const proxyData of results) {
      try {
        // Check if proxy already exists
        const existing = await Proxy.findOne({ 
          where: { 
            host: proxyData.host, 
            port: proxyData.port 
          } 
        });
        
        if (existing) {
          duplicates.push(proxyData.originalString);
          continue;
        }
        
        const proxy = await Proxy.create({
          host: proxyData.host,
          port: proxyData.port,
          username: proxyData.username,
          password: proxyData.password,
          protocol: proxyData.protocol,
        });
        
        created.push(proxy);
      } catch (error) {
        failed.push({
          proxy: proxyData.originalString,
          error: error.message,
        });
      }
    }
    
    res.json({
      created: created.length,
      duplicates: duplicates.length,
      failed: failed.length,
      parseErrors: errors.length,
      details: {
        created,
        duplicates,
        failed,
        parseErrors: errors,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test single proxy
router.post('/:id/test', async (req, res) => {
  try {
    const proxy = await Proxy.findByPk(req.params.id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }
    
    const result = await testProxy(proxy);
    
    // Update proxy status
    await proxy.update({
      status: result.success ? 'working' : 'failed',
      speed: result.speed,
      lastTested: new Date(),
    });
    
    res.json({
      ...result,
      proxy: await proxy.reload(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test multiple proxies
router.post('/test-bulk', async (req, res) => {
  try {
    const { proxyIds } = req.body;
    const proxies = await Proxy.findAll({
      where: { id: proxyIds },
    });
    
    const results = [];
    
    for (const proxy of proxies) {
      try {
        const result = await testProxy(proxy);
        
        await proxy.update({
          status: result.success ? 'working' : 'failed',
          speed: result.speed,
          lastTested: new Date(),
        });
        
        results.push({
          id: proxy.id,
          ...result,
        });
      } catch (error) {
        results.push({
          id: proxy.id,
          success: false,
          error: error.message,
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update proxy
router.put('/:id', async (req, res) => {
  try {
    const proxy = await Proxy.findByPk(req.params.id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }
    
    await proxy.update(req.body);
    res.json(proxy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete proxy
router.delete('/:id', async (req, res) => {
  try {
    const proxy = await Proxy.findByPk(req.params.id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }
    
    await proxy.destroy();
    res.json({ message: 'Proxy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple proxies
router.delete('/bulk', async (req, res) => {
  try {
    const { proxyIds } = req.body;
    const deleted = await Proxy.destroy({
      where: { id: proxyIds },
    });
    
    res.json({ 
      message: `${deleted} proxies deleted successfully`,
      deleted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

