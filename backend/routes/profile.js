const express = require('express');
const { Profile, Proxy } = require('../models');
const { generateRandomFingerprint, rollFingerprint, isUniqueFingerprint } = require('../utils/fingerprint');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Get all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.findAll({
      include: [
        {
          model: Proxy,
          as: 'proxy',
          attributes: ['id', 'host', 'port', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id, {
      include: [
        {
          model: Proxy,
          as: 'proxy',
        },
      ],
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create single profile
router.post('/', async (req, res) => {
  try {
    const { name, proxyId, notes } = req.body;
    
    // Get existing fingerprints to ensure uniqueness
    const existingProfiles = await Profile.findAll({
      attributes: ['fingerprint'],
    });
    const existingFingerprints = existingProfiles.map(p => p.fingerprint);
    
    // Generate unique fingerprint
    let fingerprint;
    let attempts = 0;
    do {
      fingerprint = generateRandomFingerprint();
      attempts++;
    } while (!isUniqueFingerprint(fingerprint, existingFingerprints) && attempts < 10);
    
    if (attempts >= 10) {
      return res.status(500).json({ error: 'Unable to generate unique fingerprint' });
    }
    
    // Create user data directory
    const userDataDir = path.join(__dirname, '../../user-data', `profile-${Date.now()}`);
    await fs.mkdir(userDataDir, { recursive: true });
    
    // If proxy is specified, mark it as assigned
    if (proxyId) {
      const proxy = await Proxy.findByPk(proxyId);
      if (!proxy) {
        return res.status(400).json({ error: 'Proxy not found' });
      }
      
      if (proxy.isAssigned) {
        return res.status(400).json({ error: 'Proxy is already assigned' });
      }
      
      await proxy.update({ isAssigned: true, assignedTo: null }); // Will be updated after profile creation
    }
    
    const profile = await Profile.create({
      name,
      fingerprint,
      proxyId,
      userDataDir,
      notes,
    });
    
    // Update proxy assignment
    if (proxyId) {
      await Proxy.update({ assignedTo: profile.id }, { where: { id: proxyId } });
    }
    
    // Reload with proxy data
    const createdProfile = await Profile.findByPk(profile.id, {
      include: [{ model: Proxy, as: 'proxy' }],
    });
    
    res.status(201).json(createdProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create multiple profiles
router.post('/bulk', async (req, res) => {
  try {
    const { count, namePrefix = 'Profile', assignProxies = false } = req.body;
    
    if (count > 50) {
      return res.status(400).json({ error: 'Maximum 50 profiles can be created at once' });
    }
    
    // Get existing fingerprints
    const existingProfiles = await Profile.findAll({
      attributes: ['fingerprint'],
    });
    const existingFingerprints = existingProfiles.map(p => p.fingerprint);
    
    // Get available proxies if needed
    let availableProxies = [];
    if (assignProxies) {
      availableProxies = await Proxy.findAll({
        where: { 
          isAssigned: false,
          status: 'working',
        },
        limit: count,
      });
      
      if (availableProxies.length < count) {
        return res.status(400).json({ 
          error: `Not enough available proxies. Found ${availableProxies.length}, need ${count}` 
        });
      }
    }
    
    const created = [];
    const failed = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Generate unique fingerprint
        let fingerprint;
        let attempts = 0;
        do {
          fingerprint = generateRandomFingerprint();
          attempts++;
        } while (!isUniqueFingerprint(fingerprint, [...existingFingerprints, ...created.map(p => p.fingerprint)]) && attempts < 10);
        
        if (attempts >= 10) {
          failed.push({ index: i + 1, error: 'Unable to generate unique fingerprint' });
          continue;
        }
        
        // Create user data directory
        const userDataDir = path.join(__dirname, '../../user-data', `profile-${Date.now()}-${i}`);
        await fs.mkdir(userDataDir, { recursive: true });
        
        const proxyId = assignProxies ? availableProxies[i].id : null;
        
        const profile = await Profile.create({
          name: `${namePrefix} ${i + 1}`,
          fingerprint,
          proxyId,
          userDataDir,
        });
        
        // Mark proxy as assigned
        if (proxyId) {
          await Proxy.update(
            { isAssigned: true, assignedTo: profile.id },
            { where: { id: proxyId } }
          );
        }
        
        created.push(profile);
      } catch (error) {
        failed.push({ index: i + 1, error: error.message });
      }
    }
    
    res.json({
      created: created.length,
      failed: failed.length,
      details: {
        created,
        failed,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Roll fingerprint
router.post('/:id/roll-fingerprint', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Get existing fingerprints
    const existingProfiles = await Profile.findAll({
      where: { id: { [require('sequelize').Op.ne]: profile.id } },
      attributes: ['fingerprint'],
    });
    const existingFingerprints = existingProfiles.map(p => p.fingerprint);
    
    // Generate new fingerprint
    let newFingerprint;
    let attempts = 0;
    do {
      newFingerprint = rollFingerprint(profile.fingerprint);
      attempts++;
    } while (!isUniqueFingerprint(newFingerprint, existingFingerprints) && attempts < 10);
    
    if (attempts >= 10) {
      return res.status(500).json({ error: 'Unable to generate unique fingerprint' });
    }
    
    await profile.update({ fingerprint: newFingerprint });
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign proxy to profile
router.post('/:id/assign-proxy', async (req, res) => {
  try {
    const { proxyId } = req.body;
    
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Unassign current proxy if any
    if (profile.proxyId) {
      await Proxy.update(
        { isAssigned: false, assignedTo: null },
        { where: { id: profile.proxyId } }
      );
    }
    
    // Assign new proxy
    if (proxyId) {
      const proxy = await Proxy.findByPk(proxyId);
      if (!proxy) {
        return res.status(400).json({ error: 'Proxy not found' });
      }
      
      if (proxy.isAssigned) {
        return res.status(400).json({ error: 'Proxy is already assigned' });
      }
      
      await proxy.update({ isAssigned: true, assignedTo: profile.id });
    }
    
    await profile.update({ proxyId });
    
    // Reload with proxy data
    const updatedProfile = await Profile.findByPk(profile.id, {
      include: [{ model: Proxy, as: 'proxy' }],
    });
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/:id', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    await profile.update(req.body);
    
    const updatedProfile = await Profile.findByPk(profile.id, {
      include: [{ model: Proxy, as: 'proxy' }],
    });
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile
router.delete('/:id', async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Unassign proxy
    if (profile.proxyId) {
      await Proxy.update(
        { isAssigned: false, assignedTo: null },
        { where: { id: profile.proxyId } }
      );
    }
    
    // Delete user data directory
    if (profile.userDataDir) {
      try {
        await fs.rmdir(profile.userDataDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to delete user data directory:', error.message);
      }
    }
    
    await profile.destroy();
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

