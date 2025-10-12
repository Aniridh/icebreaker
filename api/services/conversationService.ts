import { ConversationStarter, conversationStarters, getQuestionsByCategory, getQuestionsByTags, getRandomQuestions } from '../data/conversationStarters.js';

export interface ConversationContext {
  profileData: {
    name?: string;
    title?: string;
    company?: string;
    industry?: string;
    skills?: string[];
    education?: string[];
    experience?: any[];
    location?: string;
  };
  previousQuestionIds?: number[];
  sessionId?: string;
}

export interface PersonalizedQuestion {
  originalQuestion: string;
  personalizedQuestion: string;
  category: string;
  subcategory: string;
  relevanceScore: number;
}

export class ConversationService {
  private static sessionQuestions: Map<string, number[]> = new Map();

  /**
   * Get diverse conversation starters with intelligent selection
   */
  static getDiverseQuestions(
    context: ConversationContext,
    count: number = 5
  ): PersonalizedQuestion[] {
    const { profileData, sessionId = 'default' } = context;
    
    // Get previously used questions for this session
    const usedQuestions = this.sessionQuestions.get(sessionId) || [];
    
    // Get questions from different categories to ensure variety
    const categoryDistribution = this.calculateCategoryDistribution(count);
    const selectedQuestions: ConversationStarter[] = [];
    
    // Select questions from each category
    for (const [category, categoryCount] of categoryDistribution) {
      const categoryQuestions = getQuestionsByCategory(category as ConversationStarter['category']);
      const availableQuestions = categoryQuestions.filter(q => !usedQuestions.includes(q.id));
      
      if (availableQuestions.length > 0) {
        // Prioritize questions based on profile relevance
        const relevantQuestions = this.rankQuestionsByRelevance(availableQuestions, profileData);
        const selected = relevantQuestions.slice(0, categoryCount);
        selectedQuestions.push(...selected);
      }
    }
    
    // If we don't have enough questions, fill with random ones
    if (selectedQuestions.length < count) {
      const remaining = count - selectedQuestions.length;
      const randomQuestions = getRandomQuestions(remaining, [
        ...usedQuestions,
        ...selectedQuestions.map(q => q.id)
      ]);
      selectedQuestions.push(...randomQuestions);
    }
    
    // Update session tracking
    const newQuestionIds = selectedQuestions.map(q => q.id);
    this.sessionQuestions.set(sessionId, [...usedQuestions, ...newQuestionIds]);
    
    // Personalize the questions
    return selectedQuestions.map(question => 
      this.personalizeQuestion(question, profileData)
    );
  }

  /**
   * Calculate how many questions to select from each category for variety
   */
  private static calculateCategoryDistribution(totalCount: number): Map<string, number> {
    const categories = ['career_background', 'soft_skills', 'personality_motivation'];
    const distribution = new Map<string, number>();
    
    // Distribute questions across categories
    const baseCount = Math.floor(totalCount / categories.length);
    const remainder = totalCount % categories.length;
    
    categories.forEach((category, index) => {
      const count = baseCount + (index < remainder ? 1 : 0);
      distribution.set(category, count);
    });
    
    return distribution;
  }

  /**
   * Rank questions by relevance to the profile data
   */
  private static rankQuestionsByRelevance(
    questions: ConversationStarter[],
    profileData: ConversationContext['profileData']
  ): ConversationStarter[] {
    return questions
      .map(question => ({
        question,
        relevanceScore: this.calculateRelevanceScore(question, profileData)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(item => item.question);
  }

  /**
   * Calculate relevance score based on profile data
   */
  private static calculateRelevanceScore(
    question: ConversationStarter,
    profileData: ConversationContext['profileData']
  ): number {
    let score = 0;
    const { title, company, industry, skills, experience } = profileData;
    
    // Score based on role/title relevance
    if (title) {
      if (question.tags.includes('leadership') && title.toLowerCase().includes('lead')) score += 3;
      if (question.tags.includes('management') && title.toLowerCase().includes('manager')) score += 3;
      if (question.tags.includes('technical') && (title.toLowerCase().includes('engineer') || title.toLowerCase().includes('developer'))) score += 3;
    }
    
    // Score based on industry relevance
    if (industry) {
      if (question.tags.includes('technology') && industry.toLowerCase().includes('tech')) score += 2;
      if (question.tags.includes('finance') && industry.toLowerCase().includes('finance')) score += 2;
    }
    
    // Score based on skills relevance
    if (skills && skills.length > 0) {
      const skillKeywords = ['python', 'javascript', 'management', 'leadership', 'data', 'analysis'];
      const hasRelevantSkills = skills.some(skill => 
        skillKeywords.some(keyword => skill.toLowerCase().includes(keyword))
      );
      if (hasRelevantSkills) {
        if (question.tags.includes('skills') || question.tags.includes('technical')) score += 2;
      }
    }
    
    // Score based on experience level
    if (experience && experience.length > 0) {
      const experienceYears = experience.length;
      if (experienceYears > 5 && question.tags.includes('senior')) score += 2;
      if (experienceYears < 3 && question.tags.includes('early_career')) score += 2;
    }
    
    // Add randomness to prevent always getting the same questions
    score += Math.random() * 2;
    
    return score;
  }

  /**
   * Personalize a question based on profile data
   */
  private static personalizeQuestion(
    question: ConversationStarter,
    profileData: ConversationContext['profileData']
  ): PersonalizedQuestion {
    const { name, title, company, skills, education } = profileData;
    let personalizedQuestion = question.question;
    
    // Add personal touches based on available data
    if (name && Math.random() > 0.5) {
      personalizedQuestion = `Hi ${name}! ${personalizedQuestion}`;
    }
    
    // Reference their role/company when relevant
    if (title && company && this.isRoleRelevant(question, title)) {
      personalizedQuestion = personalizedQuestion.replace(
        /your (work|job|role|career)/gi,
        `your work as ${title} at ${company}`
      );
    }
    
    // Reference their skills when relevant
    if (skills && skills.length > 0 && this.isSkillRelevant(question)) {
      const skillMention = skills.slice(0, 2).join(' and ');
      personalizedQuestion = personalizedQuestion.replace(
        /your skills/gi,
        `your expertise in ${skillMention}`
      );
    }
    
    // Reference their education when relevant
    if (education && education.length > 0 && this.isEducationRelevant(question)) {
      personalizedQuestion = personalizedQuestion.replace(
        /your background/gi,
        `your background from ${education[0]}`
      );
    }
    
    return {
      originalQuestion: question.question,
      personalizedQuestion,
      category: question.category,
      subcategory: question.subcategory,
      relevanceScore: this.calculateRelevanceScore(question, profileData)
    };
  }

  /**
   * Check if question is relevant to role/career
   */
  private static isRoleRelevant(question: ConversationStarter, title: string): boolean {
    const roleKeywords = ['work', 'job', 'role', 'career', 'professional'];
    return roleKeywords.some(keyword => 
      question.question.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if question is relevant to skills
   */
  private static isSkillRelevant(question: ConversationStarter): boolean {
    return question.tags.includes('skills') || 
           question.question.toLowerCase().includes('skill');
  }

  /**
   * Check if question is relevant to education
   */
  private static isEducationRelevant(question: ConversationStarter): boolean {
    return question.tags.includes('education') || 
           question.question.toLowerCase().includes('background') ||
           question.question.toLowerCase().includes('learn');
  }

  /**
   * Clear session questions (useful for testing or new sessions)
   */
  static clearSession(sessionId: string): void {
    this.sessionQuestions.delete(sessionId);
  }

  /**
   * Get questions by specific criteria for targeted conversations
   */
  static getTargetedQuestions(
    criteria: {
      category?: ConversationStarter['category'];
      tags?: string[];
      subcategory?: string;
    },
    context: ConversationContext,
    count: number = 3
  ): PersonalizedQuestion[] {
    let questions: ConversationStarter[] = [];
    
    if (criteria.category) {
      questions = getQuestionsByCategory(criteria.category);
    } else if (criteria.tags) {
      questions = getQuestionsByTags(criteria.tags);
    } else if (criteria.subcategory) {
      questions = conversationStarters.filter(q => q.subcategory === criteria.subcategory);
    }
    
    // Filter out previously used questions
    const sessionId = context.sessionId || 'default';
    const usedQuestions = this.sessionQuestions.get(sessionId) || [];
    const availableQuestions = questions.filter(q => !usedQuestions.includes(q.id));
    
    // Rank by relevance and select top questions
    const rankedQuestions = this.rankQuestionsByRelevance(availableQuestions, context.profileData);
    const selectedQuestions = rankedQuestions.slice(0, count);
    
    // Update session tracking
    const newQuestionIds = selectedQuestions.map(q => q.id);
    this.sessionQuestions.set(sessionId, [...usedQuestions, ...newQuestionIds]);
    
    return selectedQuestions.map(question => 
      this.personalizeQuestion(question, context.profileData)
    );
  }
}