# 개발 환경
pm2 start ecosystem.config.js --env development
cd client
pm2 start ecosystem.config.js --env development

# 배포 환경
# pm2 start ecosystem.config.js --env production
# cd client/build
# pm2 start ecosystem.config.js
