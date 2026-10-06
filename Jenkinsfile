pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

   environment {
        IMAGE_NAME = "gks-fitness-backend"
        IMAGE_TAG = "v1.${env.BUILD_ID}"
        MONGO_URI = credentials('MONGO_DB_CREDENTIAL')
        GOOGLE_CLIENT_ID = "ci_dummy_client_id"
        GOOGLE_CLIENT_SECRET = "ci_dummy_secret"
        GOOGLE_CALLBACK_URL = "http://localhost:5000/auth/google/callback"
        GEMINI_API_KEY = "ci_dummy_gemini_key"
        RAZORPAY_KEY_ID = "ci_dummy_razorpay_key_id"
        RAZORPAY_KEY_SECRET = "ci_dummy_razorpay_secret"
        JWT_SECRET = "ci_dummy_jwt_secret"
        PORT = "5000"
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
                sh 'npm test'
                echo '✅ All Jest integration tests passed!'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
                echo '✅ Docker image built securely'
            }
        }

       stage('Deploy to Kubernetes') {
            steps {
                sh "docker exec minikube curl -sL https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl -o /kubectl"
                sh "docker exec minikube chmod +x /kubectl"
                
                // Dynamically grabs the container IP to completely bypass DNS failures
                sh 'cat k8s-deployment.yaml | docker exec -i minikube sh -c "/kubectl --kubeconfig=/etc/kubernetes/admin.conf --server=https://$(hostname -i):8443 --insecure-skip-tls-verify=true apply -f -"'
                
                sh 'docker exec minikube sh -c "/kubectl --kubeconfig=/etc/kubernetes/admin.conf --server=https://$(hostname -i):8443 --insecure-skip-tls-verify=true set image deployment/gks-backend-deployment api=gks-fitness-backend:latest"'
                
                echo '🚀 Deployed to Kubernetes successfully!'
            }
        }
    }
}