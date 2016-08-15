node {
    try {
    
        // Mark the code build 'stage'
        stage 'Build'

        def workspace = pwd() 

        sh '''
            echo $PWD
            echo $BRANCH_NAME
            cd $PWD@script/console-frontend;
            npm install
            echo "{ \\"name\\": \\"console-frontend\\", \\"version\\": \\"$BRANCH_NAME\\" }" > package-version.json
            grunt package
        '''

        stage 'Test'
        sh '''
        '''

        stage 'Deploy' 
        build job: 'deploy-component', parameters: [[$class: 'StringParameterValue', name: 'branch', value: env.BRANCH_NAME],[$class: 'StringParameterValue', name: 'component', value: "console"],[$class: 'StringParameterValue', name: 'release_path', value: "platform/releases"],[$class: 'StringParameterValue', name: 'release', value: "${workspace}@script/console-frontend/console-frontend-${env.BRANCH_NAME}.tar.gz"]]

        emailext attachLog: true, body: "Build succeeded (see ${env.BUILD_URL})", subject: "[JENKINS] ${env.JOB_NAME} succeeded", to: "${env.EMAIL_RECIPIENTS}"

    }
    catch(error) {
        emailext attachLog: true, body: "Build failed (see ${env.BUILD_URL})", subject: "[JENKINS] ${env.JOB_NAME} failed", to: "${env.EMAIL_RECIPIENTS}"
        currentBuild.result = "FAILED"
        throw error
    }
}
