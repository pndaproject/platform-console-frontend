node {
    try {
    
        // Mark the code build 'stage'
        stage 'Build'

        deleteDir()

        checkout scm

        def version = env.BRANCH_NAME
        def workspace = pwd()
        
        if(env.BRANCH_NAME=="master") {
            version = sh(returnStdout: true, script: 'git describe --abbrev=0 --tags').trim()
            checkout([$class: 'GitSCM', branches: [[name: "tags/${version}"]], extensions: [[$class: 'CleanCheckout']]])
        }
        
        sh """
            cd console-frontend
            npm install
            echo "{ \\"name\\": \\"console-frontend\\", \\"version\\": \\"${version}\\" }" > package-version.json
            grunt package
        """

        stage 'Test'
        sh '''
        '''

        stage 'Deploy' 
        build job: 'deploy-component', parameters: [[$class: 'StringParameterValue', name: 'branch', value: env.BRANCH_NAME],[$class: 'StringParameterValue', name: 'component', value: "console"],[$class: 'StringParameterValue', name: 'release_path', value: "platform/releases"],[$class: 'StringParameterValue', name: 'release', value: "${workspace}/console-frontend/console-frontend-${version}.tar.gz"]]

        emailext attachLog: true, body: "Build succeeded (see ${env.BUILD_URL})", subject: "[JENKINS] ${env.JOB_NAME} succeeded", to: "${env.EMAIL_RECIPIENTS}"

    }
    catch(error) {
        emailext attachLog: true, body: "Build failed (see ${env.BUILD_URL})", subject: "[JENKINS] ${env.JOB_NAME} failed", to: "${env.EMAIL_RECIPIENTS}"
        currentBuild.result = "FAILED"
        throw error
    }
}
