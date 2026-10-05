pipeline {
    agent any

    // This tells Jenkins to inject the Node.js environment we just configured
    tools {
        nodejs 'Node20'
    }

    environment {
        // Defines the Docker image tag based on the Jenkins build number
        IMAGE_NAME = "gks-fitness-backend"
        IMAGE_TAG = "v1.${env.BUILD_ID}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Pulls the latest code from your main branch
                checkout scm
                echo '✅ Source code pulled successfully'
            }
        }

        stage('Install & Test (Agile QA)') {
            steps {
                // Installs dependencies and runs the 3 Jest tests you wrote
                sh 'npm install'
                sh 'npm test'
                echo '✅ All Jest integration tests passed!'
            }
        }

        stage('Build Docker Image') {
            steps {
                // Builds the container using your existing Dockerfile
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
                echo '✅ Docker image built securely'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Triggers Kubernetes to update the pods with the new image
                sh "kubectl apply -f k8s-deployment.yaml"
                sh "kubectl set image deployment/gks-backend-deployment api=${IMAGE_NAME}:latest"
                echo '🚀 Deployed to Kubernetes successfully!'
            }
        }
    }
}