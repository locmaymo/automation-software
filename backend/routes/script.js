const express = require('express');
const { Script } = require('../models');
const cron = require('node-cron');
const BrowserManager = require('../../workers/BrowserManager');
const router = express.Router();

// Store scheduled jobs
const scheduledJobs = new Map();

// Get all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get script by ID
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create script
router.post('/', async (req, res) => {
  try {
    const { name, description, actions, schedule } = req.body;
    
    // Validate actions
    if (!Array.isArray(actions)) {
      return res.status(400).json({ error: 'Actions must be an array' });
    }
    
    // Validate schedule if provided
    if (schedule && !cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron schedule' });
    }
    
    const script = await Script.create({
      name,
      description,
      actions,
      schedule,
    });
    
    // Schedule if needed
    if (schedule) {
      scheduleScript(script);
    }
    
    res.status(201).json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update script
router.put('/:id', async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    const { schedule } = req.body;
    
    // Validate schedule if provided
    if (schedule && !cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron schedule' });
    }
    
    // Unschedule old job
    if (scheduledJobs.has(script.id)) {
      scheduledJobs.get(script.id).destroy();
      scheduledJobs.delete(script.id);
    }
    
    await script.update(req.body);
    
    // Schedule new job if needed
    if (schedule && script.isActive) {
      scheduleScript(script);
    }
    
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete script
router.delete('/:id', async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Unschedule job
    if (scheduledJobs.has(script.id)) {
      scheduledJobs.get(script.id).destroy();
      scheduledJobs.delete(script.id);
    }
    
    await script.destroy();
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute script manually
router.post('/:id/execute', async (req, res) => {
  try {
    const { profileIds = [] } = req.body;
    const script = await Script.findByPk(req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    const results = await executeScript(script, profileIds);
    
    res.json({
      message: 'Script execution completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle script active status
router.post('/:id/toggle', async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    const newStatus = !script.isActive;
    await script.update({ isActive: newStatus });
    
    // Handle scheduling
    if (script.schedule) {
      if (newStatus) {
        scheduleScript(script);
      } else {
        if (scheduledJobs.has(script.id)) {
          scheduledJobs.get(script.id).destroy();
          scheduledJobs.delete(script.id);
        }
      }
    }
    
    res.json({
      message: `Script ${newStatus ? 'activated' : 'deactivated'} successfully`,
      script,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get script execution history
router.get('/:id/history', async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // This would typically come from a separate execution log table
    // For now, return basic stats from the script model
    res.json({
      scriptId: script.id,
      totalRuns: script.runCount,
      successfulRuns: script.successCount,
      failedRuns: script.failureCount,
      lastRun: script.lastRun,
      successRate: script.runCount > 0 ? (script.successCount / script.runCount * 100).toFixed(2) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to schedule script
function scheduleScript(script) {
  if (!script.schedule || !script.isActive) {
    return;
  }
  
  try {
    const job = cron.schedule(script.schedule, async () => {
      console.log(`Executing scheduled script: ${script.name}`);
      await executeScript(script);
    }, {
      scheduled: true,
    });
    
    scheduledJobs.set(script.id, job);
    console.log(`Scheduled script ${script.name} with cron: ${script.schedule}`);
  } catch (error) {
    console.error(`Failed to schedule script ${script.name}:`, error);
  }
}

// Helper function to execute script
async function executeScript(script, profileIds = []) {
  const browserManager = new BrowserManager();
  const results = [];
  
  try {
    // Update script stats
    await script.update({
      runCount: script.runCount + 1,
      lastRun: new Date(),
    });
    
    // If no specific profiles provided, use all active browsers
    let targetProfiles = profileIds;
    if (targetProfiles.length === 0) {
      const statuses = await browserManager.getAllBrowserStatuses();
      targetProfiles = Object.keys(statuses).filter(id => statuses[id].status === 'running');
    }
    
    if (targetProfiles.length === 0) {
      throw new Error('No active browsers found to execute script');
    }
    
    // Execute actions for each profile
    for (const profileId of targetProfiles) {
      const profileResults = [];
      let success = true;
      
      try {
        const page = browserManager.pages.get(parseInt(profileId));
        if (!page) {
          throw new Error(`Browser not running for profile ${profileId}`);
        }
        
        // Execute each action in sequence
        for (const action of script.actions) {
          try {
            const result = await executeAction(browserManager, page, action);
            profileResults.push({
              action: action.type,
              success: true,
              result,
            });
          } catch (actionError) {
            profileResults.push({
              action: action.type,
              success: false,
              error: actionError.message,
            });
            success = false;
            
            // Stop execution on error if specified
            if (action.stopOnError !== false) {
              break;
            }
          }
        }
        
        results.push({
          profileId: parseInt(profileId),
          success,
          actions: profileResults,
        });
        
      } catch (profileError) {
        results.push({
          profileId: parseInt(profileId),
          success: false,
          error: profileError.message,
          actions: profileResults,
        });
      }
    }
    
    // Update success/failure counts
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    await script.update({
      successCount: script.successCount + successCount,
      failureCount: script.failureCount + failureCount,
    });
    
    return results;
    
  } catch (error) {
    console.error(`Script execution failed: ${script.name}`, error);
    
    await script.update({
      failureCount: script.failureCount + 1,
    });
    
    throw error;
  }
}

// Helper function to execute individual action
async function executeAction(browserManager, page, action) {
  const { type, selector, value, options = {} } = action;
  
  switch (type) {
    case 'navigate':
      await browserManager.executeAction(page, 'navigate', value);
      break;
      
    case 'click':
      await browserManager.executeAction(page, 'click', selector);
      break;
      
    case 'type':
      await browserManager.executeAction(page, 'type', selector, value);
      break;
      
    case 'wait':
      await browserManager.executeAction(page, 'wait', parseInt(value));
      break;
      
    case 'waitForSelector':
      await browserManager.executeAction(page, 'waitForSelector', selector);
      break;
      
    case 'getText':
      return await browserManager.executeAction(page, 'getText', selector);
      
    case 'screenshot':
      return await browserManager.executeAction(page, 'screenshot', options.fullPage);
      
    case 'evaluate':
      return await browserManager.executeAction(page, 'evaluate', value);
      
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Initialize scheduled scripts on startup
async function initializeScheduledScripts() {
  try {
    const scripts = await Script.findAll({
      where: {
        isActive: true,
        schedule: { [require('sequelize').Op.ne]: null },
      },
    });
    
    for (const script of scripts) {
      scheduleScript(script);
    }
    
    console.log(`Initialized ${scripts.length} scheduled scripts`);
  } catch (error) {
    console.error('Failed to initialize scheduled scripts:', error);
  }
}

// Call initialization
initializeScheduledScripts();

module.exports = router;

