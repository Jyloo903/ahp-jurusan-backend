// src/controllers/adminController.js - FIXED VERSION
const User = require('../models/user');
const Alternative = require('../models/alternative');
const Criteria = require('../models/criteria');
const University = require('../models/University');
const RecommendationRun = require('../models/recommendationRun');
const UserPreference = require('../models/UserPreference');
const Pairwise = require('../models/PairwiseComparison');

// ===== USER MANAGEMENT =====
exports.getAllUsers = async (req, res) => {
  try {
    // HAPUS username dan is_active karena tidak ada di model
    const users = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role', 'created_at', 'updated_at'] 
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get users',
      error: err.message 
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // expected 'user' | 'admin' | 'superadmin'
    
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be: user, admin, or superadmin' 
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User role updated successfully',
      data: { 
        id: user.id, 
        name: user.name,
        email: user.email,
        oldRole: user.previous('role'),
        newRole: user.role 
      }
    });
    
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role',
      error: err.message 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Jangan hapus diri sendiri
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    await user.destroy();
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: { id: user.id, name: user.name, email: user.email }
    });
    
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user',
      error: err.message 
    });
  }
};

// ===== SYSTEM STATS (admin & superadmin) =====
exports.getSystemStats = async (req, res) => {
  try {
    const [userCount, altCount, critCount, uniCount] = await Promise.all([
      User.count(),
      Alternative.count(),
      Criteria.count(),
      University.count()
    ]);
    
    res.json({ 
      success: true, 
      stats: { 
        users: userCount, 
        alternatives: altCount, 
        criteria: critCount, 
        universities: uniCount 
      },
      message: `System has ${userCount} users, ${altCount} majors, ${critCount} criteria, and ${uniCount} universities`
    });
    
  } catch (err) {
    console.error('getSystemStats error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get system statistics',
      error: err.message 
    });
  }
};

// ===== ADMIN: lihat hasil rekomendasi user (admin read-only) =====
exports.getUserResults = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId query parameter is required' 
      });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const runs = await RecommendationRun.findAll({ 
      where: { user_id: userId }, 
      order: [['created_at', 'DESC']],
      limit: 20 // Limit hasil
    });
    
    res.json({ 
      success: true, 
      data: runs,
      user: { id: user.id, name: user.name, email: user.email },
      count: runs.length
    });
    
  } catch (err) {
    console.error('getUserResults error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user results',
      error: err.message 
    });
  }
};

// ===== GET USER HISTORY =====
exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user info
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get all user data in parallel
    const [preferences, pairwise, recommendations] = await Promise.all([
      UserPreference.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 50
      }),
      Pairwise.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 50
      }),
      RecommendationRun.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10
      })
    ]);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joined: user.created_at
      },
      history: {
        preferences: {
          count: preferences.length,
          data: preferences
        },
        pairwiseComparisons: {
          count: pairwise.length,
          data: pairwise
        },
        ahpResults: {
          count: recommendations.length,
          data: recommendations
        }
      },
      summary: {
        totalDataPoints: preferences.length + pairwise.length + recommendations.length,
        lastAHP: recommendations.length > 0 ? recommendations[0].created_at : null
      }
    });

  } catch (error) {
    console.error('getUserHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load user history',
      error: error.message
    });
  }
};