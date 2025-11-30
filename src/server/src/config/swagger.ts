import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jobify API',
      version: '1.0.0',
      description: 'API Documentation cho hệ thống tìm việc làm Jobify',
      contact: {
        name: 'Jobify Team',
        email: 'support@jobify.vn',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}${process.env.API_PREFIX || '/api'}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', example: 'user@example.com' },
            phone: { type: 'string', example: '0123456789' },
            idProvince: { type: 'integer', example: 1 },
            avatarPic: { type: 'string', example: 'avatars/avatar-1-550e8400-e29b-41d4-a716-446655440000.jpg' },
            birthDay: { type: 'string', format: 'date', example: '1990-01-01' },
            intro: { type: 'string', example: 'Giới thiệu bản thân' },
            linkSocial: { type: 'string', example: 'https://facebook.com/user' },
            sex: { type: 'string', enum: ['Nam', 'Nữ', 'Khác'], example: 'Nam' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nameCompany: { type: 'string', example: 'Công ty ABC' },
            nameAdmin: { type: 'string', example: 'Nguyễn Văn B' },
            email: { type: 'string', example: 'company@example.com' },
            phone: { type: 'string', example: '0123456789' },
            idProvince: { type: 'integer', example: 1 },
            avatarPic: { type: 'string', example: 'logos/avatar-2-550e8400-e29b-41d4-a716-446655440000.png' },
            intro: { type: 'string', example: 'Giới thiệu công ty' },
            scale: { type: 'string', example: '100-500 người' },
            web: { type: 'string', example: 'https://company.com' },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            idCompany: { type: 'integer', example: 1 },
            idField: { type: 'integer', example: 1 },
            idProvince: { type: 'integer', example: 1 },
            nameJob: { type: 'string', example: 'Lập trình viên React' },
            request: { type: 'string', example: 'Yêu cầu công việc' },
            desc: { type: 'string', example: 'Mô tả công việc' },
            other: { type: 'string', example: 'Thông tin khác' },
            salaryMin: { type: 'integer', example: 10000000 },
            salaryMax: { type: 'integer', example: 20000000 },
            sex: { type: 'string', enum: ['Nam', 'Nữ', 'Không yêu cầu'], example: 'Không yêu cầu' },
            typeWork: { type: 'string', example: 'Toàn thời gian' },
            education: { type: 'string', example: 'Đại học' },
            experience: { type: 'string', example: '2-5 năm' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Thành công' },
            error: { type: 'string', example: 'Lỗi xảy ra' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                data: { type: 'array', items: {} },
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 10 },
              },
            },
            message: { type: 'string', example: 'Lấy dữ liệu thành công' },
          },
        },
        SaveJob: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            idUser: { type: 'integer', example: 1 },
            idJob: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' },
          },
        },
        SaveJobWithDetails: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            idUser: { type: 'integer', example: 1 },
            idJob: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' },
            job: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                nameJob: { type: 'string', example: 'Lập trình viên React' },
                desc: { type: 'string', example: 'Mô tả công việc' },
                salaryMin: { type: 'integer', example: 10000000 },
                salaryMax: { type: 'integer', example: 20000000 },
                typeWork: { type: 'string', example: 'Toàn thời gian' },
                education: { type: 'string', example: 'Đại học' },
                experience: { type: 'string', example: '2-5 năm' },
                createdAt: { type: 'string', format: 'date-time' },
                company: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    nameCompany: { type: 'string', example: 'Công ty ABC' },
                    avatarPic: { type: 'string', example: 'logos/avatar-2-550e8400-e29b-41d4-a716-446655440000.png' },
                    scale: { type: 'string', example: '100-500 người' },
                    web: { type: 'string', example: 'https://company.com' },
                  },
                },
                field: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Công nghệ thông tin' },
                    typeField: { type: 'string', example: 'IT' },
                  },
                },
                province: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Hà Nội' },
                    nameWithType: { type: 'string', example: 'Thành phố Hà Nội' },
                  },
                },
                appliedCount: { type: 'integer', example: 5 },
                isSaved: { type: 'boolean', example: true },
              },
            },
          },
        },
        FollowCompany: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            idUser: { type: 'integer', example: 1 },
            idCompany: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' },
          },
        },
        FollowCompanyWithDetails: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            idUser: { type: 'integer', example: 1 },
            idCompany: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' },
            company: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                nameCompany: { type: 'string', example: 'Công ty ABC' },
                nameAdmin: { type: 'string', example: 'Nguyễn Văn B' },
                email: { type: 'string', example: 'company@example.com' },
                avatarPic: { type: 'string', example: 'logos/avatar-2-550e8400-e29b-41d4-a716-446655440000.png' },
                phone: { type: 'string', example: '0123456789' },
                idProvince: { type: 'integer', example: 1 },
                intro: { type: 'string', example: 'Giới thiệu công ty' },
                scale: { type: 'string', example: '100-500 người' },
                web: { type: 'string', example: 'https://company.com' },
                province: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Hà Nội' },
                    nameWithType: { type: 'string', example: 'Thành phố Hà Nội' },
                  },
                },
                jobCount: { type: 'integer', example: 15 },
                isFollowed: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

// Generate Swagger spec
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Setup Swagger UI
export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { 
        background-color: #000000; 
        padding: 10px;
      }
      .swagger-ui .topbar .download-url-wrapper { 
        display: none; 
      }
      .swagger-ui .info .title {
        color: #000000;
        font-size: 2rem;
        font-weight: bold;
      }
      .swagger-ui .info .description {
        color: #374151;
      }
    `,
    customSiteTitle: 'Jobify API Documentation',
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    }
  }));

  // Serve swagger.json
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger UI đã được setup tại: /api-docs');
};




