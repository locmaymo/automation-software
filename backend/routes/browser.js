const express = require('express');
const { BrowserSession, Profile } = require('../models');
const BrowserManager = require('../../workers/BrowserManager');
const router = express.Router();

// Create browser manager instance
const browserManager = new BrowserManager();

// Get all browser sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await BrowserSession.findAll({
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'name', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get real-time status
    const statuses = await browserManager.getAllBrowserStatuses();
    
    const sessionsWithStatus = sessions.map(session => ({
      ...session.toJSON(),
      realTimeStatus: statuses[session.profileId] || { status: 'stopped' },
    }));

    res.json(sessionsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start browser for profile
router.post('/start/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { headless = false } = req.body;

    const result = await browserManager.startBrowser(parseInt(profileId), { headless });
    
    res.json({
      message: 'Browser started successfully',
      session: result.session,
      profile: result.profile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop browser for profile
router.post('/stop/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    await browserManager.stopBrowser(parseInt(profileId));
    
    res.json({ message: 'Browser stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start multiple browsers
router.post('/start-bulk', async (req, res) => {
  try {
    const { profileIds, headless = false } = req.body;
    
    const results = [];
    
    for (const profileId of profileIds) {
      try {
        const result = await browserManager.startBrowser(parseInt(profileId), { headless });
        results.push({
          profileId,
          success: true,
          session: result.session,
        });
      } catch (error) {
        results.push({
          profileId,
          success: false,
          error: error.message,
        });
      }
    }
    
    res.json({
      message: 'Bulk browser start completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop multiple browsers
router.post('/stop-bulk', async (req, res) => {
  try {
    const { profileIds } = req.body;
    
    const results = [];
    
    for (const profileId of profileIds) {
      try {
        await browserManager.stopBrowser(parseInt(profileId));
        results.push({
          profileId,
          success: true,
        });
      } catch (error) {
        results.push({
          profileId,
          success: false,
          error: error.message,
        });
      }
    }
    
    res.json({
      message: 'Bulk browser stop completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set master profile
router.post('/set-master/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    await browserManager.setMasterProfile(parseInt(profileId));
    
    res.json({ message: 'Master profile set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add slave profile
router.post('/add-slave/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    await browserManager.addSlaveProfile(parseInt(profileId));
    
    res.json({ message: 'Slave profile added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove slave profile
router.post('/remove-slave/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    await browserManager.removeSlaveProfile(parseInt(profileId));
    
    res.json({ message: 'Slave profile removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute action on master
router.post('/execute-master', async (req, res) => {
  try {
    const { action, args = [] } = req.body;
    
    const result = await browserManager.executeOnMaster(action, ...args);
    
    res.json({
      message: 'Action executed on master successfully',
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute action on slaves
router.post('/execute-slaves', async (req, res) => {
  try {
    const { action, args = [] } = req.body;
    
    const results = await browserManager.executeOnSlaves(action, ...args);
    
    res.json({
      message: 'Action executed on slaves',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute action on specific profile
router.post('/execute/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { action, args = [] } = req.body;
    
    const page = browserManager.pages.get(parseInt(profileId));
    if (!page) {
      return res.status(404).json({ error: 'Browser not running for this profile' });
    }
    
    const result = await browserManager.executeAction(page, action, ...args);
    
    res.json({
      message: 'Action executed successfully',
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get browser status for profile
router.get('/status/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const status = await browserManager.getBrowserStatus(parseInt(profileId));
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all browser statuses
router.get('/status', async (req, res) => {
  try {
    const statuses = await browserManager.getAllBrowserStatuses();
    
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean up all browsers (emergency stop)
router.post('/cleanup', async (req, res) => {
  try {
    await browserManager.cleanup();
    
    res.json({ message: 'All browsers cleaned up successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

