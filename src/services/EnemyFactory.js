/**
 * Factory pour la création d'ennemis dans les combats - VERSION CORRIGÉE
 */

import { enemyTemplates } from '../data/enemies';

export class EnemyFactory {
  /**
   * Crée les ennemis à partir des données de rencontre - CORRIGÉ
   */
  static createEnemiesFromEncounter(encounterData) {
    console.log('🏭 EnemyFactory.createEnemiesFromEncounter avec:', encounterData)
    
    if (!encounterData?.enemies?.length) {
      throw new Error('Aucun ennemi défini dans la rencontre');
    }

    const createdEnemies = []

    encounterData.enemies.forEach((encounter, encounterIndex) => {
      const template = enemyTemplates[encounter.type];
      
      if (!template) {
        console.error(`❌ Template non trouvé pour: ${encounter.type}`);
        return;
      }

      console.log(`👹 Création de ${encounter.count} ${encounter.type}(s)`)

      // Créer le nombre d'ennemis demandé
      for (let index = 0; index < encounter.count; index++) {
        const enemy = this.createEnemyFromTemplate(template, encounter, encounterIndex, index);
        createdEnemies.push(enemy);
        console.log(`✅ Ennemi créé:`, enemy.name, `ID: ${enemy.id}`)
      }
    });

    console.log('🏭 Ennemis créés au total:', createdEnemies.length)
    return createdEnemies
  }

  /**
   * Crée un ennemi individuel à partir d'un template - CORRIGÉ
   */
  static createEnemyFromTemplate(template, encounter, encounterIndex, index) {
    // Générer un ID unique et cohérent
    const enemyId = `enemy_${encounter.type}_${index}`
    const enemyName = encounter.count > 1 ? `${template.name} ${index + 1}` : template.name

    const enemy = {
      // Copier toutes les propriétés du template
      ...template,
      
      // Propriétés d'identification uniques
      id: enemyId,
      name: enemyName,
      type: 'enemy',
      templateKey: encounter.type,
      instance: index,
      
      // Propriétés de combat
      currentHP: template.currentHP ?? template.maxHP ?? 10,
      maxHP: template.maxHP ?? 10,
      ac: template.ac ?? 10,
      
      // Copier les stats et attaques
      stats: { ...template.stats },
      attacks: [...(template.attacks || [])],
      
      // Propriétés d'état
      isAlive: true,
      
      // Image
      image: template.image || ''
    }

    return enemy
  }

  /**
   * Valide les données d'une rencontre
   */
  static validateEncounterData(encounterData) {
    if (!encounterData || !Array.isArray(encounterData.enemies)) {
      return false;
    }

    return encounterData.enemies.every(encounter => {
      return encounter.type && 
             typeof encounter.count === 'number' && 
             encounter.count > 0 &&
             enemyTemplates[encounter.type];
    });
  }

  /**
   * Calcule la difficulté estimée d'une rencontre
   */
  static calculateEncounterDifficulty(encounterData) {
    if (!this.validateEncounterData(encounterData)) {
      return 0;
    }

    return encounterData.enemies.reduce((total, encounter) => {
      const template = enemyTemplates[encounter.type];
      const enemyDifficulty = (template.maxHP || 10) + (template.ac || 10);
      return total + (enemyDifficulty * encounter.count);
    }, 0);
  }
}

export default EnemyFactory;