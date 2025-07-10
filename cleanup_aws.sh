#!/bin/bash

# --- 設定変数 ---
# デプロイするAWSリージョン。deploy_aws.sh と同じリージョンにしてください。
REGION="ap-northeast-1" 
PROJECT_NAME="markov-game" # deploy_aws.sh と同じプロジェクト名にしてください。

# --- ヘルパー関数 ---
function log_info() {
    echo "INFO: $1"
}

function log_error() {
    echo "ERROR: $1" >&2
    exit 1
}

function check_command() {
    command -v "$1" >/dev/null 2>&1 || { log_error "$1 コマンドが見つかりません。インストールして再度お試しください。"; }
}

function check_aws_cli() {
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS CLIが設定されていないか、認証情報が無効です。AWS CLIを設定してください。"; }
}

# --- クリーンアップ関数 ---
cleanup_resources() {
    log_info "--- AWSリソースのクリーンアップを開始します ---"

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text) || log_error "AWSアカウントIDの取得に失敗しました。"
    log_info "AWSアカウントID: ${AWS_ACCOUNT_ID}"

    # --- CloudFrontディストリビューションのクリーンアップ ---
    log_info "CloudFrontディストリビューションを検索・削除します..."

    # コメントで検索
    CF_DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Markov Game Frontend'].Id" --output text --region "us-east-1")

    for DISTRIBUTION_ID in ${CF_DISTRIBUTIONS}; do
        if [ -n "${DISTRIBUTION_ID}" ]; then
            log_info "CloudFrontディストリビューション ${DISTRIBUTION_ID} を無効化中..."
            # ディストリビューションの現在の設定を取得
            DIST_CONFIG_JSON=$(aws cloudfront get-distribution-config --id "${DISTRIBUTION_ID}" --region "us-east-1")
            ETAG=$(echo "${DIST_CONFIG_JSON}" | jq -r '.ETag')

            # Enabledをfalseに設定
            UPDATED_CONFIG_JSON=$(echo "${DIST_CONFIG_JSON}" | jq '.DistributionConfig.Enabled = false')

            # update-distribution コマンドにJSONを直接渡す
            aws cloudfront update-distribution --id "${DISTRIBUTION_ID}" --distribution-config "${UPDATED_CONFIG_JSON}" --if-match "${ETAG}" --region "us-east-1" || log_error "CloudFrontディストリビューションの無効化に失敗しました。"

            log_info "CloudFrontディストリビューション ${DISTRIBUTION_ID} が無効化されるまで待機中..."
            aws cloudfront wait distribution-deployed --id "${DISTRIBUTION_ID}" --region "us-east-1" || log_error "CloudFrontディストリビューションの無効化待機中にエラーが発生しました。"

            log_info "CloudFrontディストリビューション ${DISTRIBUTION_ID} を削除中..."
            aws cloudfront delete-distribution --id "${DISTRIBUTION_ID}" --if-match "${ETAG}" --region "us-east-1" || log_error "CloudFrontディストリビューションの削除に失敗しました。"
            log_info "CloudFrontディストリビューション ${DISTRIBUTION_ID} を削除しました。"
        fi
    done

    # --- S3バケットのクリーンアップ (CloudFrontとは独立して処理) ---
    log_info "S3バケットを検索・削除します..."
    # フロントエンドS3バケットを検索
    FRONTEND_BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${PROJECT_NAME}-frontend-')].Name" --output text --region "${REGION}")

    for BUCKET_NAME in ${FRONTEND_BUCKETS}; do
        log_info "S3バケット ${BUCKET_NAME} を処理中..."
        log_info "S3バケット ${BUCKET_NAME} の内容を空にしています..."
        aws s3 rm "s3://${BUCKET_NAME}/" --recursive --region "${REGION}" || log_error "S3バケットの内容の削除に失敗しました。"

        log_info "S3バケット ${BUCKET_NAME} を削除中..."
        aws s3 rb "s3://${BUCKET_NAME}/" --force --region "${REGION}" || log_error "S3バケットの削除に失敗しました。"
        log_info "S3バケット ${BUCKET_NAME} を削除しました。"
    done

    # --- Elastic Beanstalkアプリケーションと環境のクリーンアップ ---
    log_info "Elastic Beanstalkアプリケーションと環境を検索・削除します..."

    # --- Elastic Beanstalkアプリケーションと環境のクリーンアップ ---
    log_info "Elastic Beanstalkアプリケーションと環境を検索・削除します..."

    # アプリケーションを検索
    EB_APPLICATIONS=$(aws elasticbeanstalk describe-applications --query "Applications[?starts_with(ApplicationName, '${PROJECT_NAME}-backend-')].ApplicationName" --output text --region "${REGION}")

    for APP_NAME in ${EB_APPLICATIONS}; do
        log_info "Elastic Beanstalkアプリケーション ${APP_NAME} を処理中..."
        
        # 環境を検索し、終了
        EB_ENVIRONMENTS=$(aws elasticbeanstalk describe-environments --application-name "${APP_NAME}" --query "Environments[].EnvironmentName" --output text --region "${REGION}")
        
        for ENV_NAME in ${EB_ENVIRONMENTS}; do
            log_info "Elastic Beanstalk環境 ${ENV_NAME} を終了中..."
            aws elasticbeanstalk terminate-environment --environment-name "${ENV_NAME}" --region "${REGION}" || log_error "Elastic Beanstalk環境の終了に失敗しました。"
            log_info "Elastic Beanstalk環境 ${ENV_NAME} が終了されるまで待機中..."
            aws elasticbeanstalk wait environment-terminated --environment-names "${ENV_NAME}" --region "${REGION}" || log_error "Elastic Beanstalk環境の終了待機中にエラーが発生しました。"
            log_info "Elastic Beanstalk環境 ${ENV_NAME} を終了しました。"
        done

        log_info "Elastic Beanstalkアプリケーション ${APP_NAME} を削除中..."
        aws elasticbeanstalk delete-application --application-name "${APP_NAME}" --terminate-environments --delete-application-versions --region "${REGION}" || log_error "Elastic Beanstalkアプリケーションの削除に失敗しました。"
        log_info "Elastic Beanstalkアプリケーション ${APP_NAME} を削除しました。"
    done

    # --- Elastic Beanstalkが作成したS3ソースバンドルのクリーンアップ ---
    log_info "Elastic BeanstalkのS3ソースバンドルをクリーンアップします..."
    EB_S3_BUCKET="elasticbeanstalk-${REGION}-${AWS_ACCOUNT_ID}"
    if aws s3api head-bucket --bucket "${EB_S3_BUCKET}" 2>/dev/null; then
        log_info "Elastic BeanstalkのS3バケット ${EB_S3_BUCKET} からソースバンドルを削除中..."
        aws s3 rm "s3://${EB_S3_BUCKET}/elasticbeanstalk/" --recursive --region "${REGION}" || log_error "Elastic Beanstalkソースバンドルの削除に失敗しました。"
        log_info "Elastic Beanstalkソースバンドルを削除しました。"
    else
        log_info "Elastic BeanstalkのS3バケット ${EB_S3_BUCKET} は見つかりませんでした。"
    fi

    log_info "--- AWSリソースのクリーンアップが完了しました ---"
}

# --- メイン処理 ---
main() {
    log_info "--- クリーンアップスクリプトを開始します ---"

    # 必要なコマンドの存在チェック
    check_command "aws"
    check_command "jq" # CloudFrontのETag取得に使用
    check_aws_cli

    cleanup_resources

    log_info "--- クリーンアップスクリプトが完了しました ---"
}

# スクリプト実行
main
