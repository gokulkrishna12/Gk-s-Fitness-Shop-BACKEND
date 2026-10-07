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
                // 🔥 Tests are re-enabled! We will use mongodb-memory-server to pass this.
                sh 'npm test' 
                echo '✅ All Jest integration tests passed securely in CI!'
            }
        }

        stage('Build & Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    // 🔥 Fixed: Tags both the specific build ID and 'latest' in one clean command
                    sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} -t ${DOCKER_IMAGE}:latest ."
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                    echo '✅ Docker images pushed securely to cloud registry'
                }
            }
        }
    }
}