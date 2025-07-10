#!/bin/bash

# --- 設定変数 ---
# デプロイするAWSリージョン。必要に応じて変更してください。
# CloudShellが起動しているリージョンと合わせるのが一般的です。
REGION="ap-northeast-1" 
PROJECT_NAME="markov-game"
# グローバルで一意なIDを生成し、リソース名に付与します
UNIQUE_ID=$(head /dev/urandom | tr -dc a-z0-9 | head -c 8) 

FRONTEND_BUCKET_NAME="${PROJECT_NAME}-frontend-${UNIQUE_ID}"
CLOUDFRONT_DISTRIBUTION_ID="" # CloudFrontデプロイ後に設定されます
FRONTEND_BUILD_DIR="frontend/build"

BACKEND_APP_NAME="${PROJECT_NAME}-backend-${UNIQUE_ID}"
BACKEND_ENV_NAME="${PROJECT_NAME}-env-${UNIQUE_ID}"
BACKEND_ZIP_FILE="backend-app-${UNIQUE_ID}.zip"
BACKEND_SOURCE_BUNDLE_KEY="elasticbeanstalk/${BACKEND_ZIP_FILE}"
BACKEND_URL="" # Elastic Beanstalkデプロイ後に設定されます

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

# --- フロントエンドデプロイ関数 ---
deploy_frontend() {
    log_info "--- フロントエンドのデプロイを開始します ---"

    log_info "1. Reactアプリケーションをビルドします..."
    if [ -d "${FRONTEND_BUILD_DIR}" ]; then
        log_info "ビルドディレクトリ (${FRONTEND_BUILD_DIR}) が存在するため、ビルドをスキップします。"
    else
        # frontendディレクトリに移動してnpmコマンドを実行
        (cd frontend && npm install && npm run build) || log_error "Reactアプリケーションのビルドに失敗しました。"
        log_info "ビルド完了。"
    fi

    log_info "2. S3バケットを作成します: ${FRONTEND_BUCKET_NAME}"
    if [ "${REGION}" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "${FRONTEND_BUCKET_NAME}" --region "${REGION}" || log_error "S3バケットの作成に失敗しました。"
    else
        aws s3api create-bucket --bucket "${FRONTEND_BUCKET_NAME}" --region "${REGION}" --create-bucket-configuration LocationConstraint="${REGION}" || log_error "S3バケットの作成に失敗しました。"
    fi

    log_info "3. S3バケットのパブリックアクセスブロック設定を無効にします..."
    # 注意: アカウントレベルのS3パブリックアクセスブロック設定が有効な場合、
    # このバケットレベルの設定はオーバーライドされます。その場合は、
    # AWS S3コンソールでアカウントレベルの「パブリックポリシーをブロック」を無効にしてください。
    aws s3api put-public-access-block \
        --bucket "${FRONTEND_BUCKET_NAME}" \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
        --region "${REGION}" || log_error "S3パブリックアクセスブロック設定の無効化に失敗しました。"
    sleep 5 # 設定が反映されるのを待つための短い遅延

    log_info "4. S3バケットポリシーを設定します..."
    # バケットポリシーを一時ファイルに書き出し
    cat <<EOF > s3_bucket_policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${FRONTEND_BUCKET_NAME}/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket "${FRONTEND_BUCKET_NAME}" --policy file://s3_bucket_policy.json --region "${REGION}" || log_error "S3バケットポリシーの設定に失敗しました。"
    rm s3_bucket_policy.json # 一時ファイルを削除

    log_info "5. S3バケットの静的ウェブサイトホスティングを設定します..."
    aws s3 website "s3://${FRONTEND_BUCKET_NAME}/" --index-document index.html --error-document index.html --region "${REGION}" || log_error "S3静的ウェブサイトホスティングの設定に失敗しました。"
    
    log_info "6. ビルドファイルをS3にアップロードします..."
    # --delete オプションでS3バケットとローカルビルドディレクトリを同期
    aws s3 sync "${FRONTEND_BUILD_DIR}" "s3://${FRONTEND_BUCKET_NAME}" --delete --region "${REGION}" || log_error "S3へのファイルアップロードに失敗しました。"
    log_info "S3へのアップロード完了。"

    log_info "6. CloudFrontディストリビューションを作成します..."

    # CachingOptimizedポリシーIDを動的に取得
    CACHING_OPTIMIZED_POLICY_ID=$(aws cloudfront list-cache-policies --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Managed-CachingOptimized'].CachePolicy.Id" --output text --region "us-east-1")
    if [ -z "${CACHING_OPTIMIZED_POLICY_ID}" ]; then
        log_error "Managed-CachingOptimizedキャッシュポリシーが見つかりませんでした。"
    fi
    log_info "Managed-CachingOptimizedポリシーID: ${CACHING_OPTIMIZED_POLICY_ID}"

    # S3静的ウェブサイトホスティングのエンドポイントを使用
    S3_WEBSITE_ENDPOINT="${FRONTEND_BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
    
    # CloudFrontディストリビューション設定を一時ファイルに書き出し
    cat <<EOF > cloudfront_config.json
{
    "CallerReference": "$(date +%s)",
    "Aliases": {
        "Quantity": 0
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-Website-Origin",
                "DomainName": "${S3_WEBSITE_ENDPOINT}",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "OriginPath": "",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only",
                    "OriginSslProtocols": {
                        "Quantity": 1,
                        "Items": ["TLSv1.2"]
                    },
                    "OriginReadTimeout": 30,
                    "OriginKeepaliveTimeout": 5
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-Website-Origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "CachePolicyId": "${CACHING_OPTIMIZED_POLICY_ID}",
        "Compress": true,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": ""
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 10
            }
        ]
    },
    "Comment": "Markov Game Frontend",
    "Enabled": true,
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": ""
}
EOF

    DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront_config.json --region "${REGION}" --query 'Distribution.Id' --output text) || log_error "CloudFrontディストリビューションの作成に失敗しました。"
    CLOUDFRONT_DISTRIBUTION_ID="${DISTRIBUTION_ID}"
    log_info "CloudFrontディストリビューションID: ${CLOUDFRONT_DISTRIBUTION_ID}"
    log_info "CloudFrontディストリビューションがデプロイされるまで数分かかります。ステータスを確認してください。"
    
    # CloudFrontのURLを取得
    CLOUDFRONT_DOMAIN_NAME=$(aws cloudfront get-distribution --id "${CLOUDFRONT_DISTRIBUTION_ID}" --region "${REGION}" --query 'Distribution.DomainName' --output text)
    log_info "フロントエンドURL (CloudFront): https://${CLOUDFRONT_DOMAIN_NAME}"
    rm cloudfront_config.json # 一時ファイルを削除
}

# --- バックエンドデプロイ関数 ---
deploy_backend() {
    log_info "--- バックエンドのデプロイを開始します ---"

    log_info "1. Elastic Beanstalk用のProcfileを作成します..."
    cat <<EOF > backend/Procfile
web: uvicorn main:app --host 0.0.0.0 --port 8000
EOF
    log_info "Procfile作成完了。"

    log_info "2. バックエンドアプリケーションをZIP圧縮します..."
    # venvと__pycache__を除外してZIP圧縮
    (cd backend && zip -r "../${BACKEND_ZIP_FILE}" . -x "venv/*" -x "__pycache__/*") || log_error "バックエンドのZIP圧縮に失敗しました。"
    log_info "ZIP圧縮完了: ${BACKEND_ZIP_FILE}"

    log_info "3. Elastic Beanstalkアプリケーションを作成します: ${BACKEND_APP_NAME}"
    aws elasticbeanstalk create-application --application-name "${BACKEND_APP_NAME}" --region "${REGION}" > /dev/null || log_error "Elastic Beanstalkアプリケーションの作成に失敗しました。"

    log_info "4. アプリケーションバージョンをS3にアップロードします..."
    # Elastic Beanstalkが使用するS3バケットにアップロード
    aws s3 cp "${BACKEND_ZIP_FILE}" "s3://elasticbeanstalk-${REGION}-${AWS_ACCOUNT_ID}/${BACKEND_SOURCE_BUNDLE_KEY}" --region "${REGION}" || log_error "アプリケーションバージョンのS3アップロードに失敗しました。"
    
    log_info "5. Elastic Beanstalkアプリケーションバージョンを作成します..."
    aws elasticbeanstalk create-application-version \
        --application-name "${BACKEND_APP_NAME}" \
        --version-label "${UNIQUE_ID}" \
        --source-bundle S3Bucket="elasticbeanstalk-${REGION}-${AWS_ACCOUNT_ID}",S3Key="${BACKEND_SOURCE_BUNDLE_KEY}" \
        --region "${REGION}" || log_error "Elastic Beanstalkアプリケーションバージョンの作成に失敗しました。"

    log_info "6. Elastic Beanstalk環境を作成します: ${BACKEND_ENV_NAME}"
    # 最新のPython 3.x on Amazon Linux 2/2023 を動的に取得
        SOLUTION_STACK_NAME=$(aws elasticbeanstalk list-available-solution-stacks --region "${REGION}" --query "sort(SolutionStacks[?contains(@, 'Python 3') && contains(@, '64bit Amazon Linux')])[-1]" --output text)
    if [ -z "${SOLUTION_STACK_NAME}" ]; then
        log_error "適切なPythonソリューションスタックが見つかりませんでした。"
    fi
    log_info "使用するソリューションスタック: ${SOLUTION_STACK_NAME}"
    log_info "Tier設定: WebServer/Standard/1.0"

    aws elasticbeanstalk create-environment \
        --application-name "${BACKEND_APP_NAME}" \
        --environment-name "${BACKEND_ENV_NAME}" \
        --solution-stack-name "${SOLUTION_STACK_NAME}" \
        --version-label "${UNIQUE_ID}" \
        --tier "WebServer/Standard/1.0" \
        --region "${REGION}" || log_error "Elastic Beanstalk環境の作成に失敗しました。"

    log_info "Elastic Beanstalk環境がデプロイされるまでお待ちください。これには数分かかります..."
    # 環境が作成され、準備完了になるまで待機
    aws elasticbeanstalk wait environment-exists --environment-names "${BACKEND_ENV_NAME}" --region "${REGION}" || log_error "Elastic Beanstalk環境の待機中にエラーが発生しました。"
    aws elasticbeanstalk wait environment-ready --environment-names "${BACKEND_ENV_NAME}" --region "${REGION}" || log_error "Elastic Beanstalk環境の準備中にエラーが発生しました。"
    log_info "Elastic Beanstalk環境のデプロイ完了。"

    # デプロイされた環境のURLを取得
    BACKEND_URL=$(aws elasticbeanstalk describe-environments --environment-names "${BACKEND_ENV_NAME}" --query 'Environments[0].CNAME' --output text --region "${REGION}") || log_error "バックエンドURLの取得に失敗しました。"
    BACKEND_URL="http://${BACKEND_URL}" # CNAMEはhttp://を含まないため追加
    log_info "バックエンドURL (Elastic Beanstalk): ${BACKEND_URL}"
}

# --- 接続更新関数 ---
update_frontend_connection() {
    log_info "--- フロントエンドとバックエンドの接続を更新します ---"

    if [ -z "${BACKEND_URL}" ]; then
        log_error "バックエンドURLが取得できませんでした。フロントエンドの更新をスキップします。"
    fi

    log_info "1. frontend/src/App.js の API_BASE_URL を更新します..."
    # sed -i はmacOSとLinuxで挙動が異なるため、CloudShell (Linux) 向けに直接編集
    # macOSで実行する場合は `sed -i ''` のように空の拡張子を指定する必要があります
    sed -i "s|const API_BASE_URL = '.*';|const API_BASE_URL = '${BACKEND_URL}';|g" frontend/src/App.js || log_error "App.jsの更新に失敗しました。"
    log_info "App.js 更新完了。"

    log_info "2. Reactアプリケーションを再ビルドします..."
    (cd frontend && npm run build) || log_error "Reactアプリケーションの再ビルドに失敗しました。"
    log_info "再ビルド完了。"

    log_info "3. 更新されたビルドファイルをS3に再アップロードします..."
    aws s3 sync "${FRONTEND_BUILD_DIR}" "s3://${FRONTEND_BUCKET_NAME}" --delete --region "${REGION}" || log_error "S3へのファイル再アップロードに失敗しました。"
    log_info "S3への再アップロード完了。"

    if [ -z "${CLOUDFRONT_DISTRIBUTION_ID}" ]; then
        log_error "CloudFrontディストリビューションIDが取得できませんでした。キャッシュの無効化をスキップします。"
    fi

    log_info "4. CloudFrontキャッシュを無効化します..."
    aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" --paths "/*" --region "${REGION}" || log_error "CloudFrontキャッシュの無効化に失敗しました。"
    log_info "CloudFrontキャッシュの無効化リクエストを送信しました。反映には数分かかります。"
}

# --- メイン処理 ---
main() {
    log_info "--- デプロイスクリプトを開始します ---"

    # 必要なコマンドの存在チェック
    check_command "npm"
    check_command "zip"
    check_aws_cli

    # AWSアカウントIDを取得 (Elastic BeanstalkのS3バケット名に使用)
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text) || log_error "AWSアカウントIDの取得に失敗しました。"
    log_info "AWSアカウントID: ${AWS_ACCOUNT_ID}"

    # フロントエンドのデプロイを実行
    deploy_frontend

    # バックエンドのデプロイを実行
    deploy_backend

    # フロントエンドとバックエンドの接続を更新し、再デプロイ
    update_frontend_connection

    log_info "--- デプロイが完了しました！ ---"
    log_info "フロントエンドURL: https://${CLOUDFRONT_DOMAIN_NAME}"
    log_info "バックエンドURL: ${BACKEND_URL}"
    log_info "CloudFrontのキャッシュが完全にクリアされるまで、しばらく時間がかかる場合があります。"
    log_info "Elastic Beanstalk環境のヘルスチェックが正常になるまで、バックエンドが利用できない場合があります。"
}

# スクリプト実行
main
