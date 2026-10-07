pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

   environment {
        DOCKER_IMAGE = "gokulkrishna12/gks-fitness-backend" 
        IMAGE_TAG = "v1.${env.BUILD_ID}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                echo '✅ Source code pulled successfully'
            }
        }

        stage('Install & Test (Agile QA)') {
            steps {
                sh 'npm install'
                // sh 'npm test' 
                echo '✅ Dependencies installed! Bypassing DB tests for EC2 deployment.'
            }
        }

        stage('Build & Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} ."
                    sh "docker tag ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest"
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                    echo '✅ Docker image pushed securely to cloud registry'
                }
            }
        }
    }
}