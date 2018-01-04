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
        
        sh("./build.sh ${version}")

        stage 'Deploy'
        build job: 'deploy', parameters: [[$class: 'StringParameterValue', name: 'artifacts_path', value: "${workspace}/pnda-build"]]

        stage 'Notifier'
        build job: 'notifier', parameters: [[$class: 'StringParameterValue', name: 'message', value: "${env.JOB_NAME} succeeded: see [Jenkins job ${env.BUILD_ID}](${env.BUILD_URL})"]]
    }
    catch(error) {
        build job: 'notifier', parameters: [[$class: 'StringParameterValue', name: 'message', value: "${env.JOB_NAME} failed: see [Jenkins job ${env.BUILD_ID}](${env.BUILD_URL})"]]
        currentBuild.result = "FAILED"
        throw error
    }
}
