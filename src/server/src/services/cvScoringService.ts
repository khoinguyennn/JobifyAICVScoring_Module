import { JobService } from './jobService';
import { GeminiService } from './geminiService';
import { DocumentParsingService } from './documentParsingService';
import { CVScoringRequest, CVScoringResult, CVAnalysis, JobWithDetails } from '@/types';
import { AppError } from '@/middlewares/errorHandler';

/**
 * CVScoringService - Logic chấm điểm CV với AI
 */
export class CVScoringService {
  private jobService: JobService;
  private geminiService: GeminiService;
  private documentService: DocumentParsingService;

  constructor() {
    this.jobService = new JobService();
    this.geminiService = new GeminiService();
    this.documentService = new DocumentParsingService();
  }

  /**
   * Chấm điểm CV thực tế với file upload
   */
  async scoreCV(request: CVScoringRequest): Promise<CVScoringResult> {
    try {
      // Get job details
      const job = await this.jobService.getJobById(request.jobId);
      if (!job) {
        throw new AppError('Không tìm thấy công việc', 404);
      }

      // Extract content from CV file using real parsing
      const cvAnalysis = await this.documentService.extractContent(request.cvFile);
      
      // Analyze CV using Gemini AI
      const scoringResult = await this.geminiService.scoreCVWithAI(cvAnalysis, job);
      
      // Cleanup temporary file
      await this.documentService.cleanupTempFile(request.cvFile.path);

      return scoringResult;
      
    } catch (error) {
      // Cleanup file in case of error
      await this.documentService.cleanupTempFile(request.cvFile.path);
      throw error;
    }
  }

  /**
   * Demo chấm điểm CV với dữ liệu giả lập
   */
  async demoScoreCV(jobId: number): Promise<CVScoringResult> {
    try {
      // Get job details
      const job = await this.jobService.getJobById(jobId);
      if (!job) {
        throw new AppError('Không tìm thấy công việc', 404);
      }

      // Create mock CV analysis based on job requirements
      const mockCVAnalysis = this.createMockCVForJob(job);

      // Use AI for demo scoring
      return await this.geminiService.scoreCVWithAI(mockCVAnalysis, job);
      
    } catch (error) {
      console.error('Error in demo scoring, falling back to mock data:', error);
      
      // Fallback to mock analysis if AI fails
      const job = await this.jobService.getJobById(jobId);
      const mockCVAnalysis = this.createMockCVForJob(job!);
      return await this.mockAnalyzeCV(mockCVAnalysis, job!);
    }
  }

  /**
   * Tạo mock CV analysis dựa trên job requirements
   */
  private createMockCVForJob(job: JobWithDetails): CVAnalysis {
    const jobSkills = this.extractJobSkills(job);
    
    // Create realistic mock CV that partially matches job
    const mockSkills = [
      ...jobSkills.slice(0, Math.ceil(jobSkills.length * 0.7)), // 70% matching skills
      'JavaScript', 'HTML', 'CSS', 'Communication', 'Teamwork'
    ];

    return {
      extractedText: `
        CV Demo - ${job.nameJob}
        
        Kinh nghiệm: 3 năm làm việc trong lĩnh vực ${job.field?.name || 'công nghệ thông tin'}.
        Đã tham gia phát triển nhiều dự án liên quan đến ${job.nameJob.toLowerCase()}.
        
        Kỹ năng chính: ${mockSkills.join(', ')}
        
        Học vấn: Cử nhân ${job.field?.name || 'Công nghệ thông tin'} - Đại học ABC
        
        Thành tích:
        - Hoàn thành 5+ dự án thành công
        - Làm việc nhóm hiệu quả
        - Học hỏi và cập nhật công nghệ mới
        
        Mục tiêu: Ứng tuyển vào vị trí ${job.nameJob} tại ${job.company?.nameCompany || 'công ty'}.
      `.trim(),
      skills: mockSkills,
      experience: `3 năm kinh nghiệm trong ${job.field?.name || 'IT'}. Đã làm việc với ${jobSkills.slice(0, 3).join(', ')}.`,
      education: `Cử nhân ${job.field?.name || 'Công nghệ thông tin'} - Đại học ABC`,
      keyPoints: [
        `Có kinh nghiệm với ${mockSkills.slice(0, 2).join(' và ')}`,
        'Khả năng làm việc nhóm tốt',
        'Luôn học hỏi công nghệ mới',
        'Hoàn thành dự án đúng deadline'
      ]
    };
  }

  /**
   * Phân tích CV fallback (khi AI không khả dụng)
   */
  private async mockAnalyzeCV(cvAnalysis: CVAnalysis, job: JobWithDetails): Promise<CVScoringResult> {
    // Extract job requirements
    const jobRequirements = this.extractJobSkills(job);
    
    // Calculate matching skills
    const matchingSkills = this.findMatchingSkills(cvAnalysis.skills, jobRequirements);
    const missingSkills = jobRequirements.filter(req => 
      !matchingSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
    );

    // Calculate base score
    let baseScore = 60; // Minimum score
    
    // Add points for matching skills
    baseScore += Math.min(matchingSkills.length * 5, 25);
    
    // Add points for relevant experience
    if (cvAnalysis.experience && cvAnalysis.experience.length > 0) {
      baseScore += 10;
    }
    
    // Add points for education
    if (cvAnalysis.education && cvAnalysis.education.length > 0) {
      baseScore += 5;
    }

    // Random variation to make it more realistic
    const finalScore = Math.min(Math.max(baseScore + Math.random() * 10 - 5, 50), 100);
    
    // Generate suggestions
    const suggestions = this.generateMockSuggestions(cvAnalysis, job, matchingSkills, missingSkills);
    
    // Generate analysis
    const analysis = {
      strengths: this.identifyStrengths(cvAnalysis, matchingSkills),
      weaknesses: this.identifyWeaknesses(cvAnalysis, missingSkills),
      matchingSkills,
      missingSkills: missingSkills.slice(0, 5) // Limit to 5 missing skills
    };

    return {
      score: Math.round(finalScore),
      suggestions,
      analysis,
      jobMatch: {
        jobTitle: job.nameJob,
        companyName: job.company?.nameCompany || "Công ty không xác định",
        requirements: jobRequirements
      }
    };
  }

  /**
   * Trích xuất kỹ năng từ job description
   */
  private extractJobSkills(job: JobWithDetails): string[] {
    const requirements: string[] = [];
    
    // Parse job requirements and description for skills
    const text = `${job.request} ${job.desc}`.toLowerCase();
    
    // Common tech skills to look for
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'php', 'go', 'rust',
      'react', 'vue', 'angular', 'node.js', 'express', 'spring', 'django', 'flask',
      'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'git', 'jenkins', 'ci/cd', 'agile', 'scrum',
      'html', 'css', 'sass', 'less', 'webpack', 'babel',
      'rest api', 'graphql', 'microservices', 'devops'
    ];

    commonSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        requirements.push(skill);
      }
    });

    // Add job-specific requirements based on job type and education
    if (job.typeWork) {
      requirements.push(job.typeWork);
    }
    
    if (job.education) {
      requirements.push(job.education);
    }

    return [...new Set(requirements)]; // Remove duplicates
  }

  /**
   * Tìm kỹ năng trùng khớp
   */
  private findMatchingSkills(cvSkills: string[], jobRequirements: string[]): string[] {
    const matching: string[] = [];
    
    cvSkills.forEach(cvSkill => {
      jobRequirements.forEach(jobReq => {
        if (cvSkill.toLowerCase().includes(jobReq.toLowerCase()) || 
            jobReq.toLowerCase().includes(cvSkill.toLowerCase())) {
          matching.push(cvSkill);
        }
      });
    });

    return [...new Set(matching)]; // Remove duplicates
  }

  /**
   * Tạo gợi ý cải thiện CV (mock)
   */
  private generateMockSuggestions(
    cvAnalysis: CVAnalysis, 
    job: JobWithDetails, 
    matchingSkills: string[], 
    missingSkills: string[]
  ): string[] {
    const suggestions: string[] = [];

    // Suggest missing skills
    if (missingSkills.length > 0) {
      suggestions.push(`Bổ sung kỹ năng: ${missingSkills.slice(0, 3).join(', ')}`);
    }

    // Experience suggestions
    if (!cvAnalysis.experience || cvAnalysis.experience.length < 50) {
      suggestions.push("Mô tả chi tiết hơn về kinh nghiệm làm việc với các con số và thành tích cụ thể");
    }

    // Education suggestions
    if (!cvAnalysis.education) {
      suggestions.push("Thêm thông tin về trình độ học vấn và các chứng chỉ liên quan");
    }

    // General suggestions
    suggestions.push("Tối ưu hóa format CV để dễ đọc và chuyên nghiệp hơn");
    suggestions.push("Thêm thông tin về các dự án đã thực hiện có liên quan đến vị trí ứng tuyển");

    if (matchingSkills.length < 3) {
      suggestions.push("Nâng cao các kỹ năng chuyên môn phù hợp với yêu cầu công việc");
    }

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  /**
   * Xác định điểm mạnh của CV
   */
  private identifyStrengths(cvAnalysis: CVAnalysis, matchingSkills: string[]): string[] {
    const strengths: string[] = [];

    if (matchingSkills.length > 0) {
      strengths.push(`Có kỹ năng phù hợp: ${matchingSkills.slice(0, 3).join(', ')}`);
    }

    if (cvAnalysis.experience && cvAnalysis.experience.length > 100) {
      strengths.push("Mô tả kinh nghiệm chi tiết");
    }

    if (cvAnalysis.skills.length > 5) {
      strengths.push("Danh sách kỹ năng đa dạng");
    }

    strengths.push("CV có cấu trúc rõ ràng");

    return strengths.slice(0, 4);
  }

  /**
   * Xác định điểm yếu của CV
   */
  private identifyWeaknesses(cvAnalysis: CVAnalysis, missingSkills: string[]): string[] {
    const weaknesses: string[] = [];

    if (missingSkills.length > 0) {
      weaknesses.push(`Thiếu kỹ năng quan trọng: ${missingSkills.slice(0, 2).join(', ')}`);
    }

    if (!cvAnalysis.experience || cvAnalysis.experience.length < 50) {
      weaknesses.push("Mô tả kinh nghiệm chưa chi tiết");
    }

    if (cvAnalysis.skills.length < 3) {
      weaknesses.push("Danh sách kỹ năng còn hạn chế");
    }

    return weaknesses.slice(0, 3);
  }

}




