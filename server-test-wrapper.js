// Test wrapper with standalone functions for testing

export class ForestServerTest {
  constructor() {
    this.dataDir = process.env.FOREST_DATA_DIR || '~/.forest-data';
    this.activeProject = null;
  }

  parseTime(timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }

  formatTime(minutes) {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    let hours12 = hours24;
    let ampm = 'AM';
    
    if (hours24 === 0) {
      hours12 = 12;
    } else if (hours24 === 12) {
      ampm = 'PM';
    } else if (hours24 > 12) {
      hours12 = hours24 - 12;
      ampm = 'PM';
    }
    
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  calculateKnowledgeBoost(credentials, goal) {
    if (!Array.isArray(credentials) || credentials.length === 0) {
      return { knowledgeLevel: 1, skillMappings: [] };
    }

    let totalBoost = 0;
    const skillMappings = [];

    for (const cred of credentials) {
      let credBoost = 0;
      
      if (cred.credential_type === "Bachelor's Degree") {
        credBoost = 30;
      } else if (cred.credential_type === "Master's Degree") {
        credBoost = 50;
      } else if (cred.credential_type === "PhD") {
        credBoost = 70;
      } else if (cred.credential_type === "Certification") {
        credBoost = 20;
      }

      if (cred.subject_area && goal.toLowerCase().includes(cred.subject_area.toLowerCase())) {
        credBoost *= 1.5;
      }

      totalBoost += credBoost;
      skillMappings.push({
        credential: cred.credential_type,
        subject: cred.subject_area,
        boost: credBoost
      });
    }

    const knowledgeLevel = Math.min(10, Math.max(1, Math.ceil(totalBoost / 25)));
    
    return { knowledgeLevel, skillMappings };
  }

  generateIntelligentBranches(goal, interests, credentials) {
    const branches = [];
    
    // Basic branch for fundamentals
    branches.push({
      id: 'fundamentals',
      title: `${goal} Fundamentals`,
      description: `Core concepts and basics of ${goal}`,
      difficulty: 3,
      estimatedHours: 20
    });

    // Interest-based branches
    if (interests && interests.length > 0) {
      interests.forEach((interest, index) => {
        branches.push({
          id: `interest_${index}`,
          title: `${interest} Focus`,
          description: `Specialized learning path for ${interest}`,
          difficulty: 4,
          estimatedHours: 15
        });
      });
    }

    // Credential-enhanced branches
    if (credentials && credentials.length > 0) {
      branches.push({
        id: 'advanced',
        title: `Advanced ${goal}`,
        description: `Leveraging existing knowledge for advanced concepts`,
        difficulty: 6,
        estimatedHours: 25
      });
    }

    return branches;
  }

  parseTimeAvailable(timeStr) {
    if (!timeStr) return { min: 60, max: 60 };
    
    const ranges = timeStr.match(/(\d+)-(\d+)\s*(\w+)/);
    if (ranges) {
      const min = parseInt(ranges[1]);
      const max = parseInt(ranges[2]);
      const unit = ranges[3].toLowerCase();
      
      const multiplier = unit.includes('hour') ? 60 : 1;
      return { min: min * multiplier, max: max * multiplier };
    }
    
    const single = timeStr.match(/(\d+)\s*(\w+)/);
    if (single) {
      const value = parseInt(single[1]);
      const unit = single[2].toLowerCase();
      const multiplier = unit.includes('hour') ? 60 : 1;
      const minutes = value * multiplier;
      return { min: minutes, max: minutes };
    }
    
    return { min: 60, max: 60 };
  }
}

export default ForestServerTest;