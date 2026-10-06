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
        
        // Securely injected Database URL
        MONGO_URI = credentials('MONGO_DB_CREDENTIAL')

        // The Ultimate Dummy Variable Block to bypass all 3rd-party startup checks
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
                // 1. Download kubectl directly into the Minikube container's root folder
                sh "docker exec minikube curl -sL https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl -o /kubectl"
                sh "docker exec minikube chmod +x /kubectl"
                
                // 2. Pipe the deployment file and execute using the cluster's internal master key
                sh "cat k8s-deployment.yaml | docker exec -i minikube /kubectl --kubeconfig=/etc/kubernetes/admin.conf apply -f -"
                
                // 3. Force Kubernetes to pull the brand new latest image we just built
                sh "docker exec minikube /kubectl --kubeconfig=/etc/kubernetes/admin.conf set image deployment/gks-backend-deployment api=${IMAGE_NAME}:latest"
                
                echo '🚀 Deployed to Kubernetes successfully!'
            }
        }
    }
}