// src/models/index.js
const User = require('./user');
const Criteria = require('./criteria');
const Alternative = require('./alternative');
const PairwiseComparison = require('./PairwiseComparison');
const University = require('./University');
const UniversityAlternative = require('./UniversityAlternative'); // TAMBAH INI
const UserPreference = require('./UserPreference');
const RecommendationRun = require('./recommendationRun');

// Pairwise -> Criteria
PairwiseComparison.belongsTo(Criteria, { 
  foreignKey: 'criteria_id_1', 
  as: 'Criteria1' 
});

PairwiseComparison.belongsTo(Criteria, { 
  foreignKey: 'criteria_id_2', 
  as: 'Criteria2' 
});

// Pairwise -> User
PairwiseComparison.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'User' 
});

// University <-> Alternative (Many-to-Many) // TAMBAH INI
University.belongsToMany(Alternative, { 
  through: UniversityAlternative,
  foreignKey: 'university_id',
  otherKey: 'alternative_id'
});

Alternative.belongsToMany(University, { 
  through: UniversityAlternative,
  foreignKey: 'alternative_id',
  otherKey: 'university_id'
});

module.exports = {
  User,
  Criteria,
  Alternative,
  PairwiseComparison,
  University,
  UniversityAlternative, // TAMBAH INI
  UserPreference,
  RecommendationRun
};