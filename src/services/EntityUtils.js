/**
 * Utilitaires pour la gestion universelle des entités - VERSION CORRIGÉE
 */

/**
 * Génère un ID unique pour une entité selon son type
 */
export function generateEntityId(type, templateKey, instance = 0) {
  switch (type) {
    case 'player':
      return 'player'
    case 'companion':
      return `companion_${templateKey}`
    case 'enemy':
      return `enemy_${templateKey}_${instance}`
    default:
      throw new Error(`Type d'entité inconnu: ${type}`)
  }
}

/**
 * Obtient la clé de position standardisée pour une entité
 */
export function getEntityPositionKey(entity) {
  // Priorité à l'ID s'il existe
  if (entity.id) {
    return entity.id
  }
  
  // Fallback pour compatibilité
  if (entity.type === 'player') {
    return 'player'
  }
  
  // Utiliser le name comme dernière option
  return entity.name
}

/**
 * Crée une entité avec son ID unique
 */
export function createEntityWithId(type, templateKey, template, instance = 0) {
  const id = generateEntityId(type, templateKey, instance)
  
  return {
    ...template,
    id: id,
    type: type,
    templateKey: templateKey,
    instance: instance
  }
}

/**
 * Parse un ID d'entité pour extraire ses composants
 */
export function parseEntityId(entityId) {
  const parts = entityId.split('_')
  
  if (parts.length < 2) {
    return { type: 'unknown', templateKey: entityId, instance: 0 }
  }
  
  const type = parts[0]
  
  if (type === 'enemy' && parts.length >= 3) {
    const instance = parseInt(parts[parts.length - 1]) || 0
    const templateKey = parts.slice(1, -1).join('_')
    return { type, templateKey, instance }
  }
  
  const templateKey = parts.slice(1).join('_')
  return { type, templateKey, instance: 0 }
}

/**
 * Trouve une entité par son ID dans une liste
 */
export function findEntityById(entities, entityId) {
  return entities.find(entity => 
    getEntityPositionKey(entity) === entityId || 
    entity.id === entityId ||
    entity.name === entityId
  ) || null
}

/**
 * Debug : Affiche les clés de toutes les entités
 */
export function debugEntityKeys(entities, context = '') {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Debug Entity Keys - ${context}`)
    entities.forEach(entity => {
      console.log(`${entity.name}: ID=${entity.id}, Key=${getEntityPositionKey(entity)}`)
    })
    console.groupEnd()
  }
}