/**
 * Intelligent Question Selection Service
 * Uses Gemini AI with RAG approach to intelligently match conversation starters to LinkedIn profiles
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { conversationStarters, ConversationStarter } from '../data/conversationStarters.js'

interface ProfileContext {
  name?: string
  title?: string
  company?: string
  industry?: string
  skills?: string[]
  experience?: ExperienceDetail[]
  education?: EducationDetail[]
  yearsOfExperience?: number
  seniority?: 'entry' | 'mid' | 'senior' | 'executive'
  careerTransitions?: CareerTransition[]
  achievements?: string[]
  location?: string
  currentRole?: string
  previousRoles?: string[]
  keySkillsExpertise?: string[]
  industryExperience?: string[]
}

interface ExperienceDetail {
  company?: string
  title?: string
  duration?: string
  description?: string
  skills?: string[]
  startYear?: number
  endYear?: number
  industry?: string
}

interface EducationDetail {
  school?: string
  degree?: string
  field?: string
  startYear?: string
  endYear?: string
  achievements?: string[]
}

interface CareerTransition {
  from?: {
    role?: string
    company?: string
    industry?: string
  }
  to?: {
    role?: string
    company?: string
    industry?: string
  }
  timeframe?: string
  significance?: string
}

interface IntelligentQuestion {
  originalQuestion: string
  customizedQuestion: string
  relevanceScore: number
  reasoning: string
  category: string
  subcategory: string
}

export class IntelligentQuestionService {
  private static genAI: GoogleGenerativeAI | null = null

  private static initializeAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GOOGLE_API_KEY
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is not configured')
      }
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
    return this.genAI
  }

  /**
   * Get intelligently selected and customized questions for a LinkedIn profile
   */
  static async getIntelligentQuestions(
    profile: ProfileContext,
    count: number = 5
  ): Promise<IntelligentQuestion[]> {
    try {
      console.log('🧠 Starting intelligent question selection for:', profile.name)
      
      // Step 1: Analyze profile to determine context
      const profileAnalysis = this.analyzeProfile(profile)
      console.log('📊 Profile analysis:', profileAnalysis)

      // Step 2: Pre-filter questions based on profile context
      const relevantQuestions = this.preFilterQuestions(profile, profileAnalysis)
      console.log(`🎯 Pre-filtered to ${relevantQuestions.length} relevant questions`)

      // Step 3: Use Gemini AI to intelligently select and customize questions
      const intelligentQuestions = await this.selectAndCustomizeWithAI(
        profile, 
        profileAnalysis, 
        relevantQuestions, 
        count
      )

      console.log(`✨ Generated ${intelligentQuestions.length} intelligent questions`)
      return intelligentQuestions

    } catch (error) {
      console.error('❌ Error in intelligent question selection:', error)
      // Fallback to basic selection if AI fails
      return this.fallbackQuestionSelection(profile, count)
    }
  }

  /**
   * Analyze profile to extract key context for question matching
   */
  private static analyzeProfile(profile: ProfileContext): any {
    const analysis = {
      roleType: this.determineRoleType(profile.title),
      industryCategory: this.categorizeIndustry(profile.industry),
      seniorityLevel: this.determineSeniority(profile.title, profile.yearsOfExperience),
      skillAreas: this.categorizeSkills(profile.skills),
      companySize: this.estimateCompanySize(profile.company),
      careerStage: this.determineCareerStage(profile.experience, profile.yearsOfExperience),
      
      // Enhanced analysis for personalization
      careerTransitions: this.analyzeCareerTransitions(profile),
      uniqueExperiences: this.identifyUniqueExperiences(profile),
      educationalBackground: this.analyzeEducation(profile),
      industryExpertise: this.analyzeIndustryExpertise(profile),
      leadershipIndicators: this.identifyLeadershipIndicators(profile),
      technicalDepth: this.assessTechnicalDepth(profile),
      careerProgression: this.analyzeCareerProgression(profile)
    }

    return analysis
  }

  /**
   * Pre-filter questions based on profile context to reduce AI processing
   */
  private static preFilterQuestions(profile: ProfileContext, analysis: any): ConversationStarter[] {
    let filtered = [...conversationStarters]

    // Filter by role relevance
    if (analysis.roleType === 'technical') {
      filtered = filtered.filter(q => 
        q.tags.includes('technical') || 
        q.tags.includes('skills') || 
        q.category === 'career_background' ||
        q.category === 'personality_motivation'
      )
    } else if (analysis.roleType === 'management') {
      filtered = filtered.filter(q => 
        q.tags.includes('leadership') || 
        q.tags.includes('management') || 
        q.tags.includes('team') ||
        q.category === 'soft_skills'
      )
    }

    // Filter by seniority
    if (analysis.seniorityLevel === 'senior' || analysis.seniorityLevel === 'executive') {
      filtered = filtered.filter(q => 
        !q.tags.includes('early_career') &&
        (q.tags.includes('leadership') || q.tags.includes('mentorship') || q.tags.includes('strategy'))
      )
    } else if (analysis.seniorityLevel === 'entry') {
      filtered = filtered.filter(q => 
        q.tags.includes('learning') || 
        q.tags.includes('growth') || 
        q.tags.includes('early_career') ||
        q.category === 'career_background'
      )
    }

    // Ensure we have enough questions
    if (filtered.length < 20) {
      filtered = conversationStarters.slice(0, 50) // Fallback to first 50 questions
    }

    return filtered
  }

  /**
   * Use Gemini AI to intelligently select and customize questions
   */
  private static async selectAndCustomizeWithAI(
    profile: ProfileContext,
    analysis: any,
    candidateQuestions: ConversationStarter[],
    count: number
  ): Promise<IntelligentQuestion[]> {
    const genAI = this.initializeAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = this.createIntelligentSelectionPrompt(profile, analysis, candidateQuestions, count)
    
    console.log('🤖 Sending prompt to Gemini AI for intelligent question selection...')
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    console.log('📝 AI Response received:', response.substring(0, 200) + '...')
    
    return this.parseAIResponse(response, candidateQuestions)
  }

  /**
   * Create prompt for Gemini AI to select and customize questions
   */
  private static createIntelligentSelectionPrompt(
    profile: ProfileContext,
    analysis: any,
    questions: ConversationStarter[],
    count: number
  ): string {
    // Build detailed profile context with enhanced data
    const experienceDetails = profile.experience?.map(exp => 
      `${exp.title} at ${exp.company} (${exp.duration || 'Unknown duration'})`
    ).join(', ') || 'Not specified';
    
    const educationDetails = profile.education?.map(edu => 
      `${edu.degree} in ${edu.field} from ${edu.school}`
    ).join(', ') || 'Not specified';
    
    const careerPath = profile.careerTransitions?.map(transition => 
      `Transitioned from ${transition.from?.role} at ${transition.from?.company} to ${transition.to?.role} at ${transition.to?.company}`
    ).join('; ') || 'No major transitions identified';
    
    const keyAchievements = profile.achievements?.join(', ') || 'Not specified';
    const previousRoles = profile.previousRoles?.join(', ') || 'Not specified';
    const keyExpertise = profile.keySkillsExpertise?.join(', ') || 'Not specified';
    const industryExp = profile.industryExperience?.join(', ') || 'Not specified';
    
    // Enhanced profile data from comprehensive scraping
    const careerProgression = (profile as any).careerProgression;
    const skillCategories = (profile as any).skillCategories;
    const personalityTraits = (profile as any).personalityTraits;
    const professionalGoals = (profile as any).professionalGoals;
    const leadershipStyle = (profile as any).leadershipStyle;
    const workPreferences = (profile as any).workPreferences;
    const projects = (profile as any).projects;
    const achievements = (profile as any).achievements;

    return `You are an expert conversation starter curator specializing in creating deeply personalized questions. Your task is to craft questions that feel like they come from someone who has thoroughly researched this person's unique professional journey.

DETAILED PROFILE ANALYSIS:
=========================
BASIC INFO:
- Name: ${profile.name || 'Unknown'}
- Current Title: ${profile.title || 'Unknown'}
- Current Company: ${profile.company || 'Unknown'}
- Industry: ${profile.industry || 'Unknown'}
- Location: ${profile.location || 'Unknown'}
- Years of Experience: ${profile.yearsOfExperience || 'Unknown'}

CAREER JOURNEY:
- Current Role: ${profile.currentRole || profile.title || 'Unknown'}
- Previous Roles: ${previousRoles}
- Experience History: ${experienceDetails}
- Career Transitions: ${careerPath}

EDUCATION & EXPERTISE:
- Education: ${educationDetails}
- Core Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Key Expertise Areas: ${keyExpertise}
- Industry Experience: ${industryExp}
- Notable Achievements: ${keyAchievements}

ENHANCED PROFILE INSIGHTS:
${careerProgression ? `
CAREER PROGRESSION:
- Career Level: ${careerProgression.careerLevel}
- Total Years: ${careerProgression.totalYears}
- Growth Pattern: ${careerProgression.careerGrowthPattern}
- Leadership Progression: ${careerProgression.leadershipProgression ? 'Yes' : 'No'}
- Industry Changes: ${careerProgression.industryChanges}
` : ''}

${skillCategories ? `
SKILL CATEGORIES:
${skillCategories.map((cat: any) => `- ${cat.category}: ${cat.skills.join(', ')} (${cat.proficiencyLevel})`).join('\n')}
` : ''}

${personalityTraits ? `
PERSONALITY TRAITS: ${personalityTraits.join(', ')}
` : ''}

${leadershipStyle ? `
LEADERSHIP STYLE: ${leadershipStyle}
` : ''}

${professionalGoals ? `
PROFESSIONAL GOALS: ${professionalGoals.join(', ')}
` : ''}

${workPreferences ? `
WORK PREFERENCES:
- Work Style: ${workPreferences.workStyle?.join(', ') || 'Not specified'}
- Team Size: ${workPreferences.teamSize || 'Not specified'}
- Communication: ${workPreferences.communicationPreference?.join(', ') || 'Not specified'}
` : ''}

${projects ? `
KEY PROJECTS:
${projects.map((proj: any) => `- ${proj.name}: ${proj.description} (Role: ${proj.role})`).join('\n')}
` : ''}

${achievements ? `
SPECIFIC ACHIEVEMENTS:
${achievements.map((ach: any) => `- ${ach.title}: ${ach.description}${ach.metrics ? ` (${ach.metrics})` : ''}`).join('\n')}
` : ''}

PROFILE ANALYSIS:
- Role Type: ${analysis.roleType}
- Seniority Level: ${analysis.seniorityLevel}
- Industry Category: ${analysis.industryCategory}
- Career Stage: ${analysis.careerStage || 'Unknown'}

AVAILABLE QUESTIONS:
${questions.map(q => `ID: ${q.id} | Question: "${q.question}" | Category: ${q.category} | Tags: ${q.tags.join(', ')}`).join('\n')}

CRITICAL PERSONALIZATION REQUIREMENTS:
=====================================
You MUST create questions that are ULTRA-SPECIFIC and demonstrate deep research. Each question should:

1. **Reference Specific Companies by Name**: Always mention their actual employers
   - Example: "During your time at Google..." or "In your transition from Microsoft to Stripe..."

2. **Use Exact Job Titles**: Never use generic titles - use their precise roles
   - Example: "As a Senior Product Manager" not "in your management role"

3. **Include Educational Background**: Reference their specific schools and degrees
   - Example: "With your Stanford MBA..." or "Given your MIT computer science background..."

4. **Mention Specific Skills/Technologies**: Reference their exact expertise areas
   - Example: "Given your expertise in machine learning and Python..." 

5. **Reference Career Transitions**: Highlight their unique career path
   - Example: "Your transition from engineering to product management at..."

6. **Include Industry Context**: Show understanding of their specific industry challenges
   - Example: "In the fintech space at Robinhood..." or "Working in enterprise SaaS at Salesforce..."

7. **Reference Years of Experience**: Be specific about their experience level
   - Example: "With your 8 years in software development..." 

ENHANCED PERSONALIZATION EXAMPLES:
=================================
INSTEAD OF: "How do you stay current in your field?"
CREATE: "Given your transition from software engineering at Google to product management at Stripe, how do you stay current with both technical trends and product strategy in the fintech space?"

INSTEAD OF: "What's your biggest professional challenge?"
CREATE: "As a Stanford CS graduate who moved into fintech leadership at Robinhood, what's been your biggest challenge in bridging technical expertise with financial services regulation?"

INSTEAD OF: "Tell me about your leadership style"
CREATE: "Having led engineering teams at both Microsoft and your current role as VP of Engineering at Airbnb, how has your leadership approach evolved when managing distributed teams in the travel tech industry?"

MANDATORY PERSONALIZATION CHECKLIST:
===================================
Each question MUST include at least 3 of these elements:
✓ Specific company name(s)
✓ Exact job title or role
✓ Educational institution or degree
✓ Specific skills or technologies
✓ Industry context
YOUR TASK:
=========
Select ${count} questions from the available options and transform them into ULTRA-PERSONALIZED conversation starters that:

1. **Feel Genuinely Researched**: Each question should sound like it comes from someone who spent time studying their LinkedIn profile
2. **Reference Specific Details**: Include actual company names, job titles, schools, skills, or achievements
3. **Show Deep Understanding**: Demonstrate knowledge of their unique professional context and journey
4. **Encourage Meaningful Responses**: Ask questions that will elicit insights about their distinct perspective and experiences
5. **Demonstrate Genuine Interest**: Show authentic curiosity about their specific expertise and career path

MANDATORY REQUIREMENTS FOR EACH QUESTION:
========================================
✓ Must include at least 2-3 specific details from their profile (companies, roles, schools, skills)
✓ Must reference their unique career journey or transitions
✓ Must show understanding of their industry context
✓ Must feel personally crafted, not generic
✓ Must encourage reflection on their distinct professional story

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "questionId": 123,
      "originalQuestion": "Original generic question",
      "customizedQuestion": "Ultra-personalized question with specific profile references",
      "relevanceScore": 95,
      "reasoning": "Detailed explanation of why this question perfectly matches their unique background and will elicit meaningful insights about their distinct journey"
    }
  ]
}

CRITICAL SUCCESS CRITERIA:
=========================
Each customized question MUST feel like it was written by someone who:
- Thoroughly researched their LinkedIn profile
- Understands their specific industry and role
- Recognizes their unique career path and achievements
- Is genuinely interested in their professional story
- Wants to learn from their distinct perspective and experiences

Remember: Generic questions are UNACCEPTABLE. Every question must be deeply personalized with specific details from their profile.`
  }

  /**
   * Parse AI response and create IntelligentQuestion objects
   */
  private static parseAIResponse(response: string, candidateQuestions: ConversationStarter[]): IntelligentQuestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      const questions: IntelligentQuestion[] = []

      for (const q of parsed.questions || []) {
        const originalQuestion = candidateQuestions.find(cq => cq.id === q.questionId)
        if (originalQuestion) {
          questions.push({
            originalQuestion: originalQuestion.question,
            customizedQuestion: q.customizedQuestion,
            relevanceScore: q.relevanceScore || 80,
            reasoning: q.reasoning || 'AI selected as relevant',
            category: originalQuestion.category,
            subcategory: originalQuestion.subcategory
          })
        }
      }

      return questions
    } catch (error) {
      console.error('Error parsing AI response:', error)
      throw error
    }
  }

  /**
   * Fallback question selection if AI fails
   */
  private static fallbackQuestionSelection(profile: ProfileContext, count: number): IntelligentQuestion[] {
    console.log('🔄 Using fallback question selection')
    
    const questions = conversationStarters
      .slice(0, count * 2)
      .sort(() => 0.5 - Math.random())
      .slice(0, count)

    return questions.map(q => ({
      originalQuestion: q.question,
      customizedQuestion: this.basicCustomization(q.question, profile),
      relevanceScore: 70,
      reasoning: 'Fallback selection',
      category: q.category,
      subcategory: q.subcategory
    }))
  }

  /**
   * Basic question customization for fallback
   */
  private static basicCustomization(question: string, profile: ProfileContext): string {
    let customized = question

    // Enhanced customization with specific profile details
    if (profile.industry) {
      customized = customized.replace(/your industry/gi, `your ${profile.industry} industry`)
      customized = customized.replace(/the industry/gi, `the ${profile.industry} industry`)
    }
    
    if (profile.title && profile.company) {
      customized = customized.replace(/your role/gi, `your role as ${profile.title} at ${profile.company}`)
      customized = customized.replace(/your position/gi, `your position as ${profile.title} at ${profile.company}`)
      customized = customized.replace(/your job/gi, `your role as ${profile.title}`)
    }

    // Add specific company references
    if (profile.company) {
      customized = customized.replace(/your company/gi, `${profile.company}`)
      customized = customized.replace(/at work/gi, `at ${profile.company}`)
    }

    // Add educational context if available
    if (profile.education && profile.education.length > 0) {
      const primaryEducation = profile.education[0]
      if (primaryEducation.school && primaryEducation.degree) {
        customized = customized.replace(/your education/gi, `your ${primaryEducation.degree} from ${primaryEducation.school}`)
        customized = customized.replace(/your background/gi, `your background with a ${primaryEducation.degree} from ${primaryEducation.school}`)
      }
    }

    // Add experience-specific references
    if (profile.yearsOfExperience) {
      customized = customized.replace(/your experience/gi, `your ${profile.yearsOfExperience} years of experience`)
    }

    // Add skill-specific references
    if (profile.keySkillsExpertise && profile.keySkillsExpertise.length > 0) {
      const topSkills = profile.keySkillsExpertise.slice(0, 2).join(' and ')
      customized = customized.replace(/your skills/gi, `your expertise in ${topSkills}`)
      customized = customized.replace(/your expertise/gi, `your expertise in ${topSkills}`)
    }

    // Add previous role context for career progression questions
    if (profile.previousRoles && profile.previousRoles.length > 0) {
      const previousRole = profile.previousRoles[profile.previousRoles.length - 1]
      customized = customized.replace(/your previous role/gi, `your previous role as ${previousRole}`)
      customized = customized.replace(/your career/gi, `your career progression from ${previousRole} to ${profile.title || 'your current role'}`)
    }

    return customized
  }

  // Helper methods for profile analysis
  private static determineRoleType(title?: string): string {
    if (!title) return 'general'
    
    const titleLower = title.toLowerCase()
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('devops')) {
      return 'technical'
    } else if (titleLower.includes('manager') || titleLower.includes('director') || titleLower.includes('lead')) {
      return 'management'
    } else if (titleLower.includes('sales') || titleLower.includes('marketing')) {
      return 'business'
    }
    return 'general'
  }

  private static categorizeIndustry(industry?: string): string {
    if (!industry) return 'general'
    
    const industryLower = industry.toLowerCase()
    if (industryLower.includes('tech') || industryLower.includes('software')) {
      return 'technology'
    } else if (industryLower.includes('finance') || industryLower.includes('banking')) {
      return 'finance'
    } else if (industryLower.includes('health') || industryLower.includes('medical')) {
      return 'healthcare'
    }
    return 'general'
  }

  private static determineSeniority(title?: string, yearsOfExperience?: number): string {
    if (yearsOfExperience) {
      if (yearsOfExperience < 3) return 'entry'
      if (yearsOfExperience < 7) return 'mid'
      if (yearsOfExperience < 12) return 'senior'
      return 'executive'
    }

    if (title) {
      const titleLower = title.toLowerCase()
      if (titleLower.includes('junior') || titleLower.includes('associate')) return 'entry'
      if (titleLower.includes('senior') || titleLower.includes('lead')) return 'senior'
      if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('chief')) return 'executive'
    }

    return 'mid'
  }

  private static categorizeSkills(skills?: string[]): string[] {
    if (!skills) return []
    
    const categories = []
    const skillsLower = skills.map(s => s.toLowerCase())
    
    if (skillsLower.some(s => s.includes('python') || s.includes('javascript') || s.includes('java'))) {
      categories.push('programming')
    }
    if (skillsLower.some(s => s.includes('aws') || s.includes('cloud') || s.includes('docker'))) {
      categories.push('cloud')
    }
    if (skillsLower.some(s => s.includes('management') || s.includes('leadership'))) {
      categories.push('leadership')
    }
    
    return categories
  }

  private static estimateCompanySize(company?: string): string {
    // This could be enhanced with a company database
    if (!company) return 'unknown'
    return 'medium' // Default assumption
  }

  private static determineCareerStage(experience?: any[], yearsOfExperience?: number): string {
    if (yearsOfExperience) {
      if (yearsOfExperience < 2) return 'early'
      if (yearsOfExperience < 5) return 'mid'
      if (yearsOfExperience < 10) return 'senior'
      return 'executive'
    }
    return 'unknown'
  }

  /**
   * Analyze career transitions for personalization
   */
  private static analyzeCareerTransitions(profile: ProfileContext): any {
    if (!profile.careerTransitions || profile.careerTransitions.length === 0) {
      return {
        hasTransitions: false,
        transitionCount: 0,
        significantTransitions: []
      }
    }

    const significantTransitions = profile.careerTransitions.filter(t => 
      t.significance === 'major' || 
      (t.from?.industry !== t.to?.industry) ||
      (t.from?.role && t.to?.role && !t.from.role.toLowerCase().includes(t.to.role.toLowerCase().split(' ')[0]))
    )

    return {
      hasTransitions: true,
      transitionCount: profile.careerTransitions.length,
      significantTransitions,
      industryChanges: profile.careerTransitions.filter(t => t.from?.industry !== t.to?.industry),
      roleEvolution: profile.careerTransitions.map(t => ({
        from: t.from?.role,
        to: t.to?.role,
        timeframe: t.timeframe
      }))
    }
  }

  /**
   * Identify unique experiences for personalization
   */
  private static identifyUniqueExperiences(profile: ProfileContext): any {
    const uniqueAspects = []
    
    // Check for notable companies
    const notableCompanies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla', 'Stripe', 'Uber', 'Airbnb']
    const hasNotableCompany = profile.experience?.some(exp => 
      notableCompanies.some(company => exp.company?.toLowerCase().includes(company.toLowerCase()))
    )
    
    if (hasNotableCompany) {
      uniqueAspects.push('notable_company_experience')
    }

    // Check for startup experience
    const hasStartupExperience = profile.experience?.some(exp => 
      exp.description?.toLowerCase().includes('startup') || 
      exp.company?.toLowerCase().includes('startup')
    )
    
    if (hasStartupExperience) {
      uniqueAspects.push('startup_experience')
    }

    // Check for international experience
     const hasInternationalExp = profile.location && profile.location.toLowerCase() && !profile.location.toLowerCase().includes('united states')
     if (hasInternationalExp) {
       uniqueAspects.push('international_experience')
     }

    return {
      uniqueAspects,
      notableCompanies: profile.experience?.filter(exp => 
        notableCompanies.some(company => exp.company?.toLowerCase().includes(company.toLowerCase()))
      ).map(exp => exp.company) || [],
      diverseIndustries: profile.experience ? [...new Set(profile.experience.map(exp => exp.industry).filter(Boolean))] : []
    }
  }

  /**
   * Analyze educational background
   */
  private static analyzeEducation(profile: ProfileContext): any {
    if (!profile.education || profile.education.length === 0) {
      return {
        hasEducation: false,
        level: 'unknown'
      }
    }

    const topSchools = ['Stanford', 'MIT', 'Harvard', 'Berkeley', 'Carnegie Mellon', 'Caltech', 'Princeton', 'Yale']
    const hasTopSchool = profile.education.some(edu => 
      edu.school && topSchools.some(school => edu.school.toLowerCase().includes(school.toLowerCase()))
    )

    const degrees = profile.education.map(edu => edu.degree?.toLowerCase() || '')
    const hasAdvancedDegree = degrees.some(degree => 
      degree.includes('master') || degree.includes('phd') || degree.includes('mba')
    )

    return {
      hasEducation: true,
      hasTopSchool,
      hasAdvancedDegree,
      topSchools: profile.education.filter(edu => 
        topSchools.some(school => edu.school?.toLowerCase().includes(school.toLowerCase()))
      ),
      fields: profile.education.map(edu => edu.field).filter(Boolean),
      level: hasAdvancedDegree ? 'advanced' : 'undergraduate'
    }
  }

  /**
   * Analyze industry expertise
   */
  private static analyzeIndustryExpertise(profile: ProfileContext): any {
    const industries = profile.industryExperience || []
    const currentIndustry = profile.industry

    return {
      primaryIndustry: currentIndustry,
      industryCount: industries.length,
      isCrossIndustry: industries.length > 2,
      specializations: profile.keySkillsExpertise || [],
      domainExpertise: this.identifyDomainExpertise(profile)
    }
  }

  /**
   * Identify leadership indicators
   */
  private static identifyLeadershipIndicators(profile: ProfileContext): any {
    const title = profile.title?.toLowerCase() || ''
    const previousRoles = profile.previousRoles?.map(role => role.toLowerCase()) || []
    
    const leadershipKeywords = ['manager', 'director', 'vp', 'ceo', 'cto', 'lead', 'head', 'chief', 'senior']
    const hasLeadershipTitle = leadershipKeywords.some(keyword => title.includes(keyword))
    const hasLeadershipHistory = previousRoles.some(role => 
      leadershipKeywords.some(keyword => role.includes(keyword))
    )

    return {
      hasLeadershipRole: hasLeadershipTitle,
      hasLeadershipHistory,
      leadershipProgression: hasLeadershipHistory && hasLeadershipTitle,
      teamSize: this.estimateTeamSize(profile),
      managementLevel: this.determineManagementLevel(title)
    }
  }

  /**
   * Assess technical depth
   */
  private static assessTechnicalDepth(profile: ProfileContext): any {
    const skills = profile.skills?.map(skill => skill.toLowerCase()) || []
    const keyExpertise = profile.keySkillsExpertise?.map(skill => skill.toLowerCase()) || []
    
    const technicalSkills = [...skills, ...keyExpertise].filter(skill => 
      skill.includes('programming') || skill.includes('software') || skill.includes('development') ||
      skill.includes('python') || skill.includes('javascript') || skill.includes('java') ||
      skill.includes('aws') || skill.includes('cloud') || skill.includes('devops') ||
      skill.includes('machine learning') || skill.includes('ai') || skill.includes('data')
    )

    return {
      isTechnical: technicalSkills.length > 0,
      technicalSkillCount: technicalSkills.length,
      technicalDepth: technicalSkills.length > 5 ? 'deep' : technicalSkills.length > 2 ? 'moderate' : 'basic',
      specializations: technicalSkills
    }
  }

  /**
   * Analyze career progression
   */
  private static analyzeCareerProgression(profile: ProfileContext): any {
    const experience = profile.experience || []
    if (experience.length < 2) {
      return {
        hasProgression: false,
        progressionType: 'unknown'
      }
    }

    // Sort by start year if available
    const sortedExp = experience.sort((a, b) => (a.startYear || 0) - (b.startYear || 0))
    
    const titleProgression = sortedExp.map(exp => exp.title).filter(Boolean)
    const companyProgression = sortedExp.map(exp => exp.company).filter(Boolean)

    return {
      hasProgression: true,
      titleProgression,
      companyProgression,
      progressionType: this.determineProgressionType(titleProgression),
      careerArc: this.analyzeCareerArc(sortedExp)
    }
  }

  /**
   * Helper methods for enhanced analysis
   */
  private static identifyDomainExpertise(profile: ProfileContext): string[] {
    const expertise = []
    const skills = (profile.skills || []).concat(profile.keySkillsExpertise || [])
    
    if (skills.some(s => s.toLowerCase().includes('fintech') || s.toLowerCase().includes('finance'))) {
      expertise.push('fintech')
    }
    if (skills.some(s => s.toLowerCase().includes('healthcare') || s.toLowerCase().includes('medical'))) {
      expertise.push('healthcare')
    }
    if (skills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('machine learning'))) {
      expertise.push('ai_ml')
    }
    
    return expertise
  }

  private static estimateTeamSize(profile: ProfileContext): string {
    const title = profile.title?.toLowerCase() || ''
    if (title.includes('senior manager') || title.includes('director')) return 'large'
    if (title.includes('manager') || title.includes('lead')) return 'medium'
    return 'small'
  }

  private static determineManagementLevel(title: string): string {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('vp')) return 'executive'
    if (titleLower.includes('director') || titleLower.includes('senior manager')) return 'senior'
    if (titleLower.includes('manager') || titleLower.includes('lead')) return 'mid'
    return 'individual_contributor'
  }

  private static determineProgressionType(titles: string[]): string {
    if (titles.length < 2) return 'unknown'
    
    const hasManagerialProgression = titles.some(title => 
      title.toLowerCase().includes('manager') || title.toLowerCase().includes('director')
    )
    
    if (hasManagerialProgression) return 'managerial'
    
    const hasSeniorProgression = titles.some(title => title.toLowerCase().includes('senior'))
    if (hasSeniorProgression) return 'technical_senior'
    
    return 'lateral'
  }

  private static analyzeCareerArc(experiences: any[]): string {
    if (experiences.length < 2) return 'early'
    
    const companies = experiences.map(exp => exp.company).filter(Boolean)
    const uniqueCompanies = new Set(companies)
    
    if (uniqueCompanies.size === 1) return 'company_loyal'
    if (uniqueCompanies.size > experiences.length * 0.8) return 'company_hopper'
    return 'strategic_mover'
  }
}