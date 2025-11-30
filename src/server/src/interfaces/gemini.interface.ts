export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CVScoringPromptData {
  cvAnalysis: {
    extractedText: string;
    skills: string[];
    experience: string;
    education: string;
    keyPoints: string[];
  };
  job: {
    nameJob: string;
    companyName?: string;
    request: string;
    desc: string;
    experience?: string;
    education?: string;
    typeWork?: string;
  };
}

export interface GeminiCVScoringResponse {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  experienceMatch: string;
  educationMatch: string;
}
