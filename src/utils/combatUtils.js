/**
 * Utilitaires pour le combat - VERSION SIMPLIFIÉE
 */

/**
 * Obtient la clé de position pour une entité dans le combat
 */
export const getEntityPositionKey = (entity) => {
  if (entity.id) {
    return entity.id;
  }
  
  if (entity.type === 'player') {
    return 'player';
  }
  
  return entity.name;
};

/**
 * Calcule la distance D&D entre deux positions (diagonales = 1 case)
 */
export const getDnDDistance = (pos1, pos2) => {
  if (!pos1 || !pos2) return Infinity;
  return Math.max(Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y));
};

/**
 * Vérifie si une entité peut agir (vivante et consciente)
 */
export const canEntityAct = (entity) => {
  if (!entity) return false;
  if (entity.currentHP <= 0) return false;
  if (entity.conditions?.includes('unconscious')) return false;
  return true;
};

/**
 * Formate un message de mouvement pour le combat log
 */
export const formatMovementMessage = (entityName, distance) => {
  if (distance === 0) {
    return `${entityName} reste en position.`;
  }
  
  const unit = distance === 1 ? 'case' : 'cases';
  return `🏃 ${entityName} se déplace de ${distance} ${unit}.`;
};

export default {
  getEntityPositionKey,
  getDnDDistance,
  canEntityAct,
  formatMovementMessage
};