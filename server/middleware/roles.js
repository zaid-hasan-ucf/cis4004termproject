const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connection');

// Role hierarchy: superuser > admin > user
const ROLE_RANK = { user: 1, admin: 2, superuser: 3 }

function rank(role) {
  return ROLE_RANK[role] || 0
}

async function attachCaller(req, res, next) {
  const callerId = req.headers['x-user-id'] || null
  if (!callerId) {
    req.callerId = null
    req.callerRole = 'user'
    return next()
  }
  try {
    if (!ObjectId.isValid(callerId)) {
      req.callerId = null
      req.callerRole = 'user'
      return next()
    }
    const user = await getDb().collection('users').findOne(
      { _id: new ObjectId(callerId) },
      { projection: { role: 1 } }
    )
    req.callerId = callerId
    req.callerRole = user?.role || 'user'
    next()
  } catch {
    req.callerId = null
    req.callerRole = 'user'
    next()
  }
}

// Only admin or superuser may proceed
function requireAdmin(req, res, next) {
  if (rank(req.callerRole) < rank('admin')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Only superuser may proceed
function requireSuperuser(req, res, next) {
  if (rank(req.callerRole) < rank('superuser')) {
    return res.status(403).json({ error: 'Superuser access required' })
  }
  next()
}

// User must own the resource OR be admin/superuser
function requireOwnerOrAdmin(ownerIdExtractor) {
  return (req, res, next) => {
    const ownerId = ownerIdExtractor(req)
    const isOwner = req.callerId && req.callerId === String(ownerId)
    const isAdmin = rank(req.callerRole) >= rank('admin')
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to modify this resource' })
    }
    next()
  }
}

module.exports = { attachCaller, requireAdmin, requireSuperuser, requireOwnerOrAdmin, rank }
