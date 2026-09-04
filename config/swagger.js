const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GK\'s Fitness Shop API',
            version: '1.0.0',
            description: 'API documentation for the AI-Powered Fitness E-Commerce Platform',
        },
        servers: [
            {
                url: process.env.SWAGGER_URL || 'http://localhost:5000',
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
        },
    },
    apis: ['./routes/*.js', './models/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsDoc(options);

module.exports = specs;