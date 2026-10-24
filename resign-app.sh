#!/bin/bash
# 重签 .app：新 Profile (opengym_release_acl) + 发布证书
# 用法：bash resign-app.sh <新Profile路径>
set -e
P7B="${1:?用法: bash resign-app.sh <新p7b路径>}"
JBR="C:/Program Files/Huawei/DevEco Studio/jbr/bin/java.exe"
JAR="C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/lib/hap-sign-tool.jar"
APP="E:/Tianshu/opengym-harmony/frontend/harmony/build/outputs/default/harmony-default-unsigned.app"
OUT="E:/Tianshu/opengym-harmony/frontend/harmony/build/outputs/default/opengym-release-v12.app"
"$JBR" -jar "$JAR" sign-app -mode localSign \
  -keyAlias opengymrelease -keyPwd "612670.cmzz" \
  -appCertFile "C:/Users/21972/Desktop/opengym_release.cer" \
  -profileFile "$P7B" -profileSigned 1 \
  -inFile "$APP" \
  -keystoreFile "C:/Users/21972/opengym-release.p12/opengym-release.p12" -keystorePwd "612670.cmzz" \
  -signAlg SHA256withECDSA -outFile "$OUT"
ls -la "$OUT"
